"""Password hashing and member ID helpers."""

from __future__ import annotations

import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional

try:
    from .supabase_client import supabase
except ImportError:
    from supabase_client import supabase

SECRET = os.environ.get("SESSION_SECRET", secrets.token_hex(32))


def hash_password(pw: str) -> str:
    """Hash password with salt using SHA-256."""
    salt = secrets.token_hex(16)
    digest = hashlib.sha256((salt + pw).encode()).hexdigest()
    return f"{salt}${digest}"


def verify_password(pw: str, stored: str) -> bool:
    """Verify password against stored hash."""
    try:
        salt, digest = stored.split("$", 1)
        return hashlib.sha256((salt + pw).encode()).hexdigest() == digest
    except Exception as exc:
        print(f"Password verification error: {exc}")
        return False


def create_session(member_id: str) -> str:
    """Create a new session token for member."""
    if supabase is None:
        raise RuntimeError("Supabase client is not configured")

    token = secrets.token_urlsafe(48)
    expires = (datetime.utcnow() + timedelta(days=30)).isoformat()
    supabase.table("sessions").insert({
        "token": token,
        "member_id": member_id,
        "expires_at": expires,
    }).execute()
    return token


def verify_session(token: str) -> Optional[dict]:
    """Verify session token and return session data if valid."""
    if supabase is None:
        return None

    try:
        result = supabase.table("sessions").select("*").eq("token", token).execute()
        if not result.data:
            return None

        session = result.data[0]
        if datetime.fromisoformat(session["expires_at"]) < datetime.utcnow():
            return None
        return session
    except Exception as exc:
        print(f"Session verification error: {exc}")
        return None


def generate_unique_id(continent: str, country: str, city: str) -> str:
    """Generate unique member ID in format: CRM-<CONT>-<CITY>-<SEQ>."""
    cont_code = (continent or "XXX")[:3].upper()
    city_code = (city or "XXX")[:3].upper()

    try:
        if supabase is None:
            raise RuntimeError("no supabase")
        result = supabase.table("members").select("id", count="exact").eq("city", city).execute()
        seq = (result.count if getattr(result, "count", None) is not None else len(result.data or [])) + 1
        return f"CRM-{cont_code}-{city_code}-{seq:06d}"
    except Exception as exc:
        print(f"Unique ID generation fallback: {exc}")
        return f"CRM-{cont_code}-{city_code}-{secrets.token_hex(3).upper()}"
