"""AI-powered translation for CRM platform content."""

from __future__ import annotations

import hashlib
import json
import os
import re
from typing import Any

import httpx

try:
    from .kenya_languages import language_label, is_supported
except ImportError:
    from kenya_languages import language_label, is_supported


TRANSLATION_CACHE: dict[str, str] = {}
UI_CACHE: dict[str, dict] = {}

OPENAI_API_KEY = (os.environ.get("OPENAI_API_KEY") or "").strip()
OPENAI_MODEL = (os.environ.get("OPENAI_MODEL") or "gpt-4o-mini").strip()
OPENAI_BASE = (os.environ.get("OPENAI_BASE_URL") or "https://api.openai.com/v1").rstrip("/")


def translation_enabled() -> bool:
    return bool(OPENAI_API_KEY) and os.environ.get("TRANSLATION_ENABLED", "true").lower() != "false"


def _cache_key(source: str, target: str, text: str) -> str:
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:24]
    return f"{source}:{target}:{digest}"


def _normalize_lang(code: str | None) -> str:
    code = (code or "en").lower().strip()
    return code if is_supported(code) else "en"


def translate_text(text: str, target_lang: str, source_lang: str = "en") -> str:
    text = (text or "").strip()
    if not text:
        return text

    target_lang = _normalize_lang(target_lang)
    source_lang = _normalize_lang(source_lang)

    if target_lang == source_lang:
        return text

    key = _cache_key(source_lang, target_lang, text)
    if key in TRANSLATION_CACHE:
        return TRANSLATION_CACHE[key]

    if not translation_enabled():
        return text

    target_name = language_label(target_lang)
    source_name = language_label(source_lang)

    system = (
        "You are a professional translator for Christ Revolution Movement, a Christian discipleship platform in Kenya. "
        "Translate accurately and naturally. Preserve Bible references, names, and spiritual tone. "
        "Return ONLY the translated text with no quotes or commentary."
    )
    user = (
        f"Translate from {source_name} to {target_name}:\n\n{text}"
    )

    try:
        with httpx.Client(timeout=60.0) as client:
            res = client.post(
                f"{OPENAI_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": OPENAI_MODEL,
                    "temperature": 0.2,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
            )
            res.raise_for_status()
            data = res.json()
            translated = (data["choices"][0]["message"]["content"] or "").strip()
            translated = re.sub(r'^["\']|["\']$', "", translated)
            TRANSLATION_CACHE[key] = translated
            return translated
    except Exception as e:
        print(f"Translation failed ({source_lang}->{target_lang}): {e}")
        return text


def translate_fields(obj: dict, fields: list[str], target_lang: str, source_lang: str | None = None) -> dict:
    if not obj or not isinstance(obj, dict):
        return obj

    target_lang = _normalize_lang(target_lang)
    source_lang = _normalize_lang(source_lang or obj.get("language") or "en")

    if target_lang == source_lang:
        return obj

    out = dict(obj)
    out["_translated_from"] = source_lang
    out["_translated_to"] = target_lang
    out["_ai_translated"] = translation_enabled()

    for field in fields:
        val = out.get(field)
        if isinstance(val, str) and val.strip():
            out[field] = translate_text(val, target_lang, source_lang)
        elif isinstance(val, list):
            out[field] = [
                translate_text(item, target_lang, source_lang) if isinstance(item, str) else item
                for item in val
            ]

    out["language"] = target_lang
    return out


def translate_batch(items: list[dict], fields: list[str], target_lang: str) -> list[dict]:
    return [translate_fields(item, fields, target_lang) for item in items]


def translate_ui_strings(strings: dict[str, str], target_lang: str) -> dict[str, str]:
    target_lang = _normalize_lang(target_lang)
    if target_lang == "en":
        return dict(strings)

    if target_lang in UI_CACHE:
        return UI_CACHE[target_lang]

    if not translation_enabled():
        return dict(strings)

    payload = json.dumps(strings, ensure_ascii=False)
    target_name = language_label(target_lang)

    try:
        with httpx.Client(timeout=90.0) as client:
            res = client.post(
                f"{OPENAI_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": OPENAI_MODEL,
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "Translate UI label values to "
                                f"{target_name} for a church website. "
                                "Return JSON with the same keys and translated string values only."
                            ),
                        },
                        {"role": "user", "content": payload},
                    ],
                },
            )
            res.raise_for_status()
            content = res.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            merged = {**strings, **{k: str(v) for k, v in parsed.items() if k in strings}}
            UI_CACHE[target_lang] = merged
            return merged
    except Exception as e:
        print(f"UI translation failed ({target_lang}): {e}")
        return dict(strings)


def apply_content_language(item: dict, target_lang: str, text_fields: list[str] | None = None) -> dict:
    """Translate a content object if target language differs from source."""
    if not item:
        return item

    fields = text_fields or ["title", "description", "content", "speaker", "bible_reference"]
    source = _normalize_lang(item.get("language") or "en")
    target = _normalize_lang(target_lang)

    if item.get("all_languages") and target != source:
        return translate_fields(item, fields, target, source)

    if target != source:
        return translate_fields(item, fields, target, source)

    return item
