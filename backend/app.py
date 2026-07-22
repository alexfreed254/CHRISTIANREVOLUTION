"""
Christ Revolution Movement (CRM) — Flask API with Real-time Features
Production-ready for Render deployment with Supabase backend
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from pathlib import Path
import os
import secrets

try:
    from .supabase_client import supabase, db_ready, get_supabase, db_execute
    from .auth import hash_password, verify_password, generate_unique_id
    from . import reactions as reaction_store
    from . import live_stats as live_stats_mod
    from . import payments as payments_mod
except ImportError:
    from supabase_client import supabase, db_ready, get_supabase, db_execute
    from auth import hash_password, verify_password, generate_unique_id
    import reactions as reaction_store
    import live_stats as live_stats_mod
    import payments as payments_mod

BASE_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = BASE_DIR / 'frontend' / 'dist'
if DIST_DIR.exists():
    print(f"Frontend build found: {DIST_DIR}")
else:
    print(f"WARNING: Frontend build missing at {DIST_DIR} — run: cd frontend && npm run build")

# Initialize Flask
app = Flask(
    __name__,
    static_folder=str(DIST_DIR) if DIST_DIR.exists() else None,
    static_url_path='',
    template_folder=str(DIST_DIR) if DIST_DIR.exists() else None,
)
app.config['SECRET_KEY'] = os.environ.get('SESSION_SECRET', secrets.token_hex(32))
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', secrets.token_hex(32))
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

# CORS for Render
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

# Threading mode — no eventlet (deprecated). Works with gunicorn gthread workers.
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25,
    max_http_buffer_size=1e6,
    logger=False,
    engineio_logger=False,
)

jwt = JWTManager(app)

# ============================================================================
# SEED DATA (for demo when Supabase tables are empty)
# ============================================================================

SEED_STREAMS = [
    {
        "id": "stream-001",
        "title": "The 2 Billion Mandate: Week 28 — Global Harvest",
        "description": "A powerful message on discipling nations through the undiluted gospel. Join us as we press toward the 2033 vision.",
        "stream_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        "thumbnail_url": "https://images.unsplash.com/photo-1507692042200-27a99c57e4a2?w=1280&h=720&fit=crop",
        "status": "live",
        "viewer_count": 1847,
        "like_count": 926,
        "speaker": "Apostle John Mwangi",
        "language": "en",
        "available_languages": ["en", "sw", "pt", "fr", "es"],
        "started_at": datetime.utcnow().isoformat(),
        "bible_reference": "Matthew 28:19-20",
        "topics": ["Evangelism", "Discipleship", "Global Mission"]
    },
    {
        "id": "stream-002",
        "title": "Midweek Fire: The Power of the Tongue",
        "description": "Wednesday midweek service on the authority of our words in the Kingdom.",
        "stream_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        "thumbnail_url": "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1280&h=720&fit=crop",
        "status": "scheduled",
        "viewer_count": 0,
        "like_count": 0,
        "speaker": "Pastor Grace Kimani",
        "language": "en",
        "available_languages": ["en", "sw"],
        "scheduled_for": (datetime.utcnow() + timedelta(days=2)).isoformat(),
        "bible_reference": "James 3:1-12",
        "topics": ["Faith", "Words", "Authority"]
    }
]

SEED_SERIES = [
    {"id": "series-001", "title": "The 2 Billion Mandate", "description": "A 52-week journey to disciple 2 billion souls by 2033.", "speaker": "Apostle John Mwangi", "total_episodes": 52, "thumbnail_url": "https://images.unsplash.com/photo-1507692042200-27a99c57e4a2?w=640&h=360&fit=crop", "tags": ["Vision", "Discipleship"]},
    {"id": "series-002", "title": "Kingdom Finance", "description": "Understanding God's principles of wealth and stewardship.", "speaker": "Pastor Grace Kimani", "total_episodes": 12, "thumbnail_url": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=640&h=360&fit=crop", "tags": ["Finance", "Stewardship"]},
    {"id": "series-003", "title": "Signs & Wonders", "description": "Operating in the supernatural power of God.", "speaker": "Prophet David Ochieng", "total_episodes": 8, "thumbnail_url": "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=640&h=360&fit=crop", "tags": ["Healing", "Miracles"]},
]

SEED_MEDIA = [
    {"id": "media-001", "title": "The 2 Billion Mandate: Week 27 — Sending the 12", "speaker": "Apostle John Mwangi", "series_id": "series-001", "episode_number": 27, "duration": 5420, "thumbnail_url": "https://images.unsplash.com/photo-1507692042200-27a99c57e4a2?w=640&h=360&fit=crop", "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", "view_count": 45230, "like_count": 3200, "language": "en", "available_languages": ["en", "sw", "pt", "fr"], "topics": ["Evangelism", "Leadership"], "bible_reference": "Luke 9:1-6", "upload_date": (datetime.utcnow() - timedelta(days=7)).isoformat(), "type": "video", "is_live": False, "is_new": True, "description": "The Lord is sending laborers into the harvest field."},
    {"id": "media-002", "title": "Kingdom Finance: The Seed Principle", "speaker": "Pastor Grace Kimani", "series_id": "series-002", "episode_number": 3, "duration": 3840, "thumbnail_url": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=640&h=360&fit=crop", "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", "view_count": 28900, "like_count": 2100, "language": "en", "available_languages": ["en", "sw"], "topics": ["Finance", "Seed"], "bible_reference": "2 Corinthians 9:6-11", "upload_date": (datetime.utcnow() - timedelta(days=14)).isoformat(), "type": "video", "is_live": False, "is_new": False, "description": "Understanding the spiritual law of sowing and reaping."},
    {"id": "media-003", "title": "Signs & Wonders: Healing is the Children's Bread", "speaker": "Prophet David Ochieng", "series_id": "series-003", "episode_number": 5, "duration": 4560, "thumbnail_url": "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=640&h=360&fit=crop", "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", "view_count": 67800, "like_count": 5400, "language": "en", "available_languages": ["en", "sw", "pt"], "topics": ["Healing", "Miracles"], "bible_reference": "Matthew 15:21-28", "upload_date": (datetime.utcnow() - timedelta(days=3)).isoformat(), "type": "video", "is_live": False, "is_new": True, "description": "Healing is the right of every child of God."},
    {"id": "media-004", "title": "The 2 Billion Mandate: Week 26 — The Great Commission", "speaker": "Apostle John Mwangi", "series_id": "series-001", "episode_number": 26, "duration": 5100, "thumbnail_url": "https://images.unsplash.com/photo-1507692042200-27a99c57e4a2?w=640&h=360&fit=crop", "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", "view_count": 38900, "like_count": 2800, "language": "en", "available_languages": ["en", "sw", "fr"], "topics": ["Evangelism", "Commission"], "bible_reference": "Matthew 28:18-20", "upload_date": (datetime.utcnow() - timedelta(days=14)).isoformat(), "type": "video", "is_live": False, "is_new": False, "description": "Go and make disciples of all nations."},
    {"id": "media-005", "title": "Midweek Fire: The Prayer of Faith", "speaker": "Pastor Grace Kimani", "series_id": None, "episode_number": None, "duration": 3120, "thumbnail_url": "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=640&h=360&fit=crop", "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", "view_count": 15600, "like_count": 980, "language": "en", "available_languages": ["en", "sw"], "topics": ["Prayer", "Faith"], "bible_reference": "James 5:13-18", "upload_date": (datetime.utcnow() - timedelta(days=5)).isoformat(), "type": "video", "is_live": False, "is_new": True, "description": "The prayer of a righteous person is powerful and effective."},
    {"id": "media-006", "title": "Kingdom Finance: Breaking the Spirit of Poverty", "speaker": "Pastor Grace Kimani", "series_id": "series-002", "episode_number": 4, "duration": 4200, "thumbnail_url": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=640&h=360&fit=crop", "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", "view_count": 51200, "like_count": 4100, "language": "en", "available_languages": ["en", "sw", "pt"], "topics": ["Finance", "Breakthrough"], "bible_reference": "3 John 1:2", "upload_date": (datetime.utcnow() - timedelta(days=10)).isoformat(), "type": "video", "is_live": False, "is_new": False, "description": "Breaking every generational curse of poverty."},
    {"id": "media-007", "title": "The 2 Billion Mandate: Week 25 — Training the 70", "speaker": "Apostle John Mwangi", "series_id": "series-001", "episode_number": 25, "duration": 4980, "thumbnail_url": "https://images.unsplash.com/photo-1507692042200-27a99c57e4a2?w=640&h=360&fit=crop", "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", "view_count": 32100, "like_count": 2400, "language": "en", "available_languages": ["en", "sw"], "topics": ["Discipleship", "Training"], "bible_reference": "Luke 10:1-24", "upload_date": (datetime.utcnow() - timedelta(days=21)).isoformat(), "type": "video", "is_live": False, "is_new": False, "description": "Jesus appointed seventy others and sent them out two by two."},
    {"id": "media-008", "title": "Signs & Wonders: Operating in the Gifts", "speaker": "Prophet David Ochieng", "series_id": "series-003", "episode_number": 6, "duration": 4740, "thumbnail_url": "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=640&h=360&fit=crop", "video_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", "view_count": 42300, "like_count": 3500, "language": "en", "available_languages": ["en", "sw", "fr"], "topics": ["Gifts", "Holy Spirit"], "bible_reference": "1 Corinthians 12:1-11", "upload_date": (datetime.utcnow() - timedelta(days=8)).isoformat(), "type": "video", "is_live": False, "is_new": True, "description": "Desire spiritual gifts, especially that you may prophesy."},
]

SEED_COMMENTS = [
    {"id": "comment-001", "stream_id": "stream-001", "member_name": "Sarah Wanjiku", "member_location": "Nairobi, Kenya", "content": "Amen! This word is fire! The 2 billion mandate is achievable in Jesus name! 🔥", "language": "en", "is_prayer_request": False, "created_at": (datetime.utcnow() - timedelta(minutes=45)).isoformat()},
    {"id": "comment-002", "stream_id": "stream-001", "member_name": "David Santos", "member_location": "São Paulo, Brazil", "content": "Glória a Deus! From Brazil, we are with you Apostle! The harvest is ripe! 🙏", "language": "pt", "is_prayer_request": False, "created_at": (datetime.utcnow() - timedelta(minutes=42)).isoformat()},
    {"id": "comment-003", "stream_id": "stream-001", "member_name": "Marie Dubois", "member_location": "Paris, France", "content": "Please pray for my family to come to Christ. They are resistant but I believe God is working! 🙏", "language": "en", "is_prayer_request": True, "created_at": (datetime.utcnow() - timedelta(minutes=38)).isoformat()},
    {"id": "comment-004", "stream_id": "stream-001", "member_name": "James Okafor", "member_location": "Lagos, Nigeria", "content": "Nigeria is ready! We are mobilizing 10,000 evangelists for the 2033 vision! 💪", "language": "en", "is_prayer_request": False, "created_at": (datetime.utcnow() - timedelta(minutes=35)).isoformat()},
    {"id": "comment-005", "stream_id": "stream-001", "member_name": "Amina Hassan", "member_location": "Dar es Salaam, Tanzania", "content": "Asante sana! This message has shifted my perspective on discipleship. I am going deeper!", "language": "sw", "is_prayer_request": False, "created_at": (datetime.utcnow() - timedelta(minutes=30)).isoformat()},
    {"id": "comment-006", "stream_id": "stream-001", "member_name": "Jean-Pierre Mutombo", "member_location": "Kinshasa, DRC", "content": "La RDC est prête! Nous sommes en train de former des disciples dans chaque village! 🇨🇩", "language": "fr", "is_prayer_request": False, "created_at": (datetime.utcnow() - timedelta(minutes=25)).isoformat()},
    {"id": "comment-007", "stream_id": "stream-001", "member_name": "Esther Kim", "member_location": "Seoul, South Korea", "content": "From Seoul with love! The Asian church is rising up for the 2 billion! 🔥🙏", "language": "en", "is_prayer_request": False, "created_at": (datetime.utcnow() - timedelta(minutes=20)).isoformat()},
    {"id": "comment-008", "stream_id": "stream-001", "member_name": "Carlos Mendez", "member_location": "Mexico City, Mexico", "content": "¡Gloria a Dios! Latinoamérica está en llamas por el Evangelio! Vamos por los 2 mil millones!", "language": "es", "is_prayer_request": False, "created_at": (datetime.utcnow() - timedelta(minutes=15)).isoformat()},
    {"id": "comment-009", "stream_id": "stream-001", "member_name": "Ruth Abrahams", "member_location": "Johannesburg, South Africa", "content": "South Africa is being shaken! The youth are hungry for the real gospel! 🙌", "language": "en", "is_prayer_request": False, "created_at": (datetime.utcnow() - timedelta(minutes=10)).isoformat()},
    {"id": "comment-010", "stream_id": "stream-001", "member_name": "Peter Omondi", "member_location": "Eldoret, Kenya", "content": "Please pray for our new church plant in Eldoret. We need 100 chairs and a sound system. God will provide! 🙏", "language": "en", "is_prayer_request": True, "created_at": (datetime.utcnow() - timedelta(minutes=5)).isoformat()},
]

SEED_PRAYERS = [
    {"id": "prayer-001", "member_id": "member-001", "member_name": "Sarah Wanjiku", "member_location": "Nairobi, Kenya", "content": "Please pray for my brother who is battling cancer. The doctors say it is terminal, but we believe in the God who heals!", "is_public": True, "prayer_count": 234, "is_answered": False, "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat()},
    {"id": "prayer-002", "member_id": "member-002", "member_name": "David Santos", "member_location": "São Paulo, Brazil", "content": "Praying for the 2 billion mandate! May God open doors for CRM to reach every nation. I am ready to be sent!", "is_public": True, "prayer_count": 567, "is_answered": False, "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat()},
    {"id": "prayer-003", "member_id": "member-003", "member_name": "Marie Dubois", "member_location": "Paris, France", "content": "I need a breakthrough in my finances. I have been faithful in tithing but the enemy has been attacking my business.", "is_public": True, "prayer_count": 189, "is_answered": False, "created_at": (datetime.utcnow() - timedelta(hours=12)).isoformat()},
]

# Mutable runtime stores (seed + admin-created items)
MEDIA_STORE = list(SEED_MEDIA)
STREAM_STORE = list(SEED_STREAMS)

try:
    from .spiritual_materials import seed_materials
except ImportError:
    from spiritual_materials import seed_materials

SPIRITUAL_MATERIALS_STORE = seed_materials()

# Connected Socket.IO clients (approximate online count)
CONNECTED_CLIENTS = set()


def snapshot_stats():
    return live_stats_mod.build_live_stats(
        supabase=supabase,
        db_ready=db_ready(),
        try_supabase=try_supabase,
        STREAM_STORE=STREAM_STORE,
        MEDIA_STORE=MEDIA_STORE,
        reaction_store=reaction_store,
        connected_clients=len(CONNECTED_CLIENTS),
    )


def broadcast_stats():
    live_stats_mod.emit_platform_stats(socketio, snapshot_stats())

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def try_supabase(query_func, fallback=None):
    """Try Supabase query, return fallback on error (read/seed paths only)."""
    if supabase is None:
        return fallback
    try:
        return query_func()
    except Exception as e:
        print(f"Supabase error: {e}")
        return fallback


def require_db():
    """Abort with JSON error when Supabase is not configured."""
    if not db_ready():
        return jsonify({
            'error': 'Database not configured',
            'message': 'Set SUPABASE_URL and SUPABASE_SERVICE_KEY on the server '
                       '(service_role key from Supabase → Settings → API).'
        }), 503
    return None


def public_member(member: dict) -> dict:
    """Strip sensitive fields before returning member JSON."""
    data = dict(member)
    data.pop('password_hash', None)
    return data

# ============================================================================
# AUTH ROUTES (using your existing auth.py)
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'service': 'CRM Central Command',
        'database': 'connected' if db_ready() else 'disconnected',
        'online_now': len(CONNECTED_CLIENTS),
        'time': datetime.utcnow().isoformat()
    }), 200


@app.route('/api/stats/live', methods=['GET'])
def public_live_stats():
    """Realtime platform statistics for home / public dashboards."""
    return jsonify(snapshot_stats()), 200

@app.route('/api/register', methods=['POST'])
def register():
    db_error = require_db()
    if db_error:
        return db_error

    try:
        data = request.get_json(silent=True) or {}
        required = ['full_name', 'continent', 'country', 'city', 'email', 'phone', 'username', 'password']
        for field in required:
            value = data.get(field)
            if value is None or (isinstance(value, str) and not value.strip()):
                return jsonify({'error': f'Missing: {field}'}), 400

        email = data['email'].strip().lower()
        username = data['username'].strip()

        existing = db_execute(
            lambda client: client.table("members").select("id").eq("username", username).execute()
        )
        if existing.data:
            return jsonify({'error': 'Username taken'}), 400

        existing_email = db_execute(
            lambda client: client.table("members").select("id").eq("email", email).execute()
        )
        if existing_email.data:
            return jsonify({'error': 'Email registered'}), 400

        unique_id = generate_unique_id(data['continent'], data['country'], data['city'])
        password_hash = hash_password(data['password'])

        # Columns aligned with database.sql → members
        member = {
            "full_name": data['full_name'].strip(),
            "continent": data['continent'].strip(),
            "country": data['country'].strip(),
            "city": data['city'].strip(),
            "email": email,
            "phone": str(data['phone']).strip(),
            "username": username,
            "password_hash": password_hash,
            "unique_id": unique_id,
            "growth_stage": "new_believer",
            "engagement_score": 0,
            "streak": 0,
            "role": "member",
            "preferred_language": data.get('preferred_language') or "en",
            "timezone": data.get('timezone') or "UTC",
        }
        village = (data.get('village') or '').strip()
        if village:
            member["village"] = village

        result = db_execute(
            lambda client: client.table("members").insert(member).execute()
        )
        if not result.data:
            return jsonify({
                'error': 'Registration failed',
                'message': 'Insert returned no row. Confirm the members table exists (run database.sql).'
            }), 500

        member_data = public_member(result.data[0])
        token = create_access_token(identity=str(member_data['id']))
        broadcast_stats()
        return jsonify({'token': token, 'member': member_data}), 201

    except Exception as e:
        print(f"Registration error: {e}")
        message = str(e)
        if 'duplicate' in message.lower() or 'unique' in message.lower():
            return jsonify({'error': 'Username or email already registered'}), 400
        if 'members' in message.lower() and ('schema' in message.lower() or 'exist' in message.lower()):
            return jsonify({
                'error': 'Database tables missing',
                'message': 'Run database.sql in the Supabase SQL editor, then try again.'
            }), 500
        return jsonify({'error': 'Registration failed', 'message': message}), 500

@app.route('/api/login', methods=['POST'])
def login():
    db_error = require_db()
    if db_error:
        return db_error

    try:
        data = request.get_json(silent=True) or {}
        username = (data.get('username') or '').strip()
        password = data.get('password') or ''
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400

        result = db_execute(
            lambda client: client.table("members").select("*").eq("username", username).execute()
        )
        if not result.data:
            # Also allow login by email
            result = db_execute(
                lambda client: client.table("members").select("*").eq("email", username.lower()).execute()
            )
        if not result.data:
            return jsonify({'error': 'Invalid credentials'}), 401

        member = result.data[0]
        if not verify_password(password, member.get('password_hash') or ''):
            return jsonify({'error': 'Invalid credentials'}), 401

        db_execute(
            lambda client: client.table("members").update({
                "last_seen": datetime.utcnow().isoformat()
            }).eq("id", member['id']).execute()
        )

        member_data = public_member(member)
        # Auto-promote configured bootstrap email
        bootstrap = (os.environ.get('SUPERADMIN_EMAIL') or '').strip().lower()
        if bootstrap and (member_data.get('email') or '').lower() == bootstrap and member_data.get('role') != 'super_admin':
            try:
                promoted = db_execute(
                    lambda client: client.table("members").update({'role': 'super_admin'}).eq('id', member['id']).execute()
                )
                if promoted.data:
                    member_data = public_member(promoted.data[0])
            except Exception as e:
                print(f"Superadmin bootstrap skipped: {e}")

        token = create_access_token(identity=str(member_data['id']))
        return jsonify({'token': token, 'member': member_data}), 200

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed', 'message': str(e)}), 500

@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_me():
    db_error = require_db()
    if db_error:
        return db_error

    try:
        member_id = get_jwt_identity()
        result = db_execute(
            lambda client: client.table("members").select("*").eq("id", member_id).single().execute()
        )
        if not result.data:
            return jsonify({'error': 'Member not found'}), 404
        return jsonify(public_member(result.data)), 200
    except Exception as e:
        print(f"Get me error: {e}")
        return jsonify({'error': 'Member not found'}), 404


@app.route('/api/me/stats', methods=['GET'])
@jwt_required()
def get_my_stats():
    """Personal realtime stats for the member portal."""
    db_error = require_db()
    if db_error:
        return db_error

    try:
        member_id = get_jwt_identity()
        member = db_execute(
            lambda client: client.table("members").select("*").eq("id", member_id).single().execute()
        )
        if not member.data:
            return jsonify({'error': 'Member not found'}), 404

        attendance = try_supabase(
            lambda: supabase.table("attendance").select("id", count="exact").eq("member_id", member_id).execute(),
            None,
        )
        giving = try_supabase(
            lambda: supabase.table("giving").select("amount").eq("member_id", member_id).execute(),
            None,
        )

        attendance_count = 0
        if attendance:
            if getattr(attendance, "count", None) is not None:
                attendance_count = int(attendance.count or 0)
            elif attendance.data:
                attendance_count = len(attendance.data)

        giving_total = 0.0
        if giving and giving.data:
            giving_total = sum(float(g.get("amount") or 0) for g in giving.data)

        completions = try_supabase(
            lambda: supabase.table("material_completions").select("id", count="exact").eq("member_id", member_id).execute(),
            None,
        )
        courses_completed = 0
        if completions:
            if getattr(completions, "count", None) is not None:
                courses_completed = int(completions.count or 0)
            elif completions.data:
                courses_completed = len(completions.data)

        return jsonify({
            'attendance': attendance_count,
            'streak': member.data.get('streak') or 0,
            'coursesCompleted': courses_completed,
            'givingTotal': round(giving_total, 2),
            'engagementScore': member.data.get('engagement_score') or 0,
            'updated_at': datetime.utcnow().isoformat() + 'Z',
        }), 200
    except Exception as e:
        print(f"Get my stats error: {e}")
        return jsonify({'error': 'Failed to load stats', 'message': str(e)}), 500

# ============================================================================
# LIVE STREAMING ROUTES (with seed data fallback)
# ============================================================================

@app.route('/api/live/streams', methods=['GET'])
def get_streams():
    try:
        result = try_supabase(
            lambda: supabase.table("live_streams").select("*").order("started_at", desc=True).execute(),
            None
        )
        rows = list(result.data) if result and result.data else []
        ids = {str(r.get('id')) for r in rows}
        for s in STREAM_STORE:
            if str(s.get('id')) not in ids:
                rows.append(s)
        if rows:
            return jsonify({'streams': rows, 'total': len(rows)}), 200
        return jsonify({'streams': STREAM_STORE, 'total': len(STREAM_STORE)}), 200
    except Exception as e:
        return jsonify({'streams': STREAM_STORE, 'total': len(STREAM_STORE)}), 200

@app.route('/api/live/streams/<stream_id>', methods=['GET'])
def get_stream(stream_id):
    try:
        stream = next((s for s in STREAM_STORE if str(s['id']) == str(stream_id)), None)
        # Only query Supabase when id looks like a UUID
        if stream is None and db_ready() and len(str(stream_id)) >= 32:
            result = try_supabase(
                lambda: supabase.table("live_streams").select("*").eq("id", stream_id).single().execute(),
                None
            )
            stream = result.data if result else None
        if not stream:
            return jsonify({'error': 'Stream not found'}), 404

        comments = [c for c in SEED_COMMENTS if c['stream_id'] == stream_id]
        if db_ready() and len(str(stream_id)) >= 32:
            comments_result = try_supabase(
                lambda: supabase.table("stream_comments").select("*").eq("stream_id", stream_id).order("created_at", desc=True).limit(50).execute(),
                None
            )
            if comments_result and comments_result.data:
                comments = comments_result.data

        reaction_counts = reaction_store.get_counts('stream', stream_id)
        return jsonify({
            'stream': stream,
            'comments': comments,
            'reactions': reaction_counts,
            'reaction_total': sum(reaction_counts.values()),
        }), 200
    except Exception as e:
        stream = next((s for s in STREAM_STORE if str(s['id']) == str(stream_id)), None)
        if not stream:
            return jsonify({'error': 'Stream not found'}), 404
        comments = [c for c in SEED_COMMENTS if c['stream_id'] == stream_id]
        reaction_counts = reaction_store.get_counts('stream', stream_id)
        return jsonify({
            'stream': stream,
            'comments': comments,
            'reactions': reaction_counts,
            'reaction_total': sum(reaction_counts.values()),
        }), 200


@app.route('/api/live/streams/<stream_id>/like', methods=['POST'])
def like_stream(stream_id):
    """Increment stream like / Amen count."""
    stream = next((s for s in STREAM_STORE if str(s['id']) == str(stream_id)), None)
    if stream is not None:
        stream['like_count'] = (stream.get('like_count') or 0) + 1
        like_count = stream['like_count']
    else:
        like_count = None
        if db_ready():
            try:
                cur = db_execute(
                    lambda client: client.table("live_streams").select("like_count").eq("id", stream_id).single().execute()
                )
                like_count = (cur.data.get('like_count') or 0) + 1 if cur.data else 1
                db_execute(
                    lambda client: client.table("live_streams").update({"like_count": like_count}).eq("id", stream_id).execute()
                )
            except Exception as e:
                print(f"Like DB error: {e}")
                like_count = 1

    counts = reaction_store.add_reaction('stream', stream_id, 'amen')
    socketio.emit('like_update', {
        'stream_id': stream_id,
        'like_count': like_count if like_count is not None else counts.get('amen', 0),
    }, room=f'stream_{stream_id}')
    socketio.emit('reaction_counts_updated', {
        'content_id': stream_id,
        'content_type': 'stream',
        'counts': counts,
        'type': 'amen',
        'emoji': reaction_store.EMOJI_MAP['amen'],
    }, room=f'stream_{stream_id}')

    broadcast_stats()
    return jsonify({
        'status': 'ok',
        'like_count': like_count,
        'reactions': counts,
    }), 200


@app.route('/api/reactions/<content_type>/<content_id>', methods=['GET'])
def get_reactions(content_type, content_id):
    if content_type not in ('stream', 'media'):
        return jsonify({'error': 'Invalid content type'}), 400
    counts = reaction_store.get_counts(content_type, content_id)
    return jsonify({
        'counts': counts,
        'total': sum(counts.values()),
        'types': list(reaction_store.REACTION_TYPES),
    }), 200


@app.route('/api/reactions/<content_type>/<content_id>', methods=['POST'])
def post_reaction(content_type, content_id):
    if content_type not in ('stream', 'media'):
        return jsonify({'error': 'Invalid content type'}), 400
    data = request.get_json(silent=True) or {}
    reaction_type = data.get('type') or 'amen'
    counts = reaction_store.add_reaction(content_type, content_id, reaction_type)
    normalized = reaction_store.normalize_type(reaction_type)
    emoji = reaction_store.EMOJI_MAP.get(normalized, '🙏')

    payload = {
        'content_id': content_id,
        'content_type': content_type,
        'stream_id': content_id if content_type == 'stream' else None,
        'type': normalized,
        'emoji': emoji,
        'counts': counts,
        'timestamp': datetime.utcnow().isoformat(),
    }
    if content_type == 'stream':
        socketio.emit('reaction_counts_updated', payload, room=f'stream_{content_id}')
        socketio.emit('reaction', payload, room=f'stream_{content_id}')

    # Bump media like_count lightly for love/amen
    if content_type == 'media' and normalized in ('amen', 'love'):
        for m in MEDIA_STORE:
            if str(m.get('id')) == str(content_id):
                m['like_count'] = (m.get('like_count') or 0) + 1
                break

    broadcast_stats()
    return jsonify({'status': 'ok', 'counts': counts, 'type': normalized, 'emoji': emoji}), 200

@app.route('/api/live/streams/<stream_id>/comments', methods=['GET'])
def get_stream_comments(stream_id):
    try:
        result = try_supabase(
            lambda: supabase.table("stream_comments").select("*").eq("stream_id", stream_id).order("created_at", desc=True).limit(100).execute(),
            None
        )
        if result and result.data:
            return jsonify({'comments': result.data}), 200
        comments = [c for c in SEED_COMMENTS if c['stream_id'] == stream_id]
        return jsonify({'comments': comments}), 200
    except Exception as e:
        comments = [c for c in SEED_COMMENTS if c['stream_id'] == stream_id]
        return jsonify({'comments': comments}), 200

@app.route('/api/live/streams/<stream_id>/comments', methods=['POST'])
@jwt_required()
def post_comment(stream_id):
    try:
        data = request.get_json()
        member_id = get_jwt_identity()

        comment = {
            "stream_id": stream_id,
            "member_id": member_id,
            "content": data.get('content'),
            "created_at": datetime.utcnow().isoformat()
        }

        result = try_supabase(
            lambda: supabase.table("stream_comments").insert(comment).execute(),
            None
        )

        # Get member info
        member = try_supabase(
            lambda: supabase.table("members").select("full_name, unique_id").eq("id", member_id).single().execute(),
            None
        )

        comment_data = result.data[0] if result and result.data else comment
        if member and member.data:
            comment_data['member_name'] = member.data.get('full_name', 'Anonymous')
            comment_data['member_location'] = 'Your Location'

        socketio.emit('new_comment', comment_data, room=f'stream_{stream_id}')
        return jsonify({'comment': comment_data}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# MEDIA LIBRARY ROUTES
# ============================================================================

@app.route('/api/media/library', methods=['GET'])
def get_media_library():
    try:
        sort = request.args.get('sort', 'latest')
        topic = request.args.get('topic', 'all')
        language = request.args.get('language', 'all')
        search = request.args.get('q', '').lower()
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 12))

        media = list(MEDIA_STORE)

        # Merge DB media if available
        db_media = try_supabase(
            lambda: supabase.table("media").select("*").order("published_at", desc=True).execute(),
            None
        )
        if db_media and db_media.data:
            existing_ids = {str(m.get('id')) for m in media}
            for row in db_media.data:
                mapped = {
                    **row,
                    'video_url': row.get('url'),
                    'duration': row.get('duration_seconds') or 0,
                    'upload_date': row.get('published_at') or row.get('created_at'),
                    'topics': [],
                    'available_languages': [row.get('language') or 'en'],
                    'type': row.get('media_type') or 'video',
                    'is_live': False,
                    'is_new': False,
                }
                if str(mapped.get('id')) not in existing_ids:
                    media.append(mapped)

        if topic != 'all':
            media = [m for m in media if topic in (m.get('topics') or [])]
        if language != 'all':
            media = [m for m in media if language in (m.get('available_languages') or [m.get('language')])]
        if search:
            media = [m for m in media if search in (m.get('title') or '').lower() or search in (m.get('speaker') or '').lower()]

        if sort == 'latest':
            media.sort(key=lambda x: x.get('upload_date') or '', reverse=True)
        elif sort == 'most_viewed':
            media.sort(key=lambda x: x.get('view_count') or 0, reverse=True)
        elif sort == 'most_shared':
            media.sort(key=lambda x: x.get('share_count', 0), reverse=True)
        elif sort == 'longest':
            media.sort(key=lambda x: x.get('duration') or 0, reverse=True)
        elif sort == 'shortest':
            media.sort(key=lambda x: x.get('duration') or 0)

        total = len(media)
        start = (page - 1) * per_page
        end = start + per_page

        return jsonify({
            'media': media[start:end],
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }), 200
    except Exception as e:
        return jsonify({'media': MEDIA_STORE[:12], 'total': len(MEDIA_STORE), 'page': 1, 'per_page': 12, 'total_pages': 1}), 200

@app.route('/api/media/<media_id>', methods=['GET'])
def get_media_item(media_id):
    media = next((m for m in MEDIA_STORE if str(m['id']) == str(media_id)), None)
    if not media and db_ready():
        try:
            result = db_execute(
                lambda client: client.table("media").select("*").eq("id", media_id).single().execute()
            )
            if result.data:
                row = result.data
                media = {
                    **row,
                    'video_url': row.get('url'),
                    'duration': row.get('duration_seconds') or 0,
                    'upload_date': row.get('published_at') or row.get('created_at'),
                    'topics': [],
                    'available_languages': [row.get('language') or 'en'],
                    'type': row.get('media_type') or 'video',
                }
        except Exception:
            media = None
    if not media:
        return jsonify({'error': 'Not found'}), 404
    # Increment view count realistically when opened
    media['view_count'] = (media.get('view_count') or 0) + 1
    counts = reaction_store.get_counts('media', media_id)
    return jsonify({
        'media': media,
        'reactions': counts,
        'reaction_total': sum(counts.values()),
    }), 200

@app.route('/api/media/series', methods=['GET'])
def get_all_series():
    return jsonify({'series': SEED_SERIES}), 200

@app.route('/api/media/series/<series_id>', methods=['GET'])
def get_series(series_id):
    series = next((s for s in SEED_SERIES if s['id'] == series_id), None)
    if not series:
        return jsonify({'error': 'Not found'}), 404
    episodes = [m for m in SEED_MEDIA if m.get('series_id') == series_id]
    episodes.sort(key=lambda x: x.get('episode_number', 0))
    return jsonify({'series': series, 'episodes': episodes}), 200

@app.route('/api/media/search', methods=['GET'])
def search_media():
    query = request.args.get('q', '').lower()
    if not query or len(query) < 2:
        return jsonify({'results': [], 'suggestions': []})

    results = []
    for m in SEED_MEDIA:
        score = 0
        if query in m['title'].lower(): score += 10
        if query in m['speaker'].lower(): score += 5
        if query in m.get('description', '').lower(): score += 3
        if any(query in t.lower() for t in m['topics']): score += 4
        if query in m.get('bible_reference', '').lower(): score += 8
        if score > 0:
            results.append({**m, 'relevance_score': score})

    results.sort(key=lambda x: x['relevance_score'], reverse=True)
    return jsonify({'results': results[:20], 'suggestions': [], 'total': len(results)}), 200

# ============================================================================
# PRAYER WALL ROUTES
# ============================================================================

@app.route('/api/prayers', methods=['GET'])
def get_prayers():
    try:
        result = try_supabase(
            lambda: supabase.table("prayer_requests").select("*").eq("is_public", True).order("created_at", desc=True).limit(50).execute(),
            None
        )
        if result and result.data:
            return jsonify({'prayers': result.data}), 200
        return jsonify({'prayers': SEED_PRAYERS}), 200
    except Exception as e:
        return jsonify({'prayers': SEED_PRAYERS}), 200

@app.route('/api/prayers', methods=['POST'])
@jwt_required()
def create_prayer():
    db_error = require_db()
    if db_error:
        return db_error

    try:
        data = request.get_json(silent=True) or {}
        member_id = get_jwt_identity()
        content = (data.get('content') or '').strip()
        if not content:
            return jsonify({'error': 'Prayer content is required'}), 400

        prayer = {
            "member_id": member_id,
            "content": content,
            "is_public": bool(data.get('is_public', True)),
            "pray_count": 0,
        }

        result = db_execute(
            lambda client: client.table("prayer_requests").insert(prayer).execute()
        )
        if not result.data:
            return jsonify({'error': 'Failed to save prayer request'}), 500
        broadcast_stats()
        return jsonify({'prayer': result.data[0]}), 201
    except Exception as e:
        print(f"Create prayer error: {e}")
        return jsonify({'error': 'Failed to save prayer request', 'message': str(e)}), 500

@app.route('/api/prayers/<prayer_id>/pray', methods=['POST'])
@jwt_required()
def pray_for_request(prayer_id):
    db_error = require_db()
    if db_error:
        return db_error

    try:
        db_execute(
            lambda client: client.rpc("increment_pray_count", {"p_id": prayer_id}).execute()
        )
        return jsonify({'status': 'ok'}), 200
    except Exception as e:
        print(f"Pray error: {e}")
        return jsonify({'error': 'Failed to update prayer count', 'message': str(e)}), 500

# ============================================================================
# GIVING ROUTES (payment_routes registers /api/give + PayPal/M-Pesa)
# ============================================================================

@app.route('/api/giving/history', methods=['GET'])
@jwt_required()
def get_giving_history():
    try:
        member_id = get_jwt_identity()
        result = try_supabase(
            lambda: supabase.table("giving").select("*").eq("member_id", member_id).order("created_at", desc=True).execute(),
            None
        )
        if result and result.data:
            return jsonify({'history': result.data}), 200
        return jsonify({'history': []}), 200
    except Exception as e:
        return jsonify({'history': []}), 200

# ============================================================================
# ATTENDANCE ROUTES
# ============================================================================

@app.route('/api/attendance', methods=['POST'])
@jwt_required()
def check_in():
    db_error = require_db()
    if db_error:
        return db_error

    try:
        member_id = get_jwt_identity()
        data = request.get_json(silent=True) or {}

        record = {
            "member_id": member_id,
            "service_type": data.get('service_type') or 'sunday_service',
            "mode": data.get('mode') or 'online',
        }
        if data.get('location_code'):
            record["location_code"] = data.get('location_code')

        db_execute(
            lambda client: client.table("attendance").insert(record).execute()
        )

        member = db_execute(
            lambda client: client.table("members").select("engagement_score, streak").eq("id", member_id).single().execute()
        )
        if member.data:
            new_score = (member.data.get('engagement_score') or 0) + 10
            new_streak = (member.data.get('streak') or 0) + 1
            db_execute(
                lambda client: client.table("members").update({
                    "engagement_score": new_score,
                    "streak": new_streak,
                    "last_seen": datetime.utcnow().isoformat()
                }).eq("id", member_id).execute()
            )
            broadcast_stats()
            return jsonify({'status': 'ok', 'score': new_score, 'streak': new_streak}), 200

        broadcast_stats()
        return jsonify({'status': 'ok'}), 200
    except Exception as e:
        print(f"Attendance error: {e}")
        return jsonify({'error': 'Check-in failed', 'message': str(e)}), 500

# ============================================================================
# WEBSOCKET EVENTS
# ============================================================================

@socketio.on('connect')
def handle_connect():
    CONNECTED_CLIENTS.add(request.sid)
    print(f'Client connected: {request.sid} (online={len(CONNECTED_CLIENTS)})')
    emit('connected', {'status': 'connected', 'online_now': len(CONNECTED_CLIENTS)})
    emit('platform_stats_updated', snapshot_stats())

@socketio.on('disconnect')
def handle_disconnect():
    CONNECTED_CLIENTS.discard(request.sid)
    print(f'Client disconnected: {request.sid} (online={len(CONNECTED_CLIENTS)})')
    broadcast_stats()

@socketio.on('join_stream')
def handle_join_stream(data):
    stream_id = data.get('stream_id')
    room = f'stream_{stream_id}'
    join_room(room)
    emit('joined_stream', {'stream_id': stream_id})

    # Update viewer count
    stream = next((s for s in STREAM_STORE if str(s['id']) == str(stream_id)), None)
    if stream:
        stream['viewer_count'] = (stream.get('viewer_count') or 0) + 1
        payload = {
            'stream_id': stream_id,
            'viewer_count': stream['viewer_count']
        }
        # Emit both event names for frontend compatibility
        socketio.emit('viewer_count_updated', payload, room=room)
        socketio.emit('viewer_update', payload, room=room)

    # Send current reaction totals to the joining client
    counts = reaction_store.get_counts('stream', stream_id)
    emit('reaction_counts_updated', {
        'content_id': stream_id,
        'content_type': 'stream',
        'counts': counts,
    })
    broadcast_stats()

@socketio.on('leave_stream')
def handle_leave_stream(data):
    stream_id = data.get('stream_id')
    room = f'stream_{stream_id}'
    leave_room(room)

    stream = next((s for s in STREAM_STORE if str(s['id']) == str(stream_id)), None)
    if stream:
        stream['viewer_count'] = max(0, (stream.get('viewer_count') or 0) - 1)
        payload = {
            'stream_id': stream_id,
            'viewer_count': stream['viewer_count']
        }
        socketio.emit('viewer_count_updated', payload, room=room)
        socketio.emit('viewer_update', payload, room=room)

    emit('left_stream', {'stream_id': stream_id})
    broadcast_stats()

@socketio.on('stream_reaction')
def handle_reaction(data):
    stream_id = data.get('stream_id')
    reaction_type = data.get('type', 'amen')
    content_type = data.get('content_type') or 'stream'
    counts = reaction_store.add_reaction(content_type, stream_id, reaction_type)
    normalized = reaction_store.normalize_type(reaction_type)
    payload = {
        'stream_id': stream_id,
        'content_id': stream_id,
        'content_type': content_type,
        'type': normalized,
        'emoji': reaction_store.EMOJI_MAP.get(normalized, '🙏'),
        'counts': counts,
        'timestamp': datetime.utcnow().isoformat()
    }
    room = f'stream_{stream_id}'
    socketio.emit('reaction', payload, room=room)
    socketio.emit('reaction_counts_updated', payload, room=room)
    broadcast_stats()

@socketio.on('post_comment')
def handle_socket_comment(data):
    stream_id = data.get('stream_id')
    content = data.get('content', '')

    comment = {
        'id': f"comment-{secrets.token_hex(4)}",
        'stream_id': stream_id,
        'member_name': data.get('member_name', 'Anonymous'),
        'member_location': data.get('member_location', 'Unknown'),
        'content': content,
        'language': data.get('language', 'en'),
        'is_prayer_request': '🙏' in content or 'pray' in content.lower(),
        'created_at': datetime.utcnow().isoformat()
    }

    socketio.emit('new_comment', comment, room=f'stream_{stream_id}')

# ============================================================================
# ADMIN ROUTES
# ============================================================================

try:
    from .admin_routes import register_admin_routes
except ImportError:
    from admin_routes import register_admin_routes

register_admin_routes(
    app,
    socketio=socketio,
    supabase=supabase,
    db_ready=db_ready,
    db_execute=db_execute,
    try_supabase=try_supabase,
    public_member=public_member,
    SEED_MEDIA=SEED_MEDIA,
    SEED_STREAMS=SEED_STREAMS,
    SEED_SERIES=SEED_SERIES,
    MEDIA_STORE=MEDIA_STORE,
    STREAM_STORE=STREAM_STORE,
    snapshot_stats=snapshot_stats,
    broadcast_stats=broadcast_stats,
)

try:
    from .payment_routes import register_payment_routes
except ImportError:
    from payment_routes import register_payment_routes

register_payment_routes(
    app,
    socketio=socketio,
    supabase=supabase,
    db_ready=db_ready,
    db_execute=db_execute,
    try_supabase=try_supabase,
    broadcast_stats=broadcast_stats,
    payments_mod=payments_mod,
)

try:
    from .spiritual_routes import register_spiritual_routes
except ImportError:
    from spiritual_routes import register_spiritual_routes

register_spiritual_routes(
    app,
    supabase=supabase,
    db_ready=db_ready,
    db_execute=db_execute,
    try_supabase=try_supabase,
    SPIRITUAL_MATERIALS_STORE=SPIRITUAL_MATERIALS_STORE,
)

# ============================================================================
# FRONTEND SERVING (SPA ROUTING)
# ============================================================================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve React SPA - all routes return index.html"""
    dist_path = Path(app.static_folder) if app.static_folder else DIST_DIR

    # Try to serve static file if it exists
    if path:
        file_path = dist_path / path
        if file_path.exists() and file_path.is_file():
            return send_from_directory(str(dist_path), path)

    # Serve index.html for all routes (SPA routing)
    index_file = dist_path / 'index.html'
    if index_file.exists():
        return send_from_directory(str(dist_path), 'index.html')

    # Fallback if frontend not built
    return jsonify({
        'error': 'Frontend not built',
        'message': 'Run: cd frontend && npm run build',
        'api_status': 'ok',
        'api_health': '/api/health'
    }), 503

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================================
# RUN
# ============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
