import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Globe, Heart, HandHeart, Flame, ThumbsUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function LiveChat({ streamId, socket, comments: initialComments, isOpen, onClose }) {
  const [comments, setComments] = useState(initialComments || [])
  const [newComment, setNewComment] = useState('')
  const [filter, setFilter] = useState('all')
  const [floatingReactions, setFloatingReactions] = useState([])
  const chatEndRef = useRef(null)

  const reactions = [
    { type: 'like', icon: ThumbsUp, label: '👍', color: '#3b82f6' },
    { type: 'love', icon: Heart, label: '❤️', color: '#ef4444' },
    { type: 'pray', icon: HandHeart, label: '🙏', color: '#22c55e' },
    { type: 'fire', icon: Flame, label: '🔥', color: '#f97316' },
  ]

  useEffect(() => { setComments(initialComments || []) }, [initialComments])

  useEffect(() => {
    if (socket) {
      socket.on('new_comment', (comment) => { setComments(prev => [...prev, comment]) })
      socket.on('reaction', (data) => { addFloatingReaction(data.type) })
    }
    return () => {
      if (socket) { socket.off('new_comment'); socket.off('reaction') }
    }
  }, [socket])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [comments])

  const addFloatingReaction = (type) => {
    const id = Date.now()
    const reaction = reactions.find(r => r.type === type) || reactions[0]
    setFloatingReactions(prev => [...prev, { id, ...reaction }])
    setTimeout(() => { setFloatingReactions(prev => prev.filter(r => r.id !== id)) }, 3000)
  }

  const handleSendComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const comment = {
      id: `local-${Date.now()}`, stream_id: streamId, member_name: 'You', member_location: 'Your Location',
      content: newComment, language: 'en', is_prayer_request: newComment.includes('🙏') || newComment.toLowerCase().includes('pray'),
      created_at: new Date().toISOString(),
    }
    setComments(prev => [...prev, comment])
    if (socket) { socket.emit('post_comment', { stream_id: streamId, content: newComment, member_name: 'You', member_location: 'Your Location' }) }
    setNewComment('')
  }

  const handleReaction = (type) => {
    addFloatingReaction(type)
    if (socket) { socket.emit('stream_reaction', { stream_id: streamId, type }) }
  }

  const filteredComments = comments.filter(c => {
    if (filter === 'all') return true
    if (filter === 'prayers') return c.is_prayer_request
    return true
  })

  return (
    <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-full lg:w-96 bg-crm-dark border-l border-white/10 flex flex-col h-full">

      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-crm-purple" />
          <h3 className="font-bold text-sm">LIVE CHAT</h3>
          <span className="text-xs text-crm-gray-light">({comments.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-crm-gray-light focus:outline-none focus:border-crm-purple">
            <option value="all">All</option><option value="prayers">Prayers</option>
          </select>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-white/5 rounded">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredComments.map((comment, index) => (
          <motion.div key={comment.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className={`group ${comment.is_prayer_request ? 'bg-crm-purple/5 border border-crm-purple/20 rounded-lg p-3' : ''}`}>
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-crm-purple to-crm-purple-light flex items-center justify-center text-crm-black text-xs font-bold flex-shrink-0">
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
            <motion.div key={reaction.id} initial={{ opacity: 1, y: 0, x: Math.random() * 200 }}
              animate={{ opacity: 0, y: -300 }} exit={{ opacity: 0 }} transition={{ duration: 3, ease: 'easeOut' }}
              className="absolute bottom-20 text-2xl" style={{ left: `${Math.random() * 80}%` }}>
              {reaction.label}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="px-4 py-2 border-t border-white/10">
        <div className="flex items-center justify-center gap-2">
          {reactions.map((reaction) => (
            <motion.button key={reaction.type} whileTap={{ scale: 0.9 }} onClick={() => handleReaction(reaction.type)}
              className="p-2 rounded-full hover:bg-white/10 transition-all text-lg" title={reaction.label}>
              {reaction.label}
            </motion.button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSendComment} className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input ref={chatEndRef} type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple transition-all" />
          </div>
          <motion.button whileTap={{ scale: 0.95 }} type="submit" disabled={!newComment.trim()}
            className="p-2.5 rounded-xl bg-crm-purple text-crm-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-crm-purple-light transition-all">
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
        <p className="text-[10px] text-crm-gray mt-2 text-center">Be respectful. Messages are moderated. 🙏</p>
      </form>
    </motion.div>
  )
}
