import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Globe } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import ReactionBar, { SERMON_REACTIONS } from '../common/ReactionBar'

export default function LiveChat({ streamId, socket, comments: initialComments, isOpen, onClose, initialReactions }) {
  const [comments, setComments] = useState(initialComments || [])
  const [newComment, setNewComment] = useState('')
  const [filter, setFilter] = useState('all')
  const [floatingReactions, setFloatingReactions] = useState([])
  const chatEndRef = useRef(null)

  useEffect(() => { setComments(initialComments || []) }, [initialComments])

  useEffect(() => {
    if (socket) {
      socket.on('new_comment', (comment) => { setComments(prev => [...prev, comment]) })
      socket.on('reaction', (data) => {
        const match = SERMON_REACTIONS.find(r => r.type === data.type)
        addFloatingReaction(match?.emoji || data.emoji || '🙏')
      })
    }
    return () => {
      if (socket) { socket.off('new_comment'); socket.off('reaction') }
    }
  }, [socket])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments])

  const addFloatingReaction = (emoji) => {
    const id = Date.now() + Math.random()
    setFloatingReactions(prev => [...prev, { id, emoji }])
    setTimeout(() => { setFloatingReactions(prev => prev.filter(r => r.id !== id)) }, 3000)
  }

  const handleSendComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const comment = {
      id: `local-${Date.now()}`, stream_id: streamId, member_name: 'You', member_location: 'Watching live',
      content: newComment, language: 'en', is_prayer_request: newComment.includes('🙏') || newComment.toLowerCase().includes('pray'),
      created_at: new Date().toISOString(),
    }
    setComments(prev => [...prev, comment])
    if (socket) { socket.emit('post_comment', { stream_id: streamId, content: newComment, member_name: 'You', member_location: 'Watching live' }) }
    setNewComment('')
  }

  const filteredComments = comments.filter(c => {
    if (filter === 'all') return true
    if (filter === 'prayers') return c.is_prayer_request
    return true
  })

  return (
    <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-full lg:w-96 bg-crm-dark border border-slate-200 rounded-2xl flex flex-col h-[70vh] lg:h-[calc(100vh-8rem)] relative overflow-hidden">

      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-crm-purple" />
          <h3 className="font-bold text-sm">LIVE CHAT</h3>
          <span className="text-xs text-crm-gray-light">({comments.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-crm-gray-light focus:outline-none focus:border-crm-purple">
            <option value="all">All</option><option value="prayers">Prayers</option>
          </select>
          {onClose && <button onClick={onClose} className="lg:hidden p-1 hover:bg-slate-100 rounded">✕</button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredComments.map((comment, index) => (
          <motion.div key={comment.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className={`group ${comment.is_prayer_request ? 'bg-crm-purple/5 border border-crm-purple/20 rounded-lg p-3' : ''}`}>
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-crm-purple to-crm-purple-light flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {comment.member_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-crm-white">{comment.member_name}</span>
                  <span className="text-[10px] text-crm-gray">{comment.member_location}</span>
                  {comment.is_prayer_request && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-crm-purple/20 text-crm-purple">🙏 Prayer</span>}
                </div>
                <p className="text-sm text-crm-gray-light mt-0.5 break-words">{comment.content}</p>
                <span className="text-[10px] text-crm-gray mt-1 block">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((reaction) => (
            <motion.div key={reaction.id} initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -280 }} exit={{ opacity: 0 }} transition={{ duration: 3, ease: 'easeOut' }}
              className="absolute bottom-36 text-2xl" style={{ left: `${12 + Math.random() * 70}%` }}>
              {reaction.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="px-3 py-3 border-t border-slate-200 bg-white/95">
        <ReactionBar
          contentId={streamId}
          contentType="stream"
          socket={socket}
          initialCounts={initialReactions}
          compact
        />
      </div>

      <form onSubmit={handleSendComment} className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
              placeholder="Say Amen, share a testimony..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple transition-all" />
          </div>
          <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={!newComment.trim()}
            className="p-2.5 rounded-xl bg-crm-purple text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-crm-purple-light transition-all">
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
        <p className="text-[10px] text-crm-gray mt-2 text-center">Be respectful. Messages are moderated. 🙏</p>
      </form>
    </motion.div>
  )
}
