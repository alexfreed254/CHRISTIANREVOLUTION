"""Daily Spiritual Materials & Discipleship Library helpers."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Iterable

MATERIAL_TYPES = [
    'daily_christ_bite',
    'daily_devotional',
    'bible_study',
    'sermon_note',
    'video',
    'audio',
    'podcast',
    'ebook',
    'pdf',
    'course',
    'training_material',
    'prayer',
    'fasting',
    'bible_reading_plan',
]

MATERIAL_TYPE_LABELS = {
    'daily_christ_bite': 'Daily Christ Bite',
    'daily_devotional': 'Daily Devotional',
    'bible_study': 'Bible Study',
    'sermon_note': 'Sermon Note',
    'video': 'Video',
    'audio': 'Audio',
    'podcast': 'Podcast',
    'ebook': 'E-book',
    'pdf': 'PDF',
    'course': 'Course',
    'training_material': 'Training Material',
    'prayer': 'Prayer Material',
    'fasting': 'Fasting Material',
    'bible_reading_plan': 'Bible Reading Plan',
}

LIBRARY_SECTIONS = [
    {'id': 'courses', 'label': 'Courses', 'types': ['course']},
    {'id': 'ebooks', 'label': 'E-books', 'types': ['ebook']},
    {'id': 'pdfs', 'label': 'PDF Materials', 'types': ['pdf', 'sermon_note']},
    {'id': 'videos', 'label': 'Videos', 'types': ['video']},
    {'id': 'audios', 'label': 'Audios', 'types': ['audio']},
    {'id': 'podcasts', 'label': 'Podcasts', 'types': ['podcast']},
    {'id': 'bible_studies', 'label': 'Bible Studies', 'types': ['bible_study']},
    {'id': 'devotionals', 'label': 'Devotionals', 'types': ['daily_devotional', 'daily_christ_bite']},
    {'id': 'training', 'label': 'Training Materials', 'types': ['training_material']},
]

SUPPORTED_LANGUAGES = [
    {'code': 'en', 'label': 'English'},
    {'code': 'sw', 'label': 'Kiswahili'},
    {'code': 'fr', 'label': 'French'},
    {'code': 'es', 'label': 'Spanish'},
    {'code': 'pt', 'label': 'Portuguese'},
    {'code': 'ar', 'label': 'Arabic'},
]


def _now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + 'Z'


def _parse_dt(value) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value).replace('Z', '+00:00').replace('+00:00', ''))
    except ValueError:
        return None


def effective_status(row: dict, now: datetime | None = None) -> str:
    """Resolve scheduled items that should now be published."""
    now = now or datetime.utcnow()
    status = (row.get('status') or 'draft').lower()
    publish_at = _parse_dt(row.get('publish_at'))
    available_until = _parse_dt(row.get('available_until'))

    if status == 'archived':
        return 'archived'
    if available_until and now > available_until:
        return 'archived'
    if status == 'scheduled' and publish_at and publish_at <= now:
        return 'published'
    return status


def is_publicly_visible(row: dict, *, member_logged_in: bool = False) -> bool:
    status = effective_status(row)
    if status != 'published':
        return False
    visibility = (row.get('visibility') or 'public').lower()
    if visibility == 'members' and not member_logged_in:
        return False
    return True


def normalize_material_row(row: dict) -> dict:
    if not row:
        return row
    out = dict(row)
    out['material_type'] = out.get('material_type') or out.get('type') or 'daily_devotional'
    out['type'] = out['material_type']
    out['language'] = out.get('language') or 'en'
    out['status'] = effective_status(out)
    out['material_type_label'] = MATERIAL_TYPE_LABELS.get(out['material_type'], out['material_type'])
    out.setdefault('view_count', 0)
    out.setdefault('download_count', 0)
    out.setdefault('featured', False)
    out.setdefault('all_languages', False)
    out.setdefault('visibility', 'public')
    return out


def pick_language_version(materials: Iterable[dict], material_id: str, preferred_lang: str) -> dict | None:
    items = [normalize_material_row(m) for m in materials]
    base = next((m for m in items if str(m.get('id')) == str(material_id)), None)
    if not base:
        return None

    family_id = base.get('parent_id') or base.get('id')
    family = [m for m in items if str(m.get('id')) == str(family_id) or str(m.get('parent_id')) == str(family_id)]
    if base.get('all_languages'):
        return base

    for lang in [preferred_lang, 'en']:
        match = next((m for m in family if (m.get('language') or 'en') == lang and effective_status(m) == 'published'), None)
        if match:
            return match
    return base if effective_status(base) == 'published' else None


def build_dashboard_stats(materials: list[dict]) -> dict:
    now = datetime.utcnow()
    today = now.date()
    tomorrow = today + timedelta(days=1)

    normalized = [normalize_material_row(m) for m in materials]
    published = [m for m in normalized if m.get('status') == 'published']
    drafts = [m for m in normalized if (m.get('status') or 'draft') == 'draft']
    scheduled = [m for m in normalized if (m.get('status') or '') == 'scheduled']

    def publish_date(m):
        dt = _parse_dt(m.get('publish_at'))
        return dt.date() if dt else None

    today_material = next(
        (m for m in published if publish_date(m) == today and m.get('material_type') in ('daily_christ_bite', 'daily_devotional')),
        None,
    )
    tomorrow_material = next(
        (m for m in scheduled if publish_date(m) == tomorrow),
        None,
    )

    most_viewed = max(published, key=lambda m: int(m.get('view_count') or 0), default=None)
    most_downloaded = max(published, key=lambda m: int(m.get('download_count') or 0), default=None)
    awaiting_translation = [
        m for m in normalized
        if not m.get('all_languages') and not m.get('parent_id') and m.get('status') == 'published'
    ]

    return {
        'today_material': today_material,
        'tomorrow_material': tomorrow_material,
        'draft_count': len(drafts),
        'published_count': len(published),
        'scheduled_count': len(scheduled),
        'awaiting_translation_count': len(awaiting_translation),
        'most_viewed': most_viewed,
        'most_downloaded': most_downloaded,
    }


def seed_materials() -> list[dict]:
    now = datetime.utcnow()
    today_publish = now.replace(hour=6, minute=0, second=0, microsecond=0).isoformat() + 'Z'
    tomorrow_publish = (now + timedelta(days=1)).replace(hour=6, minute=0, second=0, microsecond=0).isoformat() + 'Z'

    return [
        {
            'id': 'spirit-001',
            'title': 'Understanding the Power of Prayer',
            'material_type': 'daily_christ_bite',
            'description': 'A short daily bite on building a consistent prayer life.',
            'content': (
                'Prayer is not merely religious duty — it is communion with the Father. '
                'When we pray, heaven responds. Today, set aside time to speak with God, '
                'listen for His voice, and declare His promises over your life.\n\n'
                'Key Scripture: James 5:16 — The prayer of a righteous person is powerful and effective.'
            ),
            'file_url': '',
            'video_url': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            'audio_url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            'thumbnail_url': 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=640&h=360&fit=crop',
            'language': 'en',
            'parent_id': None,
            'all_languages': False,
            'category': 'Prayer',
            'ministry': 'Daily Christ Bites',
            'speaker': 'Apostle John Mwangi',
            'bible_reference': 'James 5:16',
            'status': 'published',
            'publish_at': today_publish,
            'available_until': None,
            'featured': True,
            'visibility': 'public',
            'view_count': 1248,
            'download_count': 312,
            'created_at': today_publish,
            'updated_at': today_publish,
        },
        {
            'id': 'spirit-001-sw',
            'title': 'Kuelewa Nguvu ya Maombi',
            'material_type': 'daily_christ_bite',
            'description': 'Kipande cha kila siku kuhusu maisha ya maombi.',
            'content': 'Maombi si ibada tu — ni ushirika na Baba. Leo, weka muda wa kuzungumza na Mungu.',
            'file_url': '',
            'video_url': '',
            'audio_url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            'thumbnail_url': 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=640&h=360&fit=crop',
            'language': 'sw',
            'parent_id': 'spirit-001',
            'all_languages': False,
            'category': 'Prayer',
            'ministry': 'Daily Christ Bites',
            'speaker': 'Apostle John Mwangi',
            'bible_reference': 'Yakobo 5:16',
            'status': 'published',
            'publish_at': today_publish,
            'available_until': None,
            'featured': False,
            'visibility': 'public',
            'view_count': 420,
            'download_count': 88,
            'created_at': today_publish,
            'updated_at': today_publish,
        },
        {
            'id': 'spirit-002',
            'title': 'Discipleship Course 1: Foundations of Faith',
            'material_type': 'course',
            'description': 'Structured discipleship programme with lessons, videos, and progress tracking.',
            'content': 'Lesson 1: Salvation and New Birth\nLesson 2: The Word and Prayer\nLesson 3: The Holy Spirit',
            'file_url': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            'video_url': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            'audio_url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
            'thumbnail_url': 'https://images.unsplash.com/photo-1507692042200-27a99c57e4a2?w=640&h=360&fit=crop',
            'language': 'en',
            'parent_id': None,
            'all_languages': True,
            'category': 'Discipleship',
            'ministry': 'Radah Schools',
            'speaker': 'Pastor Grace Kimani',
            'bible_reference': 'Ephesians 2:8-9',
            'status': 'published',
            'publish_at': today_publish,
            'available_until': None,
            'featured': True,
            'visibility': 'members',
            'view_count': 890,
            'download_count': 540,
            'created_at': today_publish,
            'updated_at': today_publish,
        },
        {
            'id': 'spirit-003',
            'title': 'Faith & Prayer Bible Study',
            'material_type': 'bible_study',
            'description': 'Week 4 Bible study guide on faith and prayer.',
            'content': 'Discussion questions and scripture references for cell groups.',
            'file_url': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            'video_url': '',
            'audio_url': '',
            'thumbnail_url': 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=640&h=360&fit=crop',
            'language': 'en',
            'parent_id': None,
            'all_languages': False,
            'category': 'Faith',
            'ministry': 'CRM Media House',
            'speaker': 'Prophet David Ochieng',
            'bible_reference': 'Hebrews 11:1',
            'status': 'published',
            'publish_at': today_publish,
            'available_until': None,
            'featured': False,
            'visibility': 'public',
            'view_count': 650,
            'download_count': 210,
            'created_at': today_publish,
            'updated_at': today_publish,
        },
        {
            'id': 'spirit-004',
            'title': 'Tomorrow\'s Daily Christ Bite',
            'material_type': 'daily_christ_bite',
            'description': 'Scheduled devotional for tomorrow morning.',
            'content': 'Draft content — publishing automatically at 06:00.',
            'file_url': '',
            'video_url': '',
            'audio_url': '',
            'thumbnail_url': 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=640&h=360&fit=crop',
            'language': 'en',
            'parent_id': None,
            'all_languages': False,
            'category': 'Christian Living',
            'ministry': 'Daily Christ Bites',
            'speaker': 'Apostle John Mwangi',
            'bible_reference': 'Psalm 119:105',
            'status': 'scheduled',
            'publish_at': tomorrow_publish,
            'available_until': None,
            'featured': False,
            'visibility': 'public',
            'view_count': 0,
            'download_count': 0,
            'created_at': today_publish,
            'updated_at': today_publish,
        },
    ]
