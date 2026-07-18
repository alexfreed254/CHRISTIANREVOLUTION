"""Supabase client — requires SUPABASE_URL + SUPABASE_SERVICE_KEY for writes."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv

# Load .env from project root (local) and cwd (Render injects real env vars)
_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")
load_dotenv()

from supabase import Client, create_client

url: str = (
    os.environ.get("SUPABASE_URL")
    or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    or ""
).strip()

# Prefer the service_role key so RLS does not block backend inserts
key: str = (
    os.environ.get("SUPABASE_SERVICE_KEY")
    or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_KEY")
    or ""
).strip()

supabase: Optional[Client] = None


def _init_client() -> Optional[Client]:
    if not url or not key:
        print(
            "WARNING: SUPABASE_URL / SUPABASE_SERVICE_KEY not set — "
            "auth and DB writes will fail until configured"
        )
        return None

    if "your-project" in url or key.startswith("your-"):
        print("WARNING: Placeholder Supabase credentials detected")
        return None

    try:
        client = create_client(url, key)
        print(f"Supabase client ready ({url[:40]}...)")
        try:
            test = client.table("members").select("id").limit(1).execute()
            rows = len(test.data) if test and test.data is not None else 0
            print(f"Supabase members table reachable ({rows} sample row(s))")
        except Exception as test_error:
            print(f"WARNING: members table query failed: {test_error}")
            print("Confirm database.sql was run in the Supabase SQL editor")
        return client
    except Exception as exc:
        print(f"WARNING: Failed to create Supabase client: {exc}")
        return None


supabase = _init_client()


def db_ready() -> bool:
    return supabase is not None


def get_supabase() -> Client:
    if supabase is None:
        raise RuntimeError(
            "Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY "
            "(use the service_role key from Supabase → Settings → API)."
        )
    return supabase


def db_execute(query_func) -> Any:
    """Run a Supabase query and raise with a clear message on failure."""
    client = get_supabase()
    try:
        return query_func(client)
    except Exception as exc:
        print(f"Supabase query error: {exc}")
        raise
