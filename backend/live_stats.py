"""Compute and broadcast live platform statistics."""

from __future__ import annotations

from datetime import datetime
from typing import Any


def build_live_stats(
    *,
    supabase,
    db_ready: bool,
    try_supabase,
    STREAM_STORE: list,
    MEDIA_STORE: list,
    reaction_store,
    connected_clients: int = 0,
) -> dict[str, Any]:
    """Assemble a realtime stats snapshot from DB + in-memory stores."""

    members_count = 0
    countries: set[str] = set()
    giving_total = 0.0
    giving_count = 0
    prayers_count = 0

    if db_ready and supabase is not None:
        members = try_supabase(
            lambda: supabase.table("members").select("id,country", count="exact").execute(),
            None,
        )
        if members:
            if getattr(members, "count", None) is not None:
                members_count = int(members.count or 0)
            elif members.data is not None:
                members_count = len(members.data)
            for row in members.data or []:
                if row.get("country"):
                    countries.add(str(row["country"]))

        giving = try_supabase(
            lambda: supabase.table("giving").select("amount").execute(),
            None,
        )
        if giving and giving.data:
            giving_count = len(giving.data)
            giving_total = sum(float(g.get("amount") or 0) for g in giving.data)

        prayers = try_supabase(
            lambda: supabase.table("prayer_requests").select("id", count="exact").execute(),
            None,
        )
        if prayers:
            if getattr(prayers, "count", None) is not None:
                prayers_count = int(prayers.count or 0)
            elif prayers.data is not None:
                prayers_count = len(prayers.data)

    live_streams = [s for s in STREAM_STORE if s.get("status") == "live"]
    live_viewers = sum(int(s.get("viewer_count") or 0) for s in live_streams)
    total_likes = sum(int(s.get("like_count") or 0) for s in STREAM_STORE)
    media_views = sum(int(m.get("view_count") or 0) for m in MEDIA_STORE)
    media_likes = sum(int(m.get("like_count") or 0) for m in MEDIA_STORE)

    try:
        reaction_total = int(reaction_store.global_reaction_total())
    except Exception:
        reaction_total = total_likes + media_likes

    # Souls reached = real activity signals (views + reactions + members + live audience)
    souls_reached = media_views + reaction_total + members_count + live_viewers

    return {
        "members": members_count,
        "countries": len(countries),
        "country_list": sorted(countries)[:50],
        "souls_reached": souls_reached,
        "souls": souls_reached,  # alias for home page
        "live_now": len(live_streams),
        "live_viewers": live_viewers,
        "watching_now": live_viewers + max(0, connected_clients),
        "online_now": connected_clients,
        "streams": len(STREAM_STORE),
        "media": len(MEDIA_STORE),
        "media_views": media_views,
        "reactions": reaction_total,
        "likes": total_likes + media_likes,
        "prayers": prayers_count,
        "giving_total": round(giving_total, 2),
        "giving_count": giving_count,
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }


def emit_platform_stats(socketio, stats: dict) -> None:
    if socketio is None:
        return
    try:
        socketio.emit("platform_stats_updated", stats)
    except Exception as exc:
        print(f"platform stats emit failed: {exc}")
