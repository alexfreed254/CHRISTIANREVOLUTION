import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, CheckCircle } from 'lucide-react'
import axios from 'axios'
import VideoCard from '../components/media/VideoCard'
import GlassCard from '../components/common/GlassCard'
import { usePlayer } from '../context/PlayerContext'
import toast from 'react-hot-toast'
import Footer from '../components/common/Footer'

export default function SeriesPage() {
  const { seriesId } = useParams()
  const [series, setSeries] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const { playTrack } = usePlayer()

  useEffect(() => {
    fetchSeries()
  }, [seriesId])

  const fetchSeries = async () => {
    try {
      const res = await axios.get(`/api/media/series/${seriesId}`)
      setSeries(res.data.series)
      setEpisodes(res.data.episodes || [])
    } catch (err) {
      console.error('Failed to fetch series:', err)
      toast.error('Failed to load series')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-crm-purple/30 border-t-crm-purple rounded-full animate-spin" />
      </div>
    )
  }

  if (!series) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-crm-white mb-2">Series Not Found</h2>
          <p className="text-crm-gray mb-6">This series does not exist.</p>
          <Link to="/media" className="shield-button text-sm inline-block">
            ← Back to Media Library
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-crm-purple/10 to-transparent py-16 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/media"
            className="inline-flex items-center gap-2 text-crm-gray hover:text-crm-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Media Library
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-3 gap-8 items-start"
          >
            {/* Series Thumbnail */}
            <div className="md:col-span-1">
              <GlassCard className="overflow-hidden">
                <img
                  src={series.thumbnail_url}
                  alt={series.title}
                  className="w-full aspect-video object-cover"
                />
              </GlassCard>
            </div>

            {/* Series Info */}
            <div className="md:col-span-2">
              <h1 className="text-4xl font-bold text-crm-white mb-4">{series.title}</h1>
              <p className="text-crm-purple font-medium mb-4 text-lg">{series.speaker}</p>
              <p className="text-crm-gray-light text-lg mb-6">{series.description}</p>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-crm-gray">
                  <Play className="w-5 h-5" />
                  <span>{series.total_episodes} Episodes</span>
                </div>
                <div className="flex items-center gap-2 text-crm-gray">
                  <CheckCircle className="w-5 h-5" />
                  <span>0 of {series.total_episodes} completed</span>
                </div>
              </div>

              {/* Tags */}
              {series.tags && (
                <div className="flex flex-wrap gap-2">
                  {series.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs rounded-full bg-crm-purple/10 text-crm-purple border border-crm-purple/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Episodes Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-crm-white mb-2">Episodes</h2>
          <p className="text-crm-gray">Watch in order or jump to any episode</p>
        </div>

        {episodes.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {episodes.map((episode, index) => (
              <VideoCard
                key={episode.id}
                media={episode}
                index={index}
                onPlayAudio={(m) => playTrack(m, episodes)}
              />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <Play className="w-16 h-16 text-crm-gray mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-crm-white mb-2">No Episodes Yet</h3>
            <p className="text-crm-gray">Episodes for this series are coming soon</p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  )
}
