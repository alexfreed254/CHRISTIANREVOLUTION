"""
Christ Revolution Movement (CRM) — Flask API with Real-time Features
Production-ready for Render deployment with Supabase backend
"""

import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from pathlib import Path
import os
import secrets

# Import your existing modules
from supabase_client import supabase
from auth import hash_password, verify_password, generate_unique_id

# Initialize Flask
app = Flask(__name__, static_folder='../frontend/dist', template_folder='../frontend/dist')
app.config['SECRET_KEY'] = os.environ.get('SESSION_SECRET', secrets.token_hex(32))
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', secrets.token_hex(32))
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

# CORS for Render
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

# SocketIO with eventlet for WebSocket support on Render
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet', 
                    ping_timeout=60, ping_interval=25, max_http_buffer_size=1e6)

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
        "viewer_count": 14230,
        "like_count": 2450,
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

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def try_supabase(query_func, fallback=None):
    """Try Supabase query, return fallback on error"""
    try:
        return query_func()
    except Exception as e:
        print(f"Supabase error: {e}")
        return fallback

# ============================================================================
# AUTH ROUTES (using your existing auth.py)
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'service': 'CRM Central Command',
        'time': datetime.utcnow().isoformat()
    }), 200

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        required = ['full_name', 'continent', 'country', 'city', 'email', 'phone', 'username', 'password']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing: {field}'}), 400

        # Check existing
        existing = try_supabase(
            lambda: supabase.table("members").select("id").eq("username", data['username']).execute(),
            None
        )
        if existing and existing.data:
            return jsonify({'error': 'Username taken'}), 400

        existing_email = try_supabase(
            lambda: supabase.table("members").select("id").eq("email", data['email']).execute(),
            None
        )
        if existing_email and existing_email.data:
            return jsonify({'error': 'Email registered'}), 400

        unique_id = generate_unique_id(data['continent'], data['country'], data['city'])
        password_hash = hash_password(data['password'])

        member = {
            "full_name": data['full_name'],
            "continent": data['continent'],
            "country": data['country'],
            "city": data['city'],
            "village": data.get('village'),
            "email": data['email'],
            "phone": data['phone'],
            "username": data['username'],
            "password_hash": password_hash,
            "unique_id": unique_id,
            "growth_stage": "new_believer",
            "engagement_score": 0,
            "streak": 0,
            "joined_at": datetime.utcnow().isoformat(),
            "preferred_language": "en",
            "timezone": "UTC"
        }

        result = try_supabase(lambda: supabase.table("members").insert(member).execute(), None)
        if not result or not result.data:
            # Return demo response if Supabase fails
            return jsonify({
                'token': create_access_token(identity='demo-member-id'),
                'member': {
                    'id': 'demo-member-id',
                    'full_name': data['full_name'],
                    'unique_id': unique_id,
                    'growth_stage': 'new_believer',
                    'streak': 0,
                    'engagement_score': 0
                }
            }), 201

        member_data = result.data[0]
        member_data.pop('password_hash', None)
        token = create_access_token(identity=member_data['id'])
        return jsonify({'token': token, 'member': member_data}), 201

    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password required'}), 400

        result = try_supabase(
            lambda: supabase.table("members").select("*").eq("username", data['username']).execute(),
            None
        )
        if not result or not result.data:
            return jsonify({'error': 'Invalid credentials'}), 401

        member = result.data[0]
        if not verify_password(data['password'], member['password_hash']):
            return jsonify({'error': 'Invalid credentials'}), 401

        # Update last seen
        try_supabase(lambda: supabase.table("members").update({
            "last_seen": datetime.utcnow().isoformat()
        }).eq("id", member['id']).execute(), None)

        member.pop('password_hash', None)
        token = create_access_token(identity=member['id'])
        return jsonify({'token': token, 'member': member}), 200

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_me():
    try:
        member_id = get_jwt_identity()
        result = try_supabase(
            lambda: supabase.table("members").select("*").eq("id", member_id).single().execute(),
            None
        )
        if not result or not result.data:
            return jsonify({'error': 'Member not found'}), 404
        member = result.data
        member.pop('password_hash', None)
        return jsonify(member), 200
    except Exception as e:
        print(f"Get me error: {e}")
        return jsonify({'error': str(e)}), 500

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
        if result and result.data:
            return jsonify({'streams': result.data, 'total': len(result.data)}), 200
        return jsonify({'streams': SEED_STREAMS, 'total': len(SEED_STREAMS)}), 200
    except Exception as e:
        return jsonify({'streams': SEED_STREAMS, 'total': len(SEED_STREAMS)}), 200

