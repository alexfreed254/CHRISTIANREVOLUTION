import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, Heart, Play, UserPlus, Clock, MapPin, ChevronRight, Radio, DollarSign
} from 'lucide-react'
import axios from 'axios'
import BrandLogo from '../components/common/BrandLogo'
import DailyNotice from '../components/common/DailyNotice'
import VideoCard from '../components/media/VideoCard'
import Footer from '../components/common/Footer'
import GlassCard from '../components/common/GlassCard'
import LiveBadge from '../components/common/LiveBadge'
import { SERVICE_TIMES, UPCOMING_EVENTS } from '../constants/churchInfo'
import { usePlayer } from '../context/PlayerContext'

const QUICK_ACTIONS = [
  { to: '/register', label: 'Join Us', icon: UserPlus, primary: true },
  { to: '/sermons', label: 'Watch Sermon', icon: Play, primary: false },
  { to: '/prayer', label: 'Prayer Request', icon: Heart, primary: false },
  { to: '/give', label: 'Give', icon: DollarSign, primary: false },
]

export default function Home() {
  const [latestSermon, setLatestSermon] = useState(null)
  const [liveStream, setLiveStream] = useState(null)
  const { playTrack } = usePlayer()
  const nextEvent = UPCOMING_EVENTS[0]

  useEffect(() => {
    const load = async () => {
      try {
        const [mediaRes, streamsRes] = await Promise.all([
          axios.get('/api/media/library?sort=latest&per_page=1'),
          axios.get('/api/live/streams'),
        ])
        setLatestSermon(mediaRes.data.media?.[0] || null)
        setLiveStream(streamsRes.data.streams?.find((s) => s.status === 'live') || null)
      } catch {
        /* seed data may still render via cards */
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Welcome + service times */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-purple-50/40 to-white">
        <div className="page-container py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-center gap-4 sm:gap-6">
              <BrandLogo size="md" priority className="shrink-0 hidden sm:block" />
              <div>
                <p className="text-sm text-crm-purple font-semibold uppercase tracking-wider mb-1">Welcome</p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-crm-white leading-tight">
                  Christ Revolution Movement
                </h1>
                <p className="text-crm-gray-light mt-2 max-w-xl">
                  Discipling nations through the undiluted gospel — join us in person or online.
                </p>
              </div>
            </div>
            <GlassCard hover={false} className="p-4 sm:p-5 lg:min-w-[280px]">
              <div className="flex items-center gap-2 text-crm-purple font-semibold text-sm mb-3">
                <Clock className="w-4 h-4" /> Service Times
              </div>
              <ul className="space-y-2">
                {SERVICE_TIMES.map((s) => (
                  <li key={s.day} className="text-sm flex justify-between gap-2">
                    <span className="text-crm-white font-medium">{s.day}</span>
                    <span className="text-crm-gray">{s.time}</span>
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="text-xs text-crm-purple mt-3 inline-flex items-center gap-1 hover:underline">
                Contact & directions <ChevronRight className="w-3 h-3" />
              </Link>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Daily notice — today's teaching */}
      <section className="page-container py-6 sm:py-8">
        <DailyNotice />
      </section>

      {/* Live stream alert */}
      {liveStream && (
        <section className="page-container pb-6">
          <Link
            to={`/live/${liveStream.id}`}
            className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-red-50 border border-red-200 hover:bg-red-100/80 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <LiveBadge size="sm" />
              <div className="min-w-0">
                <p className="font-semibold text-crm-white truncate">{liveStream.title}</p>
                <p className="text-sm text-crm-gray truncate">{liveStream.speaker}</p>
              </div>
            </div>
            <span className="shrink-0 flex items-center gap-1 text-sm font-semibold text-red-600">
              <Radio className="w-4 h-4" /> Watch Live
            </span>
          </Link>
        </section>
      )}

      {/* Quick actions */}
      <section className="page-container pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-2xl text-center min-h-[100px] transition-all ${
                action.primary
                  ? 'bg-crm-purple text-white shadow-lg shadow-crm-purple/20 hover:opacity-90'
                  : 'bg-white border border-slate-200 text-crm-white hover:border-crm-purple/40 hover:shadow-sm'
              }`}
            >
              <action.icon className={`w-6 h-6 ${action.primary ? 'text-white' : 'text-crm-purple'}`} />
              <span className="text-sm font-semibold">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest sermon + upcoming event */}
      <section className="page-container pb-12">
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-crm-white">Latest Sermon</h2>
              <Link to="/sermons" className="text-sm text-crm-purple hover:underline">All sermons</Link>
            </div>
            {latestSermon ? (
              <VideoCard media={latestSermon} index={0} onPlayAudio={(m) => playTrack(m, [latestSermon])} />
            ) : (
              <GlassCard hover={false} className="p-8 text-center">
                <Play className="w-10 h-10 text-crm-purple mx-auto mb-3 opacity-50" />
                <p className="text-crm-gray text-sm">Sermons will appear here when published.</p>
                <Link to="/sermons" className="text-sm text-crm-purple mt-2 inline-block hover:underline">Browse sermons</Link>
              </GlassCard>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-crm-white">Upcoming Event</h2>
              <Link to="/events" className="text-sm text-crm-purple hover:underline">All events</Link>
            </div>
            <GlassCard hover={false} className="p-6 h-full flex flex-col">
              <p className="text-xs font-bold uppercase tracking-wider text-crm-purple mb-2">Next Up</p>
              <h3 className="text-xl font-bold text-crm-white mb-2">{nextEvent.title}</h3>
              <p className="text-sm text-crm-gray mb-4 flex-1">{nextEvent.description}</p>
              <div className="space-y-2 text-sm text-crm-gray-light mb-4">
                <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-crm-purple" /> {nextEvent.date} · {nextEvent.time}</p>
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-crm-purple" /> {nextEvent.location}</p>
              </div>
              <Link to="/events" className="shield-button text-center text-sm w-full sm:w-auto">
                View Events & News
              </Link>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Simple invite */}
      <section className="page-container pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-slate-50 border border-slate-200 p-8 sm:p-10 text-center"
        >
          <Users className="w-10 h-10 text-crm-purple mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-crm-white mb-2">Become Part of the Movement</h2>
          <p className="text-crm-gray max-w-lg mx-auto mb-6">
            Register as a member to save sermons, track discipleship, submit prayer requests, and grow with us.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register" className="shield-button">Join Us</Link>
            <Link to="/discipleship" className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-crm-white hover:bg-white">
              Discipleship Library
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
