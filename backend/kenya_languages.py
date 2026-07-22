"""Kenya and CRM platform language catalog for AI translation."""

from __future__ import annotations

# code max 10 chars for DB preferred_language column

LANGUAGE_GROUPS = [
    {
        "id": "official",
        "label": "Official & National",
        "languages": [
            {"code": "en", "label": "English", "native": "English"},
            {"code": "sw", "label": "Kiswahili", "native": "Kiswahili"},
            {"code": "ksl", "label": "Kenyan Sign Language", "native": "Kenyan Sign Language"},
        ],
    },
    {
        "id": "bantu",
        "label": "Bantu Languages",
        "languages": [
            {"code": "kik", "label": "Kikuyu / Gikuyu", "native": "Gĩkũyũ"},
            {"code": "kam", "label": "Kamba / Kikamba", "native": "Kikamba"},
            {"code": "luy", "label": "Luhya", "native": "Luluhya"},
            {"code": "guz", "label": "Kisii / Ekegusii", "native": "Ekegusii"},
            {"code": "mer", "label": "Meru / Kimeru", "native": "Kimeru"},
            {"code": "emb", "label": "Embu / Kiembu", "native": "Kiembu"},
            {"code": "nyf", "label": "Mijikenda / Giriama", "native": "Kigiriama"},
            {"code": "tai", "label": "Taita", "native": "Kitaita"},
            {"code": "kur", "label": "Kuria", "native": "Kikuria"},
            {"code": "tav", "label": "Taveta", "native": "Kitaveta"},
            {"code": "pokomo", "label": "Pokomo", "native": "Kipokomo"},
            {"code": "teo", "label": "Teso / Ateso", "native": "Ateso"},
        ],
    },
    {
        "id": "nilotic",
        "label": "Nilotic Languages",
        "languages": [
            {"code": "luo", "label": "Dholuo / Luo", "native": "Dholuo"},
            {"code": "kln", "label": "Kalenjin", "native": "Kalenjin"},
            {"code": "kips", "label": "Kipsigis", "native": "Kipsigis"},
            {"code": "nan", "label": "Nandi", "native": "Kalenjin"},
            {"code": "mas", "label": "Maasai / Maa", "native": "Maa"},
            {"code": "samb", "label": "Samburu", "native": "Samburu"},
            {"code": "tuv", "label": "Turkana", "native": "Turkana"},
            {"code": "pok", "label": "Pokot", "native": "Pokot"},
            {"code": "sab", "label": "Sabaot", "native": "Sabaot"},
        ],
    },
    {
        "id": "cushitic",
        "label": "Cushitic & Afroasiatic",
        "languages": [
            {"code": "som", "label": "Somali", "native": "Soomaali"},
            {"code": "bor", "label": "Borana", "native": "Borana"},
            {"code": "orm", "label": "Oromo", "native": "Oromoo"},
            {"code": "rend", "label": "Rendille", "native": "Rendille"},
            {"code": "orma", "label": "Orma", "native": "Orma"},
            {"code": "gab", "label": "Gabra", "native": "Gabra"},
            {"code": "bon", "label": "Boni / Aweer", "native": "Aweer"},
            {"code": "ar", "label": "Arabic", "native": "العربية"},
        ],
    },
    {
        "id": "urban",
        "label": "Urban & Mixed",
        "languages": [
            {"code": "sheng", "label": "Sheng", "native": "Sheng"},
        ],
    },
    {
        "id": "international",
        "label": "International",
        "languages": [
            {"code": "fr", "label": "French", "native": "Français"},
            {"code": "pt", "label": "Portuguese", "native": "Português"},
            {"code": "es", "label": "Spanish", "native": "Español"},
            {"code": "de", "label": "German", "native": "Deutsch"},
            {"code": "hi", "label": "Hindi", "native": "हिन्दी"},
            {"code": "gu", "label": "Gujarati", "native": "ગુજરાતી"},
            {"code": "pa", "label": "Punjabi", "native": "ਪੰਜਾਬੀ"},
            {"code": "zh", "label": "Mandarin Chinese", "native": "中文"},
        ],
    },
]


def all_languages() -> list[dict]:
    out = []
    seen = set()
    for group in LANGUAGE_GROUPS:
        for lang in group["languages"]:
            if lang["code"] not in seen:
                seen.add(lang["code"])
                out.append({**lang, "group": group["label"], "group_id": group["id"]})
    return out


def language_label(code: str) -> str:
    code = (code or "en").lower()
    for lang in all_languages():
        if lang["code"] == code:
            return lang["label"]
    return code


def is_supported(code: str) -> bool:
    return any(l["code"] == (code or "").lower() for l in all_languages())


def catalog_response() -> dict:
    return {
        "groups": LANGUAGE_GROUPS,
        "languages": all_languages(),
        "default": "en",
        "total": len(all_languages()),
    }