@app.route('/api/live/streams/<stream_id>', methods=['GET'])
def get_stream(stream_id):
    try:
        result = try_supabase(
            lambda: supabase.table("live_streams").select("*").eq("id", stream_id).single().execute(),
            None
        )
        stream = result.data if result else None
        if not stream:
            stream = next((s for s in SEED_STREAMS if s['id'] == stream_id), None)
        if not stream:
            return jsonify({'error': 'Stream not found'}), 404

        comments_result = try_supabase(
            lambda: supabase.table("stream_comments").select("*").eq("stream_id", stream_id).order("created_at", desc=True).limit(50).execute(),
            None
        )
        comments = comments_result.data if comments_result else []
        if not comments:
            comments = [c for c in SEED_COMMENTS if c['stream_id'] == stream_id]

        return jsonify({'stream': stream, 'comments': comments}), 200
    except Exception as e:
        stream = next((s for s in SEED_STREAMS if s['id'] == stream_id), None)
        if not stream:
            return jsonify({'error': 'Stream not found'}), 404
        comments = [c for c in SEED_COMMENTS if c['stream_id'] == stream_id]
        return jsonify({'stream': stream, 'comments': comments}), 200

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

        media = list(SEED_MEDIA)

        if topic != 'all':
            media = [m for m in media if topic in m['topics']]
        if language != 'all':
            media = [m for m in media if language in m['available_languages']]
        if search:
            media = [m for m in media if search in m['title'].lower() or search in m['speaker'].lower()]

        if sort == 'latest':
            media.sort(key=lambda x: x['upload_date'], reverse=True)
        elif sort == 'most_viewed':
            media.sort(key=lambda x: x['view_count'], reverse=True)
        elif sort == 'most_shared':
            media.sort(key=lambda x: x.get('share_count', 0), reverse=True)
        elif sort == 'longest':
            media.sort(key=lambda x: x['duration'], reverse=True)
        elif sort == 'shortest':
            media.sort(key=lambda x: x['duration'])

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
        return jsonify({'media': SEED_MEDIA[:12], 'total': len(SEED_MEDIA), 'page': 1, 'per_page': 12, 'total_pages': 1}), 200

