import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ReactPlayer from 'react-player'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Eye, Heart, Share2, Clock, User } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Footer from '../components/common/Footer'
import ReactionBar from '../components/common/ReactionBar'
import { usePlayer } from '../context/PlayerContext'

export default function MediaWatch() {
  const { mediaId } = useParams()
  const navigate = useNavigate()
  const { playTrack } = usePlayer()
  const [media, setMedia] = useState(null)
  const [reactions, setReactions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    fetchMedia()
  }, [mediaId])

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/media/${mediaId}`)
      setMedia(res.data.media)
      setReactions(res.data.reactions || null)
    } catch (err) {
      console.error(err)
      toast.error('Media not found')
      navigate('/media')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds = 0) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-crm-purple/30 border-t-crm-purple rounded-full animate-spin" />
      </div>
    )
  }

  if (!media) return null

  const videoUrl = media.video_url || media.url || media.stream_url

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/media" className="inline-flex items-center gap-2 text-crm-gray-light hover:text-crm-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Media Library
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 mb-6">
            {videoUrl ? (
              <ReactPlayer
                url={videoUrl}
                playing={playing}
                controls
                width="100%"
                height="100%"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                config={{
                  file: {
                    attributes: { controlsList: 'nodownload' },
                    forceHLS: String(videoUrl).includes('.m3u8'),
                  },
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-crm-gray">
                No playable video URL
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-crm-white mb-3">{media.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-crm-gray mb-6">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{media.speaker || 'CRM'}</span>
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{(media.view_count || 0).toLocaleString()} views</span>
                <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" />{(media.like_count || 0).toLocaleString()} amens</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDuration(media.duration || media.duration_seconds || 0)}</span>
                {media.bible_reference && <span className="text-crm-purple">{media.bible_reference}</span>}
              </div>

              <ReactionBar
                contentId={mediaId}
                contentType="media"
                initialCounts={reactions}
              />

              {media.description && (
                <p className="text-crm-gray-light leading-relaxed mb-6 mt-6">{media.description}</p>
              )}
              {media.topics?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {media.topics.map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full bg-crm-purple/10 text-crm-purple text-xs border border-crm-purple/20">{t}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:w-64 flex flex-col gap-3">
              {media.audio_url && (
                <button
                  onClick={() => playTrack(media)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-crm-white transition-all"
                >
                  <Play className="w-4 h-4" /> Play Audio
                </button>
              )}
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied') }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-crm-white transition-all"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              {media.series_id && (
                <Link
                  to={`/series/${media.series_id}`}
                  className="text-center px-4 py-3 rounded-xl bg-crm-purple/10 border border-crm-purple/20 text-crm-purple hover:bg-crm-purple/20 transition-all"
                >
                  View Series
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <div className="mt-16">
        <Footer />
      </div>
    </div>
  )
}
