import hashlib, secrets, os, sys
from datetime import datetime, timedelta
from typing import Optional

try:
    from supabase_client import supabase
except Exception as e:
    print(f"ERROR: Failed to import supabase_client: {e}")
    sys.exit(1)

SECRET = os.environ.get("SESSION_SECRET", secrets.token_hex(32))

def hash_password(pw: str) -> str:
    """Hash password with salt using SHA-256."""
    salt = secrets.token_hex(16)
    h = hashlib.sha256((salt + pw).encode()).hexdigest()
    return f"{salt}${h}"

def verify_password(pw: str, stored: str) -> bool:
    """Verify password against stored hash."""
    try:
        salt, h = stored.split("$")
        return hashlib.sha256((salt + pw).encode()).hexdigest() == h
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def create_session(member_id: str) -> str:
    """Create a new session token for member."""
    try:
        token = secrets.token_urlsafe(48)
        expires = (datetime.utcnow() + timedelta(days=30)).isoformat()
        supabase.table("sessions").insert({
            "token": token,
            "member_id": member_id,
            "expires_at": expires
        }).execute()
        return token
    except Exception as e:
        print(f"Session creation error: {e}")
        raise Exception("Failed to create session")

def verify_session(token: str) -> Optional[dict]:
    """Verify session token and return session data if valid."""
    try:
        result = supabase.table("sessions").select("*").eq("token", token).execute()
        
        if not result.data or len(result.data) == 0:
            return None
        
        session = result.data[0]
        
        # Check expiration
        if datetime.fromisoformat(session["expires_at"]) < datetime.utcnow():
            return None
        
        return session
    except Exception as e:
        print(f"Session verification error: {e}")
        return None

async def get_current_user(request: dict) -> dict:
    """Get current authenticated user from request headers."""
    # This function is not used in Flask app.py
    # Flask app.py has its own JWT handling
    # Keeping for compatibility
    return {"id": "placeholder"}

def generate_unique_id(continent: str, country: str, city: str) -> str:
    """Generate unique member ID in format: CRM-<CONT>-<CITY>-<SEQ>."""
    try:
        cont_code = continent[:3].upper()
        city_code = city[:3].upper()
        
        # Get next sequence for this city
        result = supabase.table("members").select("id").eq("city", city).execute()
        seq = len(result.data) + 1
        
        return f"CRM-{cont_code}-{city_code}-{seq:06d}"
    except Exception as e:
        print(f"Unique ID generation error: {e}")
        # Fallback to random ID
        return f"CRM-{secrets.token_hex(6).upper()}"