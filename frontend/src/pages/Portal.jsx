import { useState, useEffect } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  User, TrendingUp, Calendar, BookOpen, Heart, DollarSign,
  Award, Target, Flame, ChevronRight, LogOut, Shield, Sun, Headphones, Video, Bookmark
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/common/LanguageSelector'
import GlassCard from '../components/common/GlassCard'
import Footer from '../components/common/Footer'

export default function Portal() {
  const { user, token, loading, logout } = useAuth()
  const { language, t } = useLanguage()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    attendance: 0,
    streak: 0,
    coursesCompleted: 0,
    givingTotal: 0,
    engagementScore: 0
  })
  const [todayMaterial, setTodayMaterial] = useState(null)

  useEffect(() => {
    if (!user || !token) return

    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const [statsRes, todayRes] = await Promise.all([
          axios.get('/api/me/stats', { headers }),
          axios.get('/api/discipleship/today', { headers, params: { lang: language } }),
        ])
        setStats({
          attendance: statsRes.data.attendance || 0,
          streak: statsRes.data.streak ?? user.streak ?? 0,
          coursesCompleted: statsRes.data.coursesCompleted || 0,
          givingTotal: statsRes.data.givingTotal || 0,
          engagementScore: statsRes.data.engagementScore ?? user.engagement_score ?? 0
        })
        setTodayMaterial(todayRes.data.material)
      } catch {
        setStats({
          attendance: 0,
          streak: user.streak || 0,
          coursesCompleted: 0,
          givingTotal: 0,
          engagementScore: user.engagement_score || 0
        })
      }
    }

    load()
    const interval = setInterval(load, 20000)
    return () => clearInterval(interval)
  }, [user, token, language])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-crm-purple/30 border-t-crm-purple rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  const growthStages = ['new_believer', 'growing', 'mature', 'leader', 'commissioned']
  const currentStageIndex = growthStages.indexOf(user.growth_stage || 'new_believer')
  const progress = ((currentStageIndex + 1) / growthStages.length) * 100

  return (
    <div className="page-shell safe-bottom">
      <div className="page-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-crm-white mb-2 break-words">
                {t('portal.welcome')}, {user.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-sm sm:text-base text-crm-gray-light">Continue your discipleship journey</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {['admin', 'super_admin'].includes(user.role) && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-crm-purple text-crm-black font-semibold hover:opacity-90 transition-all text-sm"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/5 text-crm-gray hover:bg-white/10 hover:text-crm-white transition-all text-sm min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Member ID Card */}
          <GlassCard className="p-4 sm:p-6 bg-gradient-to-br from-crm-purple/10 to-transparent border-crm-purple/20">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-crm-gray mb-1">Member ID</p>
                <p className="text-lg sm:text-2xl font-bold text-crm-purple tracking-wider break-all">{user.unique_id}</p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-crm-purple to-crm-purple-light flex items-center justify-center text-crm-black font-bold text-xl sm:text-2xl shrink-0">
                {user.full_name?.charAt(0)}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Today's Spiritual Material */}
        {todayMaterial && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-12"
          >
            <GlassCard className="p-4 sm:p-6 lg:p-8 border-crm-purple/30 bg-gradient-to-br from-crm-purple/10 to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-6">
                <div className="min-w-0">
                  <p className="text-sm text-crm-gray-light mb-1">
                    Good morning, {user.full_name?.split(' ')[0]}
                  </p>
                  <h2 className="text-lg sm:text-2xl font-bold text-crm-white flex items-center gap-2">
                    <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-crm-purple shrink-0" />
                    <span>{t('portal.todayBite')}</span>
                  </h2>
                </div>
                <LanguageSelector compact className="w-full sm:w-auto" />
              </div>

              <h3 className="text-xl font-semibold text-crm-white mb-2">{todayMaterial.title}</h3>
              <p className="text-crm-gray-light text-sm mb-6 line-clamp-3">{todayMaterial.description}</p>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                <Link
                  to={`/discipleship/${todayMaterial.id}?lang=${language}`}
                  className="shield-button text-center col-span-2 sm:col-span-1 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <BookOpen className="w-4 h-4" /> {t('library.read')}
                </Link>
                {todayMaterial.audio_url && (
                  <Link
                    to={`/discipleship/${todayMaterial.id}?lang=${language}`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-sm text-crm-white hover:bg-white/5 min-h-[44px]"
                  >
                    <Headphones className="w-4 h-4" /> {t('library.listen')}
                  </Link>
                )}
                {todayMaterial.video_url && (
                  <Link
                    to={`/discipleship/${todayMaterial.id}?lang=${language}`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-sm text-crm-white hover:bg-white/5 min-h-[44px]"
                  >
                    <Video className="w-4 h-4" /> {t('library.watch')}
                  </Link>
                )}
                <Link
                  to="/discipleship"
                  className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-crm-purple/30 text-sm text-crm-purple hover:bg-crm-purple/10 min-h-[44px]"
                >
                  <Bookmark className="w-4 h-4" /> Library
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {[
            { icon: TrendingUp, label: 'Engagement', value: `${stats.engagementScore}%`, color: 'text-crm-purple' },
            { icon: Flame, label: 'Streak', value: `${stats.streak} days`, color: 'text-orange-400' },
            { icon: Calendar, label: 'Attendance', value: stats.attendance, color: 'text-blue-400' },
            { icon: BookOpen, label: 'Courses', value: stats.coursesCompleted, color: 'text-green-400' },
            { icon: Heart, label: 'Donations', value: `$${stats.givingTotal}`, color: 'text-crm-live' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="p-4 text-center">
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-crm-white">{stat.value}</div>
                <div className="text-xs text-crm-gray uppercase tracking-wider mt-1">{stat.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Growth Track */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <GlassCard className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-crm-white flex items-center gap-2">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-crm-purple shrink-0" />
                Growth Track
              </h2>
              <span className="text-crm-purple font-medium text-sm sm:text-base">{Math.round(progress)}% Complete</span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-3 bg-white/5 rounded-full overflow-hidden mb-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-crm-purple to-crm-purple-light rounded-full"
              />
            </div>

            {/* Stages */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-2">
              {[
                { name: 'New Believer', short: 'New' },
                { name: 'Growing', short: 'Grow' },
                { name: 'Mature', short: 'Mature' },
                { name: 'Leader', short: 'Lead' },
                { name: 'Commissioned', short: 'Sent' }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mb-2 ${
                    i <= currentStageIndex 
                      ? 'bg-crm-purple text-crm-black' 
                      : 'bg-white/10 text-crm-gray'
                  }`}>
                    {i + 1}
                  </div>
                  <p className={`text-[10px] sm:text-xs leading-tight ${
                    i <= currentStageIndex ? 'text-crm-white font-medium' : 'text-crm-gray'
                  }`}>
                    <span className="sm:hidden">{item.short}</span>
                    <span className="hidden sm:inline">{item.name}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-crm-purple/10 border border-crm-purple/20">
              <p className="text-sm text-crm-gray-light">
                <strong className="text-crm-purple">Next Step:</strong> Complete a course in the{' '}
                <Link to="/discipleship" className="text-crm-purple hover:underline">Discipleship Library</Link>{' '}
                to advance to the next stage
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link to="/discipleship" className="block">
          <GlassCard className="p-6 group hover:border-crm-purple/30 transition-all cursor-pointer h-full">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8 text-crm-purple" />
              <ChevronRight className="w-5 h-5 text-crm-gray group-hover:text-crm-purple transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-crm-white mb-2">My Courses</h3>
            <p className="text-sm text-crm-gray mb-4">Continue learning and growing</p>
            <div className="text-sm text-crm-purple font-medium">{stats.coursesCompleted} completed →</div>
          </GlassCard>
          </Link>

          <Link to="/prayer" className="block">
          <GlassCard className="p-6 group hover:border-crm-live/30 transition-all cursor-pointer h-full">
            <div className="flex items-center justify-between mb-4">
              <Heart className="w-8 h-8 text-crm-live" />
              <ChevronRight className="w-5 h-5 text-crm-gray group-hover:text-crm-live transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-crm-white mb-2">Prayer Requests</h3>
            <p className="text-sm text-crm-gray mb-4">View and pray for others</p>
            <div className="text-sm text-crm-live font-medium">View prayer wall →</div>
          </GlassCard>
          </Link>

          <Link to="/support" className="block">
          <GlassCard className="p-6 group hover:border-green-400/30 transition-all cursor-pointer h-full">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-400" />
              <ChevronRight className="w-5 h-5 text-crm-gray group-hover:text-green-400 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-crm-white mb-2">Support History</h3>
            <p className="text-sm text-crm-gray mb-4">View your donations</p>
            <div className="text-sm text-green-400 font-medium">${stats.givingTotal} YTD →</div>
          </GlassCard>
          </Link>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-crm-white mb-6">Recent Activity</h2>
          <GlassCard className="divide-y divide-white/10">
            {[
              { icon: BookOpen, text: 'Completed "Foundations of Faith" course', time: '2 days ago', color: 'text-green-400' },
              { icon: Calendar, text: 'Attended Sunday Service', time: '4 days ago', color: 'text-blue-400' },
              { icon: Heart, text: 'Submitted a prayer request', time: '1 week ago', color: 'text-crm-live' },
              { icon: DollarSign, text: 'Donated $50 offering', time: '1 week ago', color: 'text-green-400' }
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center ${activity.color}`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-crm-white font-medium">{activity.text}</p>
                  <p className="text-xs text-crm-gray">{activity.time}</p>
                </div>
              </div>
            ))}
          </GlassCard>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  )
}
