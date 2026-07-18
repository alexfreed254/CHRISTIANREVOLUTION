"""In-memory reaction counters for streams and media (sermon reactions)."""

from __future__ import annotations

from copy import deepcopy

REACTION_TYPES = ('amen', 'praise', 'love', 'fire', 'hallelujah', 'glory')

EMOJI_MAP = {
    'amen': '🙏',
    'praise': '🙌',
    'love': '❤️',
    'fire': '🔥',
    'hallelujah': '✨',
    'glory': '👑',
    # legacy aliases
    'like': '👍',
    'pray': '🙏',
}

# Realistic baseline counts for seed content (looks like an active service)
DEFAULT_SEED_COUNTS = {
    'stream-001': {
        'amen': 3842,
        'praise': 2156,
        'love': 1690,
        'fire': 982,
        'hallelujah': 1475,
        'glory': 734,
    },
    'stream-002': {
        'amen': 120,
        'praise': 85,
        'love': 64,
        'fire': 41,
        'hallelujah': 52,
        'glory': 28,
    },
    'media-001': {'amen': 4120, 'praise': 2380, 'love': 1890, 'fire': 1120, 'hallelujah': 1650, 'glory': 890},
    'media-002': {'amen': 2680, 'praise': 1540, 'love': 1210, 'fire': 720, 'hallelujah': 980, 'glory': 540},
    'media-003': {'amen': 6210, 'praise': 3890, 'love': 2780, 'fire': 1980, 'hallelujah': 2450, 'glory': 1320},
    'media-004': {'amen': 3560, 'praise': 2100, 'love': 1680, 'fire': 940, 'hallelujah': 1420, 'glory': 710},
    'media-005': {'amen': 1890, 'praise': 1120, 'love': 860, 'fire': 480, 'hallelujah': 720, 'glory': 390},
    'media-006': {'amen': 4780, 'praise': 2920, 'love': 2310, 'fire': 1450, 'hallelujah': 1880, 'glory': 980},
    'media-007': {'amen': 3020, 'praise': 1780, 'love': 1420, 'fire': 810, 'hallelujah': 1190, 'glory': 620},
    'media-008': {'amen': 3950, 'praise': 2410, 'love': 1860, 'fire': 1280, 'hallelujah': 1560, 'glory': 840},
}

# content_key -> counts dict  (key = "stream:id" or "media:id")
_COUNTS: dict[str, dict[str, int]] = {}


def _key(content_type: str, content_id: str) -> str:
    return f"{content_type}:{content_id}"


def _blank() -> dict[str, int]:
    return {t: 0 for t in REACTION_TYPES}


def get_counts(content_type: str, content_id: str) -> dict[str, int]:
    key = _key(content_type, content_id)
    if key not in _COUNTS:
        seed = DEFAULT_SEED_COUNTS.get(str(content_id))
        if seed:
            _COUNTS[key] = {t: int(seed.get(t, 0)) for t in REACTION_TYPES}
        else:
            # Fresh content: small natural baselines so UI isn't all zeros
            _COUNTS[key] = {
                'amen': 12,
                'praise': 8,
                'love': 6,
                'fire': 4,
                'hallelujah': 5,
                'glory': 3,
            }
    return deepcopy(_COUNTS[key])


def normalize_type(reaction_type: str) -> str:
    t = (reaction_type or 'amen').lower().strip()
    aliases = {'like': 'amen', 'pray': 'amen', 'heart': 'love'}
    t = aliases.get(t, t)
    if t not in REACTION_TYPES:
        t = 'amen'
    return t


def add_reaction(content_type: str, content_id: str, reaction_type: str) -> dict[str, int]:
    t = normalize_type(reaction_type)
    counts = get_counts(content_type, content_id)
    counts[t] = counts.get(t, 0) + 1
    _COUNTS[_key(content_type, content_id)] = counts
    return deepcopy(counts)


def total_reactions(content_type: str, content_id: str) -> int:
    return sum(get_counts(content_type, content_id).values())


def global_reaction_total() -> int:
    """Sum all reaction counters (touched + untouched seed baselines)."""
    total = 0
    touched_ids = set()
    for key, counts in _COUNTS.items():
        total += sum(int(v or 0) for v in counts.values())
        if ":" in key:
            touched_ids.add(key.split(":", 1)[1])
    for content_id, seed in DEFAULT_SEED_COUNTS.items():
        if content_id not in touched_ids:
            total += sum(int(v or 0) for v in seed.values())
    return total
