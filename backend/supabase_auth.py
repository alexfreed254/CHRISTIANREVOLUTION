"""Supabase Authentication helpers for church admin / super admin login."""

from __future__ import annotations

import os
import secrets
from datetime import datetime
from typing import Any, Optional

try:
    from .auth import hash_password, generate_unique_id
    from .supabase_client import db_execute, db_ready, get_supabase
except ImportError:
    from auth import hash_password, generate_unique_id
    from supabase_client import db_execute, db_ready, get_supabase

VALID_ROLES = frozenset({'member', 'volunteer', 'leader', 'admin', 'super_admin'})


def supabase_auth_configured() -> bool:
    url = (os.environ.get('SUPABASE_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL') or '').strip()
    anon = (os.environ.get('SUPABASE_ANON_KEY') or os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') or '').strip()
    return bool(url and anon and 'your-project' not in url and not anon.startswith('your-'))


def _auth_client():
    from supabase import create_client

    url = (os.environ.get('SUPABASE_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL') or '').strip()
    anon = (os.environ.get('SUPABASE_ANON_KEY') or os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') or '').strip()
    return create_client(url, anon)


def sign_in_with_supabase_auth(email: str, password: str) -> Optional[Any]:
    """Verify email/password against Supabase Authentication (auth.users)."""
    if not supabase_auth_configured():
        return None
    try:
        client = _auth_client()
        response = client.auth.sign_in_with_password({
            'email': email.strip().lower(),
            'password': password,
        })
        return response.user if response and response.user else None
    except Exception as exc:
        print(f'Supabase Auth sign-in failed: {exc}')
        return None


def _role_from_auth_user(auth_user) -> str:
    meta = auth_user.user_metadata or {}
    app_meta = auth_user.app_metadata or {}
    role = (meta.get('role') or app_meta.get('role') or 'member').strip()
    return role if role in VALID_ROLES else 'member'


def _unique_username(base: str) -> str:
    base = ''.join(c for c in base.lower() if c.isalnum() or c in '._-') or 'admin'
    username = base[:40]
    if not db_ready():
        return username
    try:
        taken = db_execute(
            lambda client: client.table('members').select('id').eq('username', username).execute()
        )
        if not taken.data:
            return username
        suffix = secrets.token_hex(2)
        return f'{username[:32]}_{suffix}'
    except Exception:
        return f'{username}_{secrets.token_hex(2)}'


def get_or_create_member_from_auth_user(auth_user) -> Optional[dict]:
    """Link Supabase Auth user to public.members (create row on first admin login)."""
    if not db_ready() or not auth_user:
        return None

    auth_id = str(auth_user.id)
    email = (auth_user.email or '').strip().lower()
    if not email:
        return None

    meta = auth_user.user_metadata or {}
    role = _role_from_auth_user(auth_user)
    full_name = (meta.get('full_name') or meta.get('name') or email.split('@')[0]).strip()

    try:
        by_auth = db_execute(
            lambda client: client.table('members').select('*').eq('auth_user_id', auth_id).execute()
        )
        if by_auth.data:
            member = by_auth.data[0]
            updates = {'last_seen': datetime.utcnow().isoformat()}
            if role == 'super_admin' and member.get('role') != 'super_admin':
                updates['role'] = 'super_admin'
            db_execute(
                lambda client: client.table('members').update(updates).eq('id', member['id']).execute()
            )
            refreshed = db_execute(
                lambda client: client.table('members').select('*').eq('id', member['id']).single().execute()
            )
            return refreshed.data if refreshed.data else member

        by_email = db_execute(
            lambda client: client.table('members').select('*').eq('email', email).execute()
        )
        if by_email.data:
            member = by_email.data[0]
            updates = {
                'auth_user_id': auth_id,
                'last_seen': datetime.utcnow().isoformat(),
            }
            if role == 'super_admin' and member.get('role') != 'super_admin':
                updates['role'] = 'super_admin'
            result = db_execute(
                lambda client: client.table('members').update(updates).eq('id', member['id']).execute()
            )
            return result.data[0] if result.data else member

        continent = (meta.get('continent') or 'Africa').strip()
        country = (meta.get('country') or 'Kenya').strip()
        city = (meta.get('city') or 'Nairobi').strip()
        phone = (meta.get('phone') or '').strip() or '+254000000000'
        username = _unique_username(meta.get('username') or email.split('@')[0])

        row = {
            'full_name': full_name,
            'continent': continent,
            'country': country,
            'city': city,
            'email': email,
            'phone': phone,
            'username': username,
            'password_hash': hash_password(secrets.token_urlsafe(32)),
            'unique_id': generate_unique_id(continent, country, city),
            'growth_stage': 'leader' if role in ('admin', 'super_admin') else 'new_believer',
            'engagement_score': 0,
            'streak': 0,
            'role': role,
            'auth_user_id': auth_id,
            'preferred_language': meta.get('preferred_language') or 'en',
            'timezone': meta.get('timezone') or 'UTC',
            'membership_status': 'active_member',
        }
        village = (meta.get('village') or '').strip()
        if village:
            row['village'] = village

        result = db_execute(lambda client: client.table('members').insert(row).execute())
        return result.data[0] if result.data else None
    except Exception as exc:
        print(f'get_or_create_member_from_auth_user error: {exc}')
        message = str(exc)
        if 'auth_user_id' in message.lower() and 'does not exist' in message.lower():
            print('Run database_supabase_auth.sql in Supabase SQL editor.')
        return None
