import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

const EMPTY = {
  members: 0,
  countries: 0,
  souls: 0,
  souls_reached: 0,
  live_now: 0,
  live_viewers: 0,
  watching_now: 0,
  online_now: 0,
  streams: 0,
  media: 0,
  media_views: 0,
  reactions: 0,
  prayers: 0,
  giving_total: 0,
  giving_count: 0,
}

/**
 * Subscribe to realtime platform stats via REST poll + Socket.IO.
 */
export default function useLiveStats({ pollMs = 15000 } = {}) {
  const [stats, setStats] = useState(EMPTY)

  const apply = useCallback((data) => {
    if (!data || typeof data !== 'object') return
    setStats((prev) => ({
      ...prev,
      ...data,
      souls: data.souls ?? data.souls_reached ?? prev.souls,
    }))
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await axios.get('/api/stats/live')
      apply(res.data)
    } catch (err) {
      console.error('Live stats fetch failed:', err)
    }
  }, [apply])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, pollMs)

    const socket = io('', { transports: ['websocket', 'polling'] })
    socket.on('platform_stats_updated', apply)
    socket.on('connect', () => {
      // Server sends snapshot on connect; also refresh REST as fallback
      refresh()
    })

    return () => {
      clearInterval(interval)
      socket.off('platform_stats_updated', apply)
      socket.disconnect()
    }
  }, [refresh, apply, pollMs])

  return { stats, refresh }
}
