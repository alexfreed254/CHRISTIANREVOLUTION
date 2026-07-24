import { useState, useEffect } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, Calendar, BookOpen, Heart, DollarSign, ChevronRight, LogOut, Shield,
  Bookmark, Bell, Library
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/common/LanguageSelector'
import DailyNotice from '../components/common/DailyNotice'
import GlassCard from '../components/common/GlassCard'
import Footer from '../components/common/Footer'

const PORTAL_LINKS = [
  { to: '/portal/profile', icon: User, title: 'My Profile', desc: 'Photo, bio, ministries & settings' },
  { to: '/discipleship', icon: Library, title: 'My Library', desc: 'Saved materials & courses' },
  { to: '/discipleship', icon: BookOpen, title: 'My Courses', desc: 'Track your progress' },
  { to: '/events', icon: Calendar, title: 'Events', desc: 'Upcoming & registered' },
  { to: '/support', icon: DollarSign, title: 'Giving', desc: 'History & receipts' },
  { to: '/prayer', icon: Heart, title: 'Prayer', desc: 'Submit & track requests' },
]

export default function Portal() {
  const { user, token, loading, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ coursesCompleted: 0, givingTotal: 0 })

  useEffect(() => {
    if (!user || !token) return
    axios.get('/api/me/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setStats({
        coursesCompleted: res.data.coursesCompleted || 0,
        givingTotal: res.data.givingTotal || 0,
      }))
      .catch(() => {})
  }, [user, token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-crm-purple/30 border-t-crm-purple rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />

  return (
    <div className="page-shell safe-bottom">
      <div className="page-container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-crm-white mb-1">
                {t('portal.welcome')}, {user.full_name?.split(' ')[0]}
              </h1>
              <p className="text-sm text-crm-gray">Your member dashboard</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <LanguageSelector compact />
              {['admin', 'super_admin'].includes(user.role) && (
                <Link to="/admin" className="px-3 py-2 rounded-lg bg-crm-purple text-white text-sm font-semibold flex items-center gap-1">
                  <Shield className="w-4 h-4" /> Admin
                </Link>
              )}
              <button type="button" onClick={() => { logout(); navigate('/login') }} className="p-2.5 rounded-lg border border-slate-200 text-crm-gray hover:bg-slate-50">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <GlassCard hover={false} className="p-4 flex items-center gap-4">
            {user.profile_photo_url ? (
              <img src={user.profile_photo_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0 border border-crm-purple/30" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-crm-purple flex items-center justify-center text-white font-bold text-lg shrink-0">
                {user.full_name?.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-crm-white truncate">{user.full_name}</p>
              <p className="text-xs text-crm-purple font-mono">{user.unique_id}</p>
              {user.ministry_interests?.length > 0 && (
                <p className="text-xs text-crm-gray mt-1 truncate">{user.ministry_interests.join(' · ')}</p>
              )}
            </div>
            <Link to="/portal/profile" className="text-xs px-3 py-2 rounded-lg bg-crm-purple/10 text-crm-purple font-semibold shrink-0 hover:bg-crm-purple/20">
              Edit
            </Link>
          </GlassCard>
        </motion.div>

        <section className="mb-8">
          <DailyNotice />
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-crm-gray mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Quick Access
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PORTAL_LINKS.map((item) => (
              <Link key={item.title} to={item.to} className="block">
                <GlassCard className="p-4 h-full group">
                  <div className="flex items-start justify-between gap-2">
                    <item.icon className="w-6 h-6 text-crm-purple shrink-0" />
                    <ChevronRight className="w-4 h-4 text-crm-gray group-hover:text-crm-purple transition-colors" />
                  </div>
                  <h3 className="font-semibold text-crm-white mt-2">{item.title}</h3>
                  <p className="text-xs text-crm-gray mt-1">{item.desc}</p>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 mb-8">
          <GlassCard hover={false} className="p-4 text-center">
            <Bookmark className="w-5 h-5 text-crm-purple mx-auto mb-2" />
            <p className="text-2xl font-bold text-crm-white">{stats.coursesCompleted}</p>
            <p className="text-xs text-crm-gray">Courses completed</p>
          </GlassCard>
          <GlassCard hover={false} className="p-4 text-center">
            <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-crm-white">${stats.givingTotal}</p>
            <p className="text-xs text-crm-gray">Total giving</p>
          </GlassCard>
        </section>

        <GlassCard hover={false} className="p-5 flex items-center gap-3">
          <User className="w-8 h-8 text-crm-purple shrink-0" />
          <div>
            <p className="font-medium text-crm-white">Notifications</p>
            <p className="text-sm text-crm-gray">Church announcements and event reminders appear here as they are sent.</p>
          </div>
        </GlassCard>
      </div>
      <Footer />
    </div>
  )
}
