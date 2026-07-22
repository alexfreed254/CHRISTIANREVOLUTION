"""Admin + public routes for Daily Spiritual Materials."""

from __future__ import annotations

from datetime import datetime
from functools import wraps
from typing import Callable
import secrets

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

try:
    from .spiritual_materials import (
        MATERIAL_TYPES,
        MATERIAL_TYPE_LABELS,
        LIBRARY_SECTIONS,
        SUPPORTED_LANGUAGES,
        normalize_material_row,
        pick_language_version,
        build_dashboard_stats,
        is_publicly_visible,
        effective_status,
    )
    from .kenya_languages import catalog_response, is_supported as is_lang_supported
    from .translation_service import apply_content_language, translation_enabled
except ImportError:
    from spiritual_materials import (
        MATERIAL_TYPES,
        MATERIAL_TYPE_LABELS,
        LIBRARY_SECTIONS,
        SUPPORTED_LANGUAGES,
        normalize_material_row,
        pick_language_version,
        build_dashboard_stats,
        is_publicly_visible,
        effective_status,
    )
    from kenya_languages import catalog_response, is_supported as is_lang_supported
    from translation_service import apply_content_language, translation_enabled


def register_spiritual_routes(
    app,
    *,
    supabase,
    db_ready,
    db_execute,
    try_supabase,
    SPIRITUAL_MATERIALS_STORE,
):
    def _get_member(member_id: str):
        if not db_ready():
            return None
        try:
            result = db_execute(
                lambda client: client.table("members").select("*").eq("id", member_id).single().execute()
            )
            return result.data
        except Exception:
            return None

    def _load_all_materials() -> list[dict]:
        rows = [normalize_material_row(dict(m)) for m in SPIRITUAL_MATERIALS_STORE]
        if db_ready():
            try:
                result = db_execute(
                    lambda client: client.table("spiritual_materials").select("*").order("created_at", desc=True).limit(2000).execute()
                )
                db_rows = [normalize_material_row(r) for r in (result.data or [])]
                by_id = {str(r.get('id')): r for r in rows}
                for r in db_rows:
                    by_id[str(r.get('id'))] = r
                rows = list(by_id.values())
            except Exception as e:
                print(f"spiritual_materials DB load: {e}")
        return rows

    def _find_material(material_id: str) -> dict | None:
        return next((m for m in _load_all_materials() if str(m.get('id')) == str(material_id)), None)

    def super_admin_required(fn: Callable):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            member = _get_member(get_jwt_identity())
            if not member:
                return jsonify({'error': 'Unauthorized'}), 401
            if (member.get('role') or 'member') != 'super_admin':
                return jsonify({'error': 'Superadmin access required'}), 403
            request.admin_member = member
            return fn(*args, **kwargs)
        return wrapper

    def optional_jwt_member():
        try:
            verify_jwt_in_request(optional=True)
            identity = get_jwt_identity()
            if identity:
                return _get_member(identity)
        except Exception:
            pass
        return None

    def _build_row(data: dict, created_by: str | None = None) -> dict:
        now = datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'
        publish_mode = (data.get('publish_mode') or 'immediate').lower()
        publish_at = data.get('publish_at') or now
        status = (data.get('status') or '').lower()

        if publish_mode == 'immediate':
            status = 'published'
            publish_at = now
        elif publish_mode == 'schedule':
            status = 'scheduled'
        elif publish_mode == 'draft':
            status = 'draft'
        elif not status:
            status = 'draft'

        return {
            'id': data.get('id') or f"spirit-{secrets.token_hex(4)}",
            'title': (data.get('title') or '').strip(),
            'material_type': data.get('material_type') or 'daily_devotional',
            'description': data.get('description') or '',
            'content': data.get('content') or '',
            'file_url': data.get('file_url') or '',
            'video_url': data.get('video_url') or '',
            'audio_url': data.get('audio_url') or '',
            'thumbnail_url': data.get('thumbnail_url') or '',
            'language': data.get('language') or 'en',
            'parent_id': data.get('parent_id'),
            'all_languages': bool(data.get('all_languages')),
            'category': data.get('category') or '',
            'ministry': data.get('ministry') or '',
            'speaker': data.get('speaker') or '',
            'bible_reference': data.get('bible_reference') or '',
            'status': status,
            'publish_at': publish_at,
            'available_until': data.get('available_until'),
            'featured': bool(data.get('featured')),
            'visibility': data.get('visibility') or 'public',
            'view_count': int(data.get('view_count') or 0),
            'download_count': int(data.get('download_count') or 0),
            'created_by': created_by,
            'created_at': data.get('created_at') or now,
            'updated_at': now,
        }

    def _persist_row(row: dict) -> dict:
        row = normalize_material_row(row)
        found = False
        for i, item in enumerate(SPIRITUAL_MATERIALS_STORE):
            if str(item.get('id')) == str(row.get('id')):
                SPIRITUAL_MATERIALS_STORE[i] = row
                found = True
                break
        if not found:
            SPIRITUAL_MATERIALS_STORE.insert(0, row)

        if db_ready():
            try:
                db_row = {k: v for k, v in row.items() if k not in ('material_type_label', 'type')}
                if db_row.get('id', '').startswith('spirit-'):
                    db_row.pop('id', None)
                result = db_execute(
                    lambda client: client.table("spiritual_materials").upsert(db_row).execute()
                )
                if result.data:
                    row = normalize_material_row({**row, **result.data[0]})
            except Exception as e:
                print(f"spiritual_materials persist: {e}")
        return row

    # ── Public ─────────────────────────────────────────────────────────────
    @app.route('/api/discipleship/meta', methods=['GET'])
    def discipleship_meta():
        catalog = catalog_response()
        return jsonify({
            'material_types': [{'id': t, 'label': MATERIAL_TYPE_LABELS.get(t, t)} for t in MATERIAL_TYPES],
            'sections': LIBRARY_SECTIONS,
            'languages': catalog['languages'],
            'language_groups': catalog['groups'],
            'ai_translation': translation_enabled(),
        }), 200

    @app.route('/api/discipleship/library', methods=['GET'])
    def discipleship_library():
        member = optional_jwt_member()
        lang = (request.args.get('lang') or (member or {}).get('preferred_language') or 'en').lower()
        if not is_lang_supported(lang):
            lang = 'en'
        section = (request.args.get('section') or '').strip()
        material_type = (request.args.get('type') or '').strip()
        category = (request.args.get('category') or '').strip()
        q = (request.args.get('q') or '').strip().lower()

        materials = _load_all_materials()
        visible = [
            m for m in materials
            if is_publicly_visible(m, member_logged_in=bool(member))
        ]

        if section:
            sec = next((s for s in LIBRARY_SECTIONS if s['id'] == section), None)
            if sec:
                visible = [m for m in visible if m.get('material_type') in sec['types']]
        if material_type:
            visible = [m for m in visible if m.get('material_type') == material_type]
        if category:
            visible = [m for m in visible if (m.get('category') or '').lower() == category.lower()]
        if q:
            visible = [
                m for m in visible
                if q in (m.get('title') or '').lower()
                or q in (m.get('description') or '').lower()
                or q in (m.get('speaker') or '').lower()
            ]

        # Prefer one language per family (base materials only in list)
        bases = [m for m in visible if not m.get('parent_id')]
        localized = []
        for base in bases:
            picked = pick_language_version(materials, base['id'], lang) or base
            if picked and is_publicly_visible(picked, member_logged_in=bool(member)):
                localized.append(
                    apply_content_language(
                        picked, lang, text_fields=['title', 'description', 'category', 'ministry', 'speaker']
                    )
                )

        localized.sort(key=lambda m: m.get('publish_at') or m.get('created_at') or '', reverse=True)
        page = max(1, int(request.args.get('page') or 1))
        per_page = min(50, max(1, int(request.args.get('per_page') or 24)))
        start = (page - 1) * per_page
        page_items = localized[start:start + per_page]

        return jsonify({
            'materials': page_items,
            'total': len(localized),
            'page': page,
            'per_page': per_page,
            'total_pages': max(1, (len(localized) + per_page - 1) // per_page),
            'language': lang,
            'ai_translation': translation_enabled(),
        }), 200

    @app.route('/api/discipleship/today', methods=['GET'])
    def discipleship_today():
        member = optional_jwt_member()
        lang = (request.args.get('lang') or (member or {}).get('preferred_language') or 'en').lower()
        if not is_lang_supported(lang):
            lang = 'en'
        materials = _load_all_materials()
        stats = build_dashboard_stats(materials)
        today = stats.get('today_material')
        if today:
            today = pick_language_version(materials, today['id'], lang) or today
            if not is_publicly_visible(today, member_logged_in=bool(member)):
                today = None
            elif today:
                today = apply_content_language(today, lang)
        return jsonify({'material': today, 'language': lang, 'ai_translation': translation_enabled()}), 200

    @app.route('/api/discipleship/materials/<material_id>', methods=['GET'])
    def discipleship_material_detail(material_id):
        member = optional_jwt_member()
        lang = (request.args.get('lang') or (member or {}).get('preferred_language') or 'en').lower()
        if not is_lang_supported(lang):
            lang = 'en'
        materials = _load_all_materials()
        material = pick_language_version(materials, material_id, lang)
        if not material or not is_publicly_visible(material, member_logged_in=bool(member)):
            return jsonify({'error': 'Material not found'}), 404

        material = apply_content_language(material, lang)

        translations = [
            normalize_material_row(m) for m in materials
            if str(m.get('id')) == str(material.get('parent_id') or material.get('id'))
            or str(m.get('parent_id')) == str(material.get('parent_id') or material.get('id'))
        ]

        # bump views in memory
        material['view_count'] = int(material.get('view_count') or 0) + 1
        _persist_row(material)

        saved = completed = False
        if member and db_ready():
            try:
                save = db_execute(
                    lambda client: client.table("material_saves").select("material_id").eq("member_id", member['id']).eq("material_id", material['id']).execute()
                )
                saved = bool(save.data)
                done = db_execute(
                    lambda client: client.table("material_completions").select("material_id").eq("member_id", member['id']).eq("material_id", material['id']).execute()
                )
                completed = bool(done.data)
            except Exception:
                pass

        return jsonify({
            'material': material,
            'translations': translations,
            'saved': saved,
            'completed': completed,
            'ai_translation': translation_enabled(),
        }), 200

    @app.route('/api/discipleship/materials/<material_id>/save', methods=['POST'])
    @jwt_required()
    def discipleship_save_material(material_id):
        member_id = get_jwt_identity()
        if not db_ready():
            return jsonify({'status': 'ok', 'saved': True}), 200
        db_execute(
            lambda client: client.table("material_saves").upsert({
                'member_id': member_id,
                'material_id': material_id,
            }).execute()
        )
        return jsonify({'status': 'ok', 'saved': True}), 200

    @app.route('/api/discipleship/materials/<material_id>/complete', methods=['POST'])
    @jwt_required()
    def discipleship_complete_material(material_id):
        member_id = get_jwt_identity()
        if not db_ready():
            return jsonify({'status': 'ok', 'completed': True}), 200
        db_execute(
            lambda client: client.table("material_completions").upsert({
                'member_id': member_id,
                'material_id': material_id,
            }).execute()
        )
        return jsonify({'status': 'ok', 'completed': True}), 200

    @app.route('/api/discipleship/materials/<material_id>/download', methods=['POST'])
    def discipleship_download_material(material_id):
        material = _find_material(material_id)
        if not material:
            return jsonify({'error': 'Material not found'}), 404
        material['download_count'] = int(material.get('download_count') or 0) + 1
        _persist_row(material)
        return jsonify({'status': 'ok', 'download_count': material['download_count']}), 200

    # ── Superadmin ─────────────────────────────────────────────────────────
    @app.route('/api/admin/spiritual-materials/stats', methods=['GET'])
    @super_admin_required
    def admin_spiritual_stats():
        materials = _load_all_materials()
        stats = build_dashboard_stats(materials)
        return jsonify(stats), 200

    @app.route('/api/admin/spiritual-materials', methods=['GET'])
    @super_admin_required
    def admin_list_spiritual_materials():
        status = (request.args.get('status') or '').strip().lower()
        material_type = (request.args.get('type') or '').strip()
        materials = _load_all_materials()
        if status:
            materials = [m for m in materials if (m.get('status') or '') == status]
        if material_type:
            materials = [m for m in materials if m.get('material_type') == material_type]
        materials.sort(key=lambda m: m.get('updated_at') or m.get('created_at') or '', reverse=True)
        return jsonify({'materials': materials, 'total': len(materials)}), 200

    @app.route('/api/admin/spiritual-materials', methods=['POST'])
    @super_admin_required
    def admin_create_spiritual_material():
        data = request.get_json(silent=True) or {}
        title = (data.get('title') or '').strip()
        if not title:
            return jsonify({'error': 'title is required'}), 400
        if data.get('material_type') and data['material_type'] not in MATERIAL_TYPES:
            return jsonify({'error': 'invalid material_type'}), 400

        row = _build_row(data, created_by=request.admin_member.get('id'))
        row = _persist_row(row)
        return jsonify({'material': row}), 201

    @app.route('/api/admin/spiritual-materials/<material_id>', methods=['PATCH'])
    @super_admin_required
    def admin_update_spiritual_material(material_id):
        data = request.get_json(silent=True) or {}
        existing = _find_material(material_id)
        if not existing:
            return jsonify({'error': 'Material not found'}), 404
        merged = {**existing, **{k: v for k, v in data.items() if v is not None}}
        if data.get('publish_mode') == 'immediate':
            merged['status'] = 'published'
            merged['publish_at'] = datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'
        elif data.get('publish_mode') == 'schedule':
            merged['status'] = 'scheduled'
        row = _persist_row(merged)
        return jsonify({'material': row}), 200

    @app.route('/api/admin/spiritual-materials/<material_id>', methods=['DELETE'])
    @super_admin_required
    def admin_delete_spiritual_material(material_id):
        SPIRITUAL_MATERIALS_STORE[:] = [
            m for m in SPIRITUAL_MATERIALS_STORE if str(m.get('id')) != str(material_id)
        ]
        if db_ready():
            try:
                db_execute(
                    lambda client: client.table("spiritual_materials").delete().eq("id", material_id).execute()
                )
            except Exception as e:
                print(f"spiritual_materials delete: {e}")
        return jsonify({'status': 'ok'}), 200

    @app.route('/api/admin/spiritual-materials/<material_id>/publish', methods=['POST'])
    @super_admin_required
    def admin_publish_spiritual_material(material_id):
        existing = _find_material(material_id)
        if not existing:
            return jsonify({'error': 'Material not found'}), 404
        existing['status'] = 'published'
        existing['publish_at'] = datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'
        row = _persist_row(existing)
        return jsonify({'material': row}), 200

    @app.route('/api/admin/spiritual-materials/<material_id>/archive', methods=['POST'])
    @super_admin_required
    def admin_archive_spiritual_material(material_id):
        existing = _find_material(material_id)
        if not existing:
            return jsonify({'error': 'Material not found'}), 404
        existing['status'] = 'archived'
        row = _persist_row(existing)
        return jsonify({'material': row}), 200