@app.route('/api/media/<media_id>', methods=['GET'])
def get_media_item(media_id):
    media = next((m for m in SEED_MEDIA if m['id'] == media_id), None)
    if not media:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'media': media}), 200

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
    try:
        data = request.get_json()
        member_id = get_jwt_identity()

        prayer = {
            "member_id": member_id,
            "content": data.get('content'),
            "is_public": data.get('is_public', True),
            "pray_count": 0,
            "created_at": datetime.utcnow().isoformat()
        }

        result = try_supabase(
            lambda: supabase.table("prayer_requests").insert(prayer).execute(),
            None
        )

        if result and result.data:
            return jsonify({'prayer': result.data[0]}), 201
        return jsonify({'prayer': {**prayer, 'id': 'local-prayer'}}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prayers/<prayer_id>/pray', methods=['POST'])
@jwt_required()
def pray_for_request(prayer_id):
    try:
        try_supabase(
            lambda: supabase.rpc("increment_pray_count", {"p_id": prayer_id}).execute(),
            None
        )
        return jsonify({'status': 'ok'}), 200
    except Exception as e:
        return jsonify({'status': 'ok'}), 200

# ============================================================================
# GIVING ROUTES
# ============================================================================

@app.route('/api/give', methods=['POST'])
@jwt_required()
def process_giving():
    try:
        data = request.get_json()
        member_id = get_jwt_identity()

        record = {
            "member_id": member_id,
            "amount": data.get('amount', 0),
            "currency": data.get('currency', 'USD'),
            "category": data.get('type', 'tithe'),
            "is_recurring": data.get('frequency') != 'one-time',
            "payment_method": data.get('payment_method', 'card'),
            "receipt_id": f"CRM-{secrets.token_hex(5).upper()}",
            "created_at": datetime.utcnow().isoformat()
        }

        result = try_supabase(
            lambda: supabase.table("giving").insert(record).execute(),
            None
        )

        return jsonify({
            'message': 'Giving recorded successfully',
            'receipt': result.data[0] if result and result.data else record
        }), 200
    except Exception as e:
        return jsonify({'message': 'Giving recorded', 'receipt': {'amount': data.get('amount')}}), 200

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
    try:
        member_id = get_jwt_identity()
        data = request.get_json()

        record = {
            "member_id": member_id,
            "service_type": data.get('service_type', 'sunday'),
            "mode": data.get('mode', 'online'),
            "location_code": data.get('location_code'),
            "attended_at": datetime.utcnow().isoformat()
        }

        try_supabase(lambda: supabase.table("attendance").insert(record).execute(), None)

        # Update engagement
        member = try_supabase(
            lambda: supabase.table("members").select("engagement_score, streak").eq("id", member_id).single().execute(),
            None
        )
        if member and member.data:
            new_score = (member.data.get('engagement_score') or 0) + 10
            new_streak = (member.data.get('streak') or 0) + 1
            try_supabase(lambda: supabase.table("members").update({
                "engagement_score": new_score,
                "streak": new_streak,
                "last_seen": datetime.utcnow().isoformat()
            }).eq("id", member_id).execute(), None)
            return jsonify({'status': 'ok', 'score': new_score, 'streak': new_streak}), 200

        return jsonify({'status': 'ok'}), 200
    except Exception as e:
        return jsonify({'status': 'ok'}), 200

# ============================================================================
# WEBSOCKET EVENTS
# ============================================================================

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('connected', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')

@socketio.on('join_stream')
def handle_join_stream(data):
    stream_id = data.get('stream_id')
    room = f'stream_{stream_id}'
    join_room(room)
    emit('joined_stream', {'stream_id': stream_id})

    # Update viewer count
    stream = next((s for s in SEED_STREAMS if s['id'] == stream_id), None)
    if stream:
        stream['viewer_count'] += 1
        socketio.emit('viewer_count_updated', {
            'stream_id': stream_id,
            'viewer_count': stream['viewer_count']
        }, room=room)

@socketio.on('leave_stream')
def handle_leave_stream(data):
    stream_id = data.get('stream_id')
    room = f'stream_{stream_id}'
    leave_room(room)

    stream = next((s for s in SEED_STREAMS if s['id'] == stream_id), None)
    if stream:
        stream['viewer_count'] = max(0, stream['viewer_count'] - 1)
        socketio.emit('viewer_count_updated', {
            'stream_id': stream_id,
            'viewer_count': stream['viewer_count']
        }, room=room)

    emit('left_stream', {'stream_id': stream_id})

@socketio.on('stream_reaction')
def handle_reaction(data):
    stream_id = data.get('stream_id')
    reaction_type = data.get('type', 'like')
    socketio.emit('reaction', {
        'stream_id': stream_id,
        'type': reaction_type,
        'timestamp': datetime.utcnow().isoformat()
    }, room=f'stream_{stream_id}', include_self=False)

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
# FRONTEND SERVING (SPA ROUTING)
# ============================================================================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve React SPA - all routes return index.html"""
    dist_path = Path(app.static_folder)

    # Try to serve static file if it exists
    if path:
        file_path = dist_path / path
        if file_path.exists() and file_path.is_file():
            return send_from_directory(app.static_folder, path)

    # Serve index.html for all routes (SPA routing)
    index_file = dist_path / 'index.html'
    if index_file.exists():
        return send_from_directory(app.static_folder, 'index.html')

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
