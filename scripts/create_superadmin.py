"""
Create or promote a CRM superadmin in the members table.

This app does NOT use Supabase Authentication (Auth users).
Login uses public.members + password_hash from backend/auth.py.

Usage:
  python scripts/create_superadmin.py
  python scripts/create_superadmin.py --email you@example.com --username admin --password 'YourSecurePass' --name 'Admin'
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from backend.auth import hash_password, generate_unique_id
from backend.supabase_client import supabase, db_ready


def main() -> int:
    parser = argparse.ArgumentParser(description="Create/promote CRM superadmin")
    parser.add_argument("--email", default="alexfreed254@gmail.com")
    parser.add_argument("--username", default="alexfreed254")
    parser.add_argument("--password", default="")
    parser.add_argument("--name", default="CRM Superadmin")
    parser.add_argument("--promote-only", action="store_true", help="Only set role=super_admin for existing email")
    args = parser.parse_args()

    if not db_ready() or supabase is None:
        print("ERROR: Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
        return 1

    email = args.email.strip().lower()
    existing = supabase.table("members").select("*").eq("email", email).execute()

    if existing.data:
        member = existing.data[0]
        updates = {"role": "super_admin"}
        if args.password:
            updates["password_hash"] = hash_password(args.password)
        result = supabase.table("members").update(updates).eq("id", member["id"]).execute()
        row = result.data[0]
        print("Promoted existing member to super_admin:")
        print(f"  username: {row['username']}")
        print(f"  email:    {row['email']}")
        print(f"  role:     {row['role']}")
        if args.password:
            print("  password: (updated)")
        else:
            print("  password: (unchanged — use the password from registration)")
        return 0

    if args.promote_only:
        print(f"ERROR: No member with email {email}. Register on the site first, or omit --promote-only.")
        return 1

    if not args.password:
        print("ERROR: New account requires --password")
        return 1

    username = args.username.strip()
    taken = supabase.table("members").select("id").eq("username", username).execute()
    if taken.data:
        print(f"ERROR: username '{username}' already taken")
        return 1

    member = {
        "full_name": args.name,
        "continent": "Africa",
        "country": "Kenya",
        "city": "Nairobi",
        "email": email,
        "phone": "+254700000000",
        "username": username,
        "password_hash": hash_password(args.password),
        "unique_id": generate_unique_id("Africa", "Kenya", "Nairobi"),
        "growth_stage": "leader",
        "engagement_score": 0,
        "streak": 0,
        "role": "super_admin",
        "preferred_language": "en",
        "timezone": "UTC",
    }
    result = supabase.table("members").insert(member).execute()
    row = result.data[0]
    print("Created superadmin:")
    print(f"  username: {row['username']}")
    print(f"  email:    {row['email']}")
    print(f"  role:     {row['role']}")
    print("Log in at /login with that username (or email) and password.")
    print("Do NOT use Supabase Authentication users — they are not used by this app.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
