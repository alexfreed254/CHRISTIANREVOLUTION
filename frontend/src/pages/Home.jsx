import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Cross, Globe, Users, Heart, ArrowRight, Play, 
  TrendingUp, Clock, Flame, ChevronRight, Star
} from 'lucide-react'
import axios from 'axios'
import ReactPlayer from 'react-player'
import LiveBadge from '../components/common/LiveBadge'
import GlassCard from '../components/common/GlassCard'
import VideoCard from '../components/media/VideoCard'
import SeriesCarousel from '../components/media/SeriesCarousel'
import BrandLogo from '../components/common/BrandLogo'
import { usePlayer } from '../context/PlayerContext'
import useLiveStats from '../hooks/useLiveStats'

export default function Home() {
  const [liveStream, setLiveStream] = useState(null)
  const [trendingMedia, setTrendingMedia] = useState([])
  const [series, setSeries] = useState([])
  const [nextService, setNextService] = useState(null)
  const { stats } = useLiveStats({ pollMs: 20000 })
  const { playTrack } = usePlayer()

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [streamsRes, mediaRes, seriesRes] = await Promise.all([
        axios.get('/api/live/streams'),
        axios.get('/api/media/library?sort=most_viewed&per_page=6'),
        axios.get('/api/media/series'),
      ])

      const live = streamsRes.data.streams.find(s => s.status === 'live')
      setLiveStream(live || null)
      setTrendingMedia(mediaRes.data.media || [])
      setSeries(seriesRes.data.series || [])

      // Calculate next service
      const now = new Date()
      const daysUntilSunday = (7 - now.getDay()) % 7 || 7
      const nextSunday = new Date(now)
      nextSunday.setDate(now.getDate() + daysUntilSunday)
      nextSunday.setHours(10, 0, 0, 0)
      setNextService(nextSunday)
    } catch (err) {
      console.error('Failed to fetch home data:', err)
    }
  }

  const formatCountdown = () => {
    if (!nextService) return ''
    const diff = nextService - new Date()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${days}d ${hours}h ${mins}m`
  }

  const formatStat = (n) => {
    const v = Number(n) || 0
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M+`
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K+`
    return `${v}`
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-purple-50/50 to-slate-50" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-crm-purple/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-crm-purple-light/10 rounded-full blur-[120px]" />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-32">
          <div className="text-center">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <BrandLogo size="hero" priority className="mx-auto drop-shadow-[0_0_40px_rgba(139,127,199,0.45)]" />
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-crm-purple/10 border border-crm-purple/20 mb-8"
            >
              <Globe className="w-4 h-4 text-crm-purple" />
              <span className="text-sm text-crm-purple font-medium">Global Movement • 42 Nations</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-6"
            >
              <span className="block text-crm-white">CHRIST</span>
              <span className="block text-gradient">REVOLUTION</span>
              <span className="block text-2xl sm:text-3xl lg:text-4xl font-light tracking-[0.3em] text-crm-gray mt-2">MOVEMENT</span>
            </motion.h1>

            {/* Vision */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl sm:text-2xl text-crm-gray-light max-w-2xl mx-auto mb-4"
            >
              Discipling <span className="text-crm-purple font-bold">2 Billion Souls</span> by 2033
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-crm-gray text-lg mb-10"
            >
              Through the undiluted gospel of Jesus Christ
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {liveStream?.status === 'live' ? (
                <Link to={`/live/${liveStream.id}`} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-sm transition-all shadow-lg shadow-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Watch Live Now
                </Link>
              ) : (
                <Link to="/live" className="shield-button text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Next Service: {formatCountdown()}
                </Link>
              )}

              <Link 
                to="/media" 
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-crm-white hover:bg-slate-100 transition-all text-sm font-medium"
              >
                <Play className="w-4 h-4" />
                Browse Media Library
              </Link>
            </motion.div>

            {/* Live Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-12 sm:mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto"
            >
              <div className="text-center">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-crm-purple">
                  {formatStat(stats.members)}
                </div>
                <div className="text-xs text-crm-gray uppercase tracking-wider mt-1">Members</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-crm-purple">{stats.countries}</div>
                <div className="text-xs text-crm-gray uppercase tracking-wider mt-1">Nations</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-crm-purple">
                  {formatStat(stats.souls)}
                </div>
                <div className="text-xs text-crm-gray uppercase tracking-wider mt-1">Souls Reached</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-crm-purple/30 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-crm-purple rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Live Stream Section */}
      {liveStream?.status === 'live' && (
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-2 sm:gap-3">
                <LiveBadge size="lg" />
                <h2 className="text-xl sm:text-2xl font-bold text-crm-white">Now Streaming</h2>
              </div>
              <Link to={`/live/${liveStream.id}`} className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-all text-sm font-medium">
                Watch Full Stream <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <GlassCard className="overflow-hidden border-red-500/20 shadow-lg shadow-red-500/10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                <div className="lg:col-span-2 relative video-embed">
                  <ReactPlayer
                    url={liveStream.stream_url}
                    playing
                    controls
                    width="100%"
                    height="100%"
                    config={{ file: { attributes: { controlsList: 'nodownload' } } }}
                  />
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 pointer-events-none z-10">
                    <LiveBadge size="md" />
                  </div>
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2 z-10 pointer-events-none">
                    <Users className="w-4 h-4 text-red-400" />
                    <span className="text-xs sm:text-sm text-white font-medium">{liveStream.viewer_count?.toLocaleString()} watching</span>
                  </div>
                </div>
                <div className="p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <LiveBadge size="sm" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Live Now</span>
                  </div>
                  <h3 className="text-xl font-bold text-crm-white mb-2">{liveStream.title}</h3>
                  <p className="text-crm-gray-light text-sm mb-4">{liveStream.speaker}</p>
                  <p className="text-crm-gray text-sm mb-6 line-clamp-3">{liveStream.description}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {liveStream.topics?.map(topic => (
                      <span key={topic} className="px-3 py-1 text-xs rounded-full bg-crm-purple/10 text-crm-purple border border-crm-purple/20">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <Link to={`/live/${liveStream.id}`} className="shield-button text-center text-sm w-full">
                    Join the Stream
                  </Link>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>
      )}

      {/* Trending Media */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-crm-dark/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-crm-purple" />
                Trending Now
              </h2>
              <p className="text-crm-gray text-sm mt-1">Most watched messages this week</p>
            </div>
            <Link to="/media" className="flex items-center gap-1 text-crm-purple hover:text-crm-purple-light transition-all text-sm font-medium">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingMedia.slice(0, 6).map((media, index) => (
              <VideoCard 
                key={media.id} 
                media={media} 
                index={index}
                onPlayAudio={(m) => playTrack(m, trendingMedia)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Series Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SeriesCarousel 
            series={series} 
            title="Sermon Series" 
            subtitle="Deep dive into the Word through structured teaching"
          />
        </div>
      </section>

      {/* Growth Track CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-crm-purple/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-crm-purple-light/5 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <Flame className="w-12 h-12 text-crm-purple mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Your Discipleship Journey</h2>
              <p className="text-crm-gray-light max-w-xl mx-auto mb-8">
                Track your spiritual growth from New Believer to Commissioned Leader. 
                Complete courses, attend services, and grow in the knowledge of Christ.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {['New Believer', 'Foundations', 'Discipleship', 'Leadership', 'Commissioned'].map((stage, i) => (
                    <div key={stage} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-crm-purple text-white' : 'bg-slate-200 text-crm-gray'
                      }`}>
                        {i + 1}
                      </div>
                      {i < 4 && <div className="w-4 h-0.5 bg-slate-200 hidden sm:block" />}
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/register" className="shield-button mt-8 inline-block">
                Start Your Journey
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Prayer Wall Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-crm-dark/30 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="w-6 h-6 text-crm-live" />
                Prayer Wall
              </h2>
              <p className="text-crm-gray text-sm mt-1">Join the global prayer movement</p>
            </div>
            <Link to="/prayer" className="shield-button text-xs">
              Submit Prayer
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Sarah W.', location: 'Nairobi, Kenya', content: 'Healing for my brother battling cancer. Doctors say terminal, but we serve the God who heals!', prayers: 234 },
              { name: 'David S.', location: 'São Paulo, Brazil', content: 'Praying for the 2 billion mandate! May God open doors for CRM to reach every nation!', prayers: 567 },
              { name: 'Marie D.', location: 'Paris, France', content: 'I need a breakthrough in my finances. I have been faithful in tithing but the enemy attacks my business.', prayers: 189 },
            ].map((prayer, i) => (
              <GlassCard key={i} className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-crm-purple to-crm-purple-light flex items-center justify-center text-white font-bold text-sm">
                    {prayer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-crm-white">{prayer.name}</h4>
                    <p className="text-xs text-crm-gray">{prayer.location}</p>
                  </div>
                </div>
                <p className="text-sm text-crm-gray-light mb-4 line-clamp-3">{prayer.content}</p>
                <div className="flex items-center gap-2 text-xs text-crm-purple">
                  <Heart className="w-3.5 h-3.5" />
                  <span>{prayer.prayers} praying</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" />
              <div>
                <h3 className="font-bold text-lg">Christ Revolution Movement</h3>
                <p className="text-xs text-crm-gray">Discipling 2 Billion Souls by 2033</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-crm-gray">
              <Link to="/" className="hover:text-crm-white transition-colors">Home</Link>
              <Link to="/live" className="hover:text-crm-white transition-colors">Live</Link>
              <Link to="/media" className="hover:text-crm-white transition-colors">Media</Link>
              <Link to="/prayer" className="hover:text-crm-white transition-colors">Prayer</Link>
              <Link to="/support" className="hover:text-crm-white transition-colors">Support & Donations</Link>
            </div>
            <p className="text-xs text-crm-gray">© 2026 Christ Revolution Movement. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
