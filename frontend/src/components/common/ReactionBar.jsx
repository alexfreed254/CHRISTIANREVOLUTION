import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

/** Sermon-style reactions with emoji + count display */
export const SERMON_REACTIONS = [
  { type: 'amen', label: 'Amen', emoji: '🙏', color: '#8B7FC7' },
  { type: 'praise', label: 'Praise', emoji: '🙌', color: '#B8B0E3' },
  { type: 'love', label: 'Love', emoji: '❤️', color: '#ef4444' },
  { type: 'fire', label: 'Fire', emoji: '🔥', color: '#f97316' },
  { type: 'hallelujah', label: 'Hallelujah', emoji: '✨', color: '#eab308' },
  { type: 'glory', label: 'Glory', emoji: '👑', color: '#22c55e' },
]

const EMPTY_COUNTS = Object.fromEntries(SERMON_REACTIONS.map((r) => [r.type, 0]))

function formatCount(n) {
  const num = Number(n) || 0
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

/**
 * Clickable sermon reaction bar.
 * contentType: 'stream' | 'media'
 */
export default function ReactionBar({
  contentId,
  contentType = 'stream',
  initialCounts = null,
  socket = null,
  compact = false,
}) {
  const [counts, setCounts] = useState({ ...EMPTY_COUNTS, ...(initialCounts || {}) })
  const [floating, setFloating] = useState([])
  const [myClicks, setMyClicks] = useState({})

  useEffect(() => {
    if (initialCounts) setCounts((prev) => ({ ...prev, ...initialCounts }))
  }, [initialCounts])

  useEffect(() => {
    if (!contentId) return
    axios
      .get(`/api/reactions/${contentType}/${contentId}`)
      .then((res) => {
        if (res.data?.counts) setCounts((prev) => ({ ...prev, ...res.data.counts }))
      })
      .catch(() => {})
  }, [contentId, contentType])

  const spawnFloat = useCallback((emoji) => {
    const id = `${Date.now()}-${Math.random()}`
    setFloating((prev) => [...prev, { id, emoji, x: 10 + Math.random() * 80 }])
    setTimeout(() => {
      setFloating((prev) => prev.filter((f) => f.id !== id))
    }, 2200)
  }, [])

  useEffect(() => {
    if (!socket) return
    const onUpdate = (data) => {
      if (String(data.content_id) !== String(contentId)) return
      if (data.counts) setCounts((prev) => ({ ...prev, ...data.counts }))
      if (data.emoji) spawnFloat(data.emoji)
    }
    const onReaction = (data) => {
      if (String(data.stream_id || data.content_id) !== String(contentId)) return
      if (data.counts) setCounts((prev) => ({ ...prev, ...data.counts }))
      const match = SERMON_REACTIONS.find((r) => r.type === data.type)
      spawnFloat(match?.emoji || data.emoji || '🙏')
    }
    socket.on('reaction_counts_updated', onUpdate)
    socket.on('reaction', onReaction)
    return () => {
      socket.off('reaction_counts_updated', onUpdate)
      socket.off('reaction', onReaction)
    }
  }, [socket, contentId, spawnFloat])

  const handleReact = async (type, emoji) => {
    // Optimistic bump
    setCounts((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }))
    setMyClicks((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }))
    spawnFloat(emoji)

    if (socket && contentType === 'stream') {
      socket.emit('stream_reaction', { stream_id: contentId, type, content_type: contentType })
    }

    try {
      const res = await axios.post(`/api/reactions/${contentType}/${contentId}`, { type })
      if (res.data?.counts) setCounts((prev) => ({ ...prev, ...res.data.counts }))
    } catch {
      // keep optimistic count for demo feel
    }
  }

  return (
    <div className={`relative ${compact ? '' : 'mt-4'}`}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden h-0">
        <AnimatePresence>
          {floating.map((f) => (
            <motion.span
              key={f.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -120, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="fixed bottom-32 text-3xl z-50"
              style={{ left: `${f.x}%` }}
            >
              {f.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <p className="text-xs text-crm-gray mb-2 uppercase tracking-wider">Congregation reactions</p>
      <div className="flex flex-wrap gap-2">
        {SERMON_REACTIONS.map((r) => {
          const count = counts[r.type] || 0
          const mine = myClicks[r.type] || 0
          return (
            <motion.button
              key={r.type}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => handleReact(r.type, r.emoji)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                mine > 0
                  ? 'bg-crm-purple/20 border-crm-purple/40 text-crm-white'
                  : 'bg-white/5 border-white/10 text-crm-gray-light hover:bg-white/10 hover:text-crm-white'
              }`}
              title={r.label}
            >
              <span className="text-lg leading-none">{r.emoji}</span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: mine > 0 ? r.color : undefined }}>
                {formatCount(count)}
              </span>
              {!compact && <span className="text-[10px] text-crm-gray hidden sm:inline">{r.label}</span>}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
