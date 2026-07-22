"""Translation and language preference API routes."""

from __future__ import annotations

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

try:
    from .kenya_languages import catalog_response, is_supported
    from .translation_service import (
        translation_enabled,
        translate_text,
        translate_fields,
        translate_ui_strings,
    )
except ImportError:
    from kenya_languages import catalog_response, is_supported
    from translation_service import (
        translation_enabled,
        translate_text,
        translate_fields,
        translate_ui_strings,
    )


UI_STRINGS_EN = {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.live": "Live",
    "nav.discipleship": "Discipleship",
    "nav.media": "Media",
    "nav.prayer": "Prayer",
    "nav.portal": "Portal",
    "nav.support": "Support",
    "nav.join": "Join Now",
    "nav.signIn": "Sign In",
    "nav.signOut": "Sign Out",
    "nav.admin": "Admin",
    "nav.ministries": "Ministries",
    "library.title": "Discipleship Library",
    "library.subtitle": "Daily spiritual materials, courses, devotionals, and training resources.",
    "library.today": "Today's Spiritual Material",
    "library.search": "Search materials, speakers, topics...",
    "library.all": "All",
    "library.read": "Read",
    "library.listen": "Listen",
    "library.watch": "Watch",
    "library.save": "Save",
    "library.complete": "Mark complete",
    "library.download": "Download",
    "library.share": "Share",
    "portal.welcome": "Welcome back",
    "portal.todayBite": "Today's Daily Christ Bite",
    "portal.growthTrack": "Growth Track",
    "portal.myCourses": "My Courses",
    "media.library": "Media Library",
    "media.trending": "Trending Now",
    "live.nowStreaming": "Now Streaming",
    "live.watchNow": "Watch Live Now",
    "common.loading": "Loading...",
    "common.language": "Language",
    "common.aiTranslated": "AI translated",
}


def register_translation_routes(app, *, db_ready, db_execute):
    @app.route("/api/languages", methods=["GET"])
    def list_languages():
        data = catalog_response()
        data["ai_translation"] = translation_enabled()
        return jsonify(data), 200

    @app.route("/api/translate/ui", methods=["GET"])
    def translate_ui():
        lang = (request.args.get("lang") or "en").lower()
        if not is_supported(lang):
            lang = "en"
        strings = translate_ui_strings(UI_STRINGS_EN, lang)
        return jsonify({
            "lang": lang,
            "strings": strings,
            "ai_translation": translation_enabled(),
        }), 200

    @app.route("/api/translate", methods=["POST"])
    def translate_api():
        data = request.get_json(silent=True) or {}
        text = (data.get("text") or "").strip()
        target = (data.get("target_lang") or data.get("lang") or "en").lower()
        source = (data.get("source_lang") or "en").lower()

        if not text:
            return jsonify({"error": "text is required"}), 400
        if not is_supported(target):
            return jsonify({"error": "unsupported target language"}), 400

        translated = translate_text(text, target, source)
        return jsonify({
            "text": translated,
            "source_lang": source,
            "target_lang": target,
            "ai_translation": translation_enabled(),
        }), 200

    @app.route("/api/translate/content", methods=["POST"])
    def translate_content():
        data = request.get_json(silent=True) or {}
        target = (data.get("target_lang") or data.get("lang") or "en").lower()
        source = (data.get("source_lang") or "en").lower()
        fields = data.get("fields") or ["title", "description", "content"]
        items = data.get("items") or []

        if not is_supported(target):
            return jsonify({"error": "unsupported target language"}), 400

        out = []
        for item in items:
            if isinstance(item, dict):
                out.append(translate_fields(item, fields, target, source))
            else:
                out.append(item)

        return jsonify({
            "items": out,
            "target_lang": target,
            "ai_translation": translation_enabled(),
        }), 200

    @app.route("/api/me/language", methods=["PATCH"])
    @jwt_required()
    def update_my_language():
        data = request.get_json(silent=True) or {}
        lang = (data.get("preferred_language") or data.get("language") or "").lower()
        if not lang or not is_supported(lang):
            return jsonify({"error": "unsupported language"}), 400

        member_id = get_jwt_identity()
        if db_ready():
            try:
                result = db_execute(
                    lambda client: client.table("members")
                    .update({"preferred_language": lang})
                    .eq("id", member_id)
                    .execute()
                )
                if result.data:
                    row = result.data[0]
                    return jsonify({"preferred_language": lang, "member_id": row.get("id")}), 200
            except Exception as e:
                print(f"language update error: {e}")

        return jsonify({"preferred_language": lang}), 200
