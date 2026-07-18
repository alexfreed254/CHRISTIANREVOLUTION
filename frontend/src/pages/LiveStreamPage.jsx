import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Heart, Share2, Globe, Send } from 'lucide-react'
import axios from 'axios'
import ReactPlayer from 'react-player'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import GlassCard from '../components/common/GlassCard'
import LiveBadge from '../components/common/LiveBadge'
import LiveChat from '../components/chat/LiveChat'
import Footer from '../components/common/Footer'

export default function LiveStreamPage() {
  const { streamId } = useParams()
  const [stream, setStream] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewerCount, setViewerCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const { user, token } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    fetchStream()
    
    // Connect to Socket.IO for real-time updates
    const socket = io('', { query: { streamId } })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to stream')
      socket.emit('join_stream', { stream_id: streamId })
    })

    socket.on('new_comment', (comment) => {
      setComments(prev => [comment, ...prev])
    })

    socket.on('viewer_update', (data) => {
      setViewerCount(data.viewer_count)
    })

    socket.on('like_update', (data) => {
      setStream(prev => prev ? { ...prev, like_count: data.like_count } : null)
    })

    return () => {
      socket.emit('leave_stream', { stream_id: streamId })
      socket.disconnect()
    }
  }, [streamId])

  const fetchStream = async () => {
    try {
      const res = await axios.get(`/api/live/streams/${streamId}`)
      setStream(res.data.stream)
      setComments(res.data.comments || [])
      setViewerCount(res.data.stream.viewer_count || 0)
    } catch (err) {
      console.error('Failed to fetch stream:', err)
      toast.error('Failed to load stream')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like')
      return
    }

    try {
      await axios.post(`/api/live/streams/${streamId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLiked(!liked)
      setStream(prev => ({
        ...prev,
        like_count: liked ? prev.like_count - 1 : prev.like_count + 1
      }))
    } catch (err) {
      console.error('Like error:', err)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: stream?.title,
        text: `Watch "${stream?.title}" live on CRM`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-crm-purple/30 border-t-crm-purple rounded-full animate-spin" />
      </div>
    )
  }

  if (!stream) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-crm-white mb-2">Stream Not Found</h2>
          <p className="text-crm-gray">This stream may have ended or does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <GlassCard className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                <ReactPlayer
                  url={stream.stream_url}
                  playing={true}
                  controls={true}
                  width="100%"
                  height="100%"
                  config={{
                    file: {
                      attributes: {
                        controlsList: 'nodownload'
                      }
                    }
                  }}
                />
                {stream.status === 'live' && (
                  <div className="absolute top-4 left-4">
                    <LiveBadge size="lg" />
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Stream Info */}
            <GlassCard className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-crm-white mb-2">{stream.title}</h1>
                  <p className="text-crm-purple font-medium mb-2">{stream.speaker}</p>
                  {stream.bible_reference && (
                    <p className="text-sm text-crm-gray-light mb-3">📖 {stream.bible_reference}</p>
                  )}
                </div>
              </div>

              <p className="text-crm-gray-light mb-4">{stream.description}</p>

              {/* Topics */}
              {stream.topics && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {stream.topics.map(topic => (
                    <span 
                      key={topic}
                      className="px-3 py-1 text-xs rounded-full bg-crm-purple/10 text-crm-purple border border-crm-purple/20"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats & Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-crm-gray">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">{viewerCount.toLocaleString()}</span>
                  <span className="text-sm">watching</span>
                </div>

                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    liked 
                      ? 'bg-crm-live/20 text-crm-live' 
                      : 'bg-white/5 text-crm-gray hover:bg-white/10 hover:text-crm-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  <span className="font-medium">{stream.like_count?.toLocaleString()}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-crm-gray hover:bg-white/10 hover:text-crm-white transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>

                {stream.available_languages && (
                  <div className="flex items-center gap-2 ml-auto text-crm-gray">
                    <Globe className="w-5 h-5" />
                    <span className="text-sm">
                      {stream.available_languages.join(', ').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Live Chat Sidebar */}
          <div className="lg:col-span-1">
            <LiveChat 
              streamId={streamId}
              comments={comments}
              socket={socketRef.current}
            />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
