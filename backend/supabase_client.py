"""Supabase client — fails soft so the API can still serve seed/demo data."""

from __future__ import annotations

import os
from typing import Any, Optional

from supabase import Client, create_client

url: str = os.environ.get("SUPABASE_URL", "").strip()
key: str = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()
supabase: Optional[Client] = None


def _init_client() -> Optional[Client]:
    if not url or not key:
        print("WARNING: SUPABASE_URL / SUPABASE_SERVICE_KEY not set — using seed data fallbacks")
        return None

    try:
        client = create_client(url, key)
        print(f"Supabase client ready ({url[:30]}...)")
        try:
            test = client.table("members").select("id").limit(1).execute()
            rows = len(test.data) if test and test.data is not None else 0
            print(f"Supabase connection OK ({rows} sample row(s))")
        except Exception as test_error:
            print(f"WARNING: Supabase reachable but query failed: {test_error}")
        return client
    except Exception as exc:
        print(f"WARNING: Failed to create Supabase client: {exc}")
        return None


supabase = _init_client()


def get_supabase() -> Any:
    """Return the client or raise so callers can fall back cleanly."""
    if supabase is None:
        raise RuntimeError("Supabase client is not configured")
    return supabase
