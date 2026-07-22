import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ReactPlayer from 'react-player'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Eye, Share2, Clock, User, Maximize2, Minimize2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Footer from '../components/common/Footer'
import ReactionBar from '../components/common/ReactionBar'
import VideoCard from '../components/media/VideoCard'
import LanguageSelector from '../components/common/LanguageSelector'
import { usePlayer } from '../context/PlayerContext'
import { useLanguage } from '../context/LanguageContext'

export default function MediaWatch() {
  const { mediaId } = useParams()
  const navigate = useNavigate()
  const { playTrack } = usePlayer()
  const { language, t, aiTranslation } = useLanguage()
  const [media, setMedia] = useState(null)
  const [related, setRelated] = useState([])
  const [reactions, setReactions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [theater, setTheater] = useState(false)

  useEffect(() => {
    fetchMedia()
  }, [mediaId, language])

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const langParam = language !== 'en' ? { lang: language } : {}
      const res = await axios.get(`/api/media/${mediaId}`, { params: langParam })
      setMedia(res.data.media)
      setReactions(res.data.reactions || null)
      const lib = await axios.get('/api/media/library', {
        params: { per_page: 6, sort: 'most_viewed', speaker: res.data.media?.speaker || undefined, ...langParam },
      })
      const items = (lib.data.media || []).filter((m) => String(m.id) !== String(mediaId)).slice(0, 4)
      setRelated(items)
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
      <div className="min-h-screen pt-28 px-4 max-w-6xl mx-auto">
        <div className="aspect-video rounded-2xl bg-white/5 animate-pulse mb-6" />
        <div className="h-8 bg-white/5 rounded w-2/3 animate-pulse mb-4" />
        <div className="h-4 bg-white/5 rounded w-1/3 animate-pulse" />
      </div>
    )
  }

  if (!media) return null

  const videoUrl = media.video_url || media.url || media.stream_url

  return (
    <div className={`min-h-screen pt-20 pb-12 ${theater ? 'bg-black' : ''}`}>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${theater ? 'max-w-[1600px]' : 'max-w-6xl'}`}>
        {!theater && (
          <Link to="/media" className="inline-flex items-center gap-2 text-crm-gray-light hover:text-crm-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('media.library')}
          </Link>
        )}

        <div className="flex justify-end mb-3">
          <LanguageSelector compact />
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className={`relative overflow-hidden bg-black mb-6 group ${theater ? 'rounded-none lg:rounded-2xl' : 'rounded-2xl border border-white/10 aspect-video'}`}>
            {videoUrl ? (
              <ReactPlayer
                url={videoUrl}
                playing={playing}
                controls
                width="100%"
                height="100%"
                className="absolute inset-0"
                style={{ position: 'absolute', top: 0, left: 0 }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                config={{
                  file: {
                    attributes: { controlsList: 'nodownload', playsInline: true },
                    forceHLS: String(videoUrl).includes('.m3u8'),
                  },
                }}
              />
            ) : (
              <div className="aspect-video flex items-center justify-center text-crm-gray">No playable video URL</div>
            )}
            <button
              type="button"
              onClick={() => setTheater(!theater)}
              className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title={theater ? 'Exit theater mode' : 'Theater mode'}
            >
              {theater ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-crm-white mb-3 leading-tight">{media.title}</h1>
              {media._ai_translated && aiTranslation && (
                <p className="text-xs text-crm-purple mb-2">{t('common.aiTranslated')}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-crm-gray mb-6">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{media.speaker || 'CRM'}</span>
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{(media.view_count || 0).toLocaleString()} views</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDuration(media.duration || media.duration_seconds || 0)}</span>
                {media.bible_reference && <span className="text-crm-purple font-medium">{media.bible_reference}</span>}
              </div>

              <ReactionBar contentId={mediaId} contentType="media" initialCounts={reactions} />

              {media.description && (
                <div className="mt-6 p-5 rounded-2xl bg-crm-dark/50 border border-white/10">
                  <h2 className="text-sm font-semibold text-crm-gray uppercase tracking-wider mb-2">About</h2>
                  <p className="text-crm-gray-light leading-relaxed whitespace-pre-line">{media.description}</p>
                </div>
              )}
              {media.topics?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {media.topics.map((t) => (
                    <span key={t} className="px-3 py-1 rounded-full bg-crm-purple/10 text-crm-purple text-xs border border-crm-purple/20">{t}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:w-56 flex flex-col gap-3 shrink-0">
              {media.audio_url && (
                <button
                  type="button"
                  onClick={() => playTrack(media)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-crm-purple/20 border border-crm-purple/30 text-crm-white hover:bg-crm-purple/30 transition-all"
                >
                  <Play className="w-4 h-4" /> Audio only
                </button>
              )}
              <button
                type="button"
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

          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="text-xl font-bold text-crm-white mb-6">More to watch</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {related.map((item, i) => (
                  <VideoCard key={item.id} media={item} index={i} onPlayAudio={(m) => playTrack(m, related)} />
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </div>
      {!theater && (
        <div className="mt-16">
          <Footer />
        </div>
      )}
    </div>
  )
}
