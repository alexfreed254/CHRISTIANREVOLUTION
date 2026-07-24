"""Admin API helpers and route registration for superadmin dashboard."""

from __future__ import annotations

from datetime import datetime
from functools import wraps
from typing import Callable
import json
import os
import secrets

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity


ADMIN_ROLES = {"admin", "super_admin"}


def register_admin_routes(app, *, socketio, supabase, db_ready, db_execute, try_supabase,
                          public_member, SEED_MEDIA, SEED_STREAMS, SEED_SERIES, MEDIA_STORE, STREAM_STORE,
                          snapshot_stats=None, broadcast_stats=None):
    """Attach /api/admin/* routes to the Flask app."""

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

    def admin_required(fn: Callable):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            member_id = get_jwt_identity()
            member = _get_member(member_id)
            if not member:
                return jsonify({'error': 'Unauthorized'}), 401
            if (member.get('role') or 'member') not in ADMIN_ROLES:
                return jsonify({'error': 'Admin access required'}), 403
            request.admin_member = member
            return fn(*args, **kwargs)
        return wrapper

    def normalize_media_row(row: dict) -> dict:
        """Map DB media row to frontend shape."""
        if not row:
            return row
        out = dict(row)
        out.setdefault('video_url', row.get('url') or row.get('video_url'))
        out.setdefault('url', row.get('url') or row.get('video_url'))
        out.setdefault('duration', row.get('duration') or row.get('duration_seconds') or 0)
        out.setdefault('duration_seconds', out['duration'])
        out.setdefault('upload_date', row.get('upload_date') or row.get('published_at') or row.get('created_at'))
        out.setdefault('topics', row.get('topics') or [])
        out.setdefault('available_languages', row.get('available_languages') or [row.get('language') or 'en'])
        out.setdefault('view_count', row.get('view_count') or 0)
        out.setdefault('like_count', row.get('like_count') or 0)
        out.setdefault('type', row.get('type') or row.get('media_type') or 'video')
        return out

    def _notify_stats():
        if callable(broadcast_stats):
            try:
                broadcast_stats()
            except Exception as e:
                print(f"admin stats broadcast failed: {e}")

    # ── Stats ──────────────────────────────────────────────────────────────
    @app.route('/api/admin/stats', methods=['GET'])
    @admin_required
    def admin_stats():
        if callable(snapshot_stats):
            return jsonify(snapshot_stats()), 200

        members = try_supabase(lambda: supabase.table("members").select("id", count="exact").execute(), None)
        giving = try_supabase(lambda: supabase.table("giving").select("amount").execute(), None)
        prayers = try_supabase(lambda: supabase.table("prayer_requests").select("id", count="exact").execute(), None)
        streams = try_supabase(lambda: supabase.table("live_streams").select("id", count="exact").execute(), None)

        total_giving = 0.0
        if giving and giving.data:
            total_giving = sum(float(g.get('amount') or 0) for g in giving.data)

        return jsonify({
            'members': (members.count if members and getattr(members, 'count', None) is not None
                        else len(members.data) if members and members.data else 0),
            'giving_total': total_giving,
            'giving_count': len(giving.data) if giving and giving.data else 0,
            'prayers': (prayers.count if prayers and getattr(prayers, 'count', None) is not None
                        else len(prayers.data) if prayers and prayers.data else 0),
            'streams': (streams.count if streams and getattr(streams, 'count', None) is not None
                        else len(STREAM_STORE)),
            'media': len(MEDIA_STORE),
            'live_now': sum(1 for s in STREAM_STORE if s.get('status') == 'live'),
            'online_now': 0,
            'watching_now': 0,
            'reactions': 0,
        }), 200

    # ── Members ────────────────────────────────────────────────────────────
    @app.route('/api/admin/members', methods=['GET'])
    @admin_required
    def admin_list_members():
        q = (request.args.get('q') or '').strip().lower()
        result = db_execute(
            lambda client: client.table("members").select("*").order("joined_at", desc=True).limit(500).execute()
        )
        rows = [public_member(m) for m in (result.data or [])]
        if q:
            rows = [m for m in rows if q in (m.get('full_name') or '').lower()
                    or q in (m.get('email') or '').lower()
                    or q in (m.get('username') or '').lower()
                    or q in (m.get('unique_id') or '').lower()]
        return jsonify({'members': rows, 'total': len(rows)}), 200

    @app.route('/api/admin/members/<member_id>', methods=['PATCH'])
    @admin_required
    def admin_update_member(member_id):
        data = request.get_json(silent=True) or {}
        allowed = {}
        if 'role' in data:
            role = data['role']
            if role not in ('member', 'volunteer', 'leader', 'admin', 'super_admin'):
                return jsonify({'error': 'Invalid role'}), 400
            # Only super_admin can create super_admin
            if role == 'super_admin' and request.admin_member.get('role') != 'super_admin':
                return jsonify({'error': 'Only super_admin can assign super_admin'}), 403
            allowed['role'] = role
        if 'growth_stage' in data:
            allowed['growth_stage'] = data['growth_stage']
        if 'engagement_score' in data:
            allowed['engagement_score'] = int(data['engagement_score'])
        if request.admin_member.get('role') == 'super_admin':
            for field in ('full_name', 'phone', 'email', 'continent', 'country', 'city',
                            'village', 'bio', 'profile_photo_url', 'membership_status',
                            'preferred_language', 'timezone'):
                if field in data:
                    val = data[field]
                    allowed[field] = val.strip() if isinstance(val, str) else val
            if 'ministry_interests' in data:
                interests = data['ministry_interests']
                if isinstance(interests, list):
                    allowed['ministry_interests'] = json.dumps(
                        [str(v).strip() for v in interests if str(v).strip()]
                    )
        if not allowed:
            return jsonify({'error': 'No valid fields to update'}), 400

        result = db_execute(
            lambda client: client.table("members").update(allowed).eq("id", member_id).execute()
        )
        if not result.data:
            return jsonify({'error': 'Member not found or update failed'}), 404
        return jsonify({'member': public_member(result.data[0])}), 200

    @app.route('/api/admin/members/<member_id>', methods=['DELETE'])
    @admin_required
    def admin_delete_member(member_id):
        if member_id == request.admin_member.get('id'):
            return jsonify({'error': 'Cannot delete your own account'}), 400
        db_execute(lambda client: client.table("members").delete().eq("id", member_id).execute())
        return jsonify({'status': 'ok'}), 200

    # ── Streams ────────────────────────────────────────────────────────────
    @app.route('/api/admin/streams', methods=['GET'])
    @admin_required
    def admin_list_streams():
        db_rows = try_supabase(
            lambda: supabase.table("live_streams").select("*").order("created_at", desc=True).execute(),
            None
        )
        rows = list(db_rows.data) if db_rows and db_rows.data else []
        # Include in-memory seed streams not in DB
        db_ids = {r.get('id') for r in rows}
        for s in STREAM_STORE:
            if s.get('id') not in db_ids:
                rows.append(s)
        return jsonify({'streams': rows}), 200

    @app.route('/api/admin/streams', methods=['POST'])
    @admin_required
    def admin_create_stream():
        data = request.get_json(silent=True) or {}
        title = (data.get('title') or '').strip()
        stream_url = (data.get('stream_url') or '').strip()
        if not title or not stream_url:
            return jsonify({'error': 'title and stream_url are required'}), 400

        row = {
            'title': title,
            'description': data.get('description') or '',
            'stream_url': stream_url,
            'thumbnail_url': data.get('thumbnail_url') or '',
            'status': data.get('status') or 'scheduled',
            'viewer_count': 0,
            'like_count': 0,
            'speaker': data.get('speaker') or '',
            'category': data.get('category') or 'service',
            'scheduled_for': data.get('scheduled_for'),
        }
        if row['status'] == 'live':
            row['started_at'] = datetime.utcnow().isoformat()

        if db_ready():
            try:
                result = db_execute(lambda client: client.table("live_streams").insert(row).execute())
                if result.data:
                    created = result.data[0]
                    STREAM_STORE.insert(0, created)
                    _notify_stats()
                    return jsonify({'stream': created}), 201
            except Exception as e:
                print(f"Stream DB insert failed, using memory: {e}")

        row['id'] = f"stream-{secrets.token_hex(4)}"
        row['started_at'] = row.get('started_at')
        STREAM_STORE.insert(0, row)
        _notify_stats()
        return jsonify({'stream': row}), 201

    @app.route('/api/admin/streams/<stream_id>', methods=['PATCH'])
    @admin_required
    def admin_update_stream(stream_id):
        data = request.get_json(silent=True) or {}
        allowed_keys = ['title', 'description', 'stream_url', 'thumbnail_url', 'status',
                        'speaker', 'category', 'scheduled_for', 'viewer_count', 'like_count']
        updates = {k: data[k] for k in allowed_keys if k in data}
        if updates.get('status') == 'live' and 'started_at' not in updates:
            updates['started_at'] = datetime.utcnow().isoformat()
        if updates.get('status') == 'ended':
            updates['ended_at'] = datetime.utcnow().isoformat()

        if db_ready():
            try:
                result = db_execute(
                    lambda client: client.table("live_streams").update(updates).eq("id", stream_id).execute()
                )
                if result.data:
                    updated = result.data[0]
                    for i, s in enumerate(STREAM_STORE):
                        if str(s.get('id')) == str(stream_id):
                            STREAM_STORE[i] = {**s, **updated}
                            break
                    _notify_stats()
                    return jsonify({'stream': updated}), 200
            except Exception as e:
                print(f"Stream DB update failed: {e}")

        for i, s in enumerate(STREAM_STORE):
            if str(s.get('id')) == str(stream_id):
                STREAM_STORE[i] = {**s, **updates}
                _notify_stats()
                return jsonify({'stream': STREAM_STORE[i]}), 200
        return jsonify({'error': 'Stream not found'}), 404

    @app.route('/api/admin/streams/<stream_id>', methods=['DELETE'])
    @admin_required
    def admin_delete_stream(stream_id):
        if db_ready():
            try:
                db_execute(lambda client: client.table("live_streams").delete().eq("id", stream_id).execute())
            except Exception as e:
                print(f"Stream delete DB error: {e}")
        STREAM_STORE[:] = [s for s in STREAM_STORE if str(s.get('id')) != str(stream_id)]
        _notify_stats()
        return jsonify({'status': 'ok'}), 200

    # ── Media ──────────────────────────────────────────────────────────────
    @app.route('/api/admin/media', methods=['GET'])
    @admin_required
    def admin_list_media():
        return jsonify({'media': [normalize_media_row(m) for m in MEDIA_STORE]}), 200

    @app.route('/api/admin/media', methods=['POST'])
    @admin_required
    def admin_create_media():
        data = request.get_json(silent=True) or {}
        title = (data.get('title') or '').strip()
        video_url = (data.get('video_url') or data.get('url') or '').strip()
        if not title or not video_url:
            return jsonify({'error': 'title and video_url are required'}), 400

        now = datetime.utcnow().isoformat()
        item = {
            'id': f"media-{secrets.token_hex(4)}",
            'title': title,
            'description': data.get('description') or '',
            'speaker': data.get('speaker') or '',
            'series_id': data.get('series_id'),
            'episode_number': data.get('episode_number'),
            'duration': int(data.get('duration') or data.get('duration_seconds') or 0),
            'thumbnail_url': data.get('thumbnail_url') or '',
            'video_url': video_url,
            'audio_url': data.get('audio_url') or '',
            'view_count': 0,
            'like_count': 0,
            'language': data.get('language') or 'en',
            'available_languages': data.get('available_languages') or ['en'],
            'topics': data.get('topics') or [],
            'bible_reference': data.get('bible_reference') or '',
            'upload_date': now,
            'type': 'video',
            'is_live': False,
            'is_new': True,
        }

        if db_ready():
            try:
                db_row = {
                    'title': item['title'],
                    'description': item['description'],
                    'media_type': 'video',
                    'url': video_url,
                    'thumbnail_url': item['thumbnail_url'],
                    'duration_seconds': item['duration'],
                    'series': data.get('series') or '',
                    'speaker': item['speaker'],
                    'language': item['language'],
                    'view_count': 0,
                    'published_at': now,
                }
                result = db_execute(lambda client: client.table("media").insert(db_row).execute())
                if result.data:
                    item['id'] = result.data[0]['id']
                    item = normalize_media_row({**result.data[0], **item})
            except Exception as e:
                print(f"Media DB insert failed, using memory: {e}")

        MEDIA_STORE.insert(0, item)
        _notify_stats()
        return jsonify({'media': item}), 201

    @app.route('/api/admin/media/<media_id>', methods=['PATCH'])
    @admin_required
    def admin_update_media(media_id):
        data = request.get_json(silent=True) or {}
        for i, m in enumerate(MEDIA_STORE):
            if str(m.get('id')) == str(media_id):
                updated = {**m, **{k: v for k, v in data.items() if v is not None}}
                if 'video_url' in data:
                    updated['url'] = data['video_url']
                for field in ('audio_url', 'bible_reference', 'topics', 'description', 'speaker', 'title', 'thumbnail_url', 'duration'):
                    if field in data:
                        updated[field] = data[field]
                MEDIA_STORE[i] = updated
                if db_ready():
                    try:
                        db_updates = {}
                        if 'title' in data: db_updates['title'] = data['title']
                        if 'description' in data: db_updates['description'] = data['description']
                        if 'video_url' in data: db_updates['url'] = data['video_url']
                        if 'thumbnail_url' in data: db_updates['thumbnail_url'] = data['thumbnail_url']
                        if 'speaker' in data: db_updates['speaker'] = data['speaker']
                        if 'duration' in data: db_updates['duration_seconds'] = int(data['duration'])
                        if db_updates:
                            db_execute(lambda client: client.table("media").update(db_updates).eq("id", media_id).execute())
                    except Exception as e:
                        print(f"Media DB update: {e}")
                _notify_stats()
                return jsonify({'media': normalize_media_row(updated)}), 200
        return jsonify({'error': 'Media not found'}), 404

    @app.route('/api/admin/media/<media_id>', methods=['DELETE'])
    @admin_required
    def admin_delete_media(media_id):
        MEDIA_STORE[:] = [m for m in MEDIA_STORE if str(m.get('id')) != str(media_id)]
        if db_ready():
            try:
                db_execute(lambda client: client.table("media").delete().eq("id", media_id).execute())
            except Exception as e:
                print(f"Media delete: {e}")
        _notify_stats()
        return jsonify({'status': 'ok'}), 200

    # ── Giving ─────────────────────────────────────────────────────────────
    @app.route('/api/admin/giving', methods=['GET'])
    @admin_required
    def admin_list_giving():
        result = try_supabase(
            lambda: supabase.table("giving").select("*").order("created_at", desc=True).limit(500).execute(),
            None
        )
        rows = result.data if result and result.data else []
        total = sum(float(r.get('amount') or 0) for r in rows)
        return jsonify({'giving': rows, 'total_amount': total, 'count': len(rows)}), 200

    # ── Prayers ────────────────────────────────────────────────────────────
    @app.route('/api/admin/prayers', methods=['GET'])
    @admin_required
    def admin_list_prayers():
        result = try_supabase(
            lambda: supabase.table("prayer_requests").select("*").order("created_at", desc=True).limit(500).execute(),
            None
        )
        rows = result.data if result and result.data else []
        return jsonify({'prayers': rows, 'total': len(rows)}), 200

    @app.route('/api/admin/prayers/<prayer_id>', methods=['DELETE'])
    @admin_required
    def admin_delete_prayer(prayer_id):
        db_execute(lambda client: client.table("prayer_requests").delete().eq("id", prayer_id).execute())
        return jsonify({'status': 'ok'}), 200

    # Bootstrap: promote configured email to super_admin if needed
    @app.route('/api/admin/bootstrap', methods=['POST'])
    @jwt_required()
    def admin_bootstrap():
        """Promote the configured SUPERADMIN_EMAIL account to super_admin (one-time helper)."""
        email = (os.environ.get('SUPERADMIN_EMAIL') or '').strip().lower()
        if not email:
            return jsonify({
                'error': 'Set SUPERADMIN_EMAIL env var, or run SQL: '
                         "UPDATE members SET role='super_admin' WHERE email='you@example.com'"
            }), 400
        member_id = get_jwt_identity()
        member = _get_member(member_id)
        if not member:
            return jsonify({'error': 'Unauthorized'}), 401
        if (member.get('email') or '').lower() != email:
            return jsonify({'error': 'Logged-in email does not match SUPERADMIN_EMAIL'}), 403
        result = db_execute(
            lambda client: client.table("members").update({'role': 'super_admin'}).eq('id', member_id).execute()
        )
        return jsonify({'member': public_member(result.data[0]), 'message': 'You are now super_admin'}), 200
