import { useState, useEffect } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  User, TrendingUp, Calendar, BookOpen, Heart, DollarSign,
  Award, Target, Flame, ChevronRight, LogOut, Shield
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import GlassCard from '../components/common/GlassCard'
import Footer from '../components/common/Footer'

export default function Portal() {
  const { user, token, loading, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    attendance: 0,
    streak: 0,
    coursesCompleted: 0,
    givingTotal: 0,
    engagementScore: 0
  })

  useEffect(() => {
    if (!user || !token) return

    const load = async () => {
      try {
        const res = await axios.get('/api/me/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setStats({
          attendance: res.data.attendance || 0,
          streak: res.data.streak ?? user.streak ?? 0,
          coursesCompleted: res.data.coursesCompleted || 0,
          givingTotal: res.data.givingTotal || 0,
          engagementScore: res.data.engagementScore ?? user.engagement_score ?? 0
        })
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
  }, [user, token])

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
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-crm-white mb-2">
                Welcome back, {user.full_name}!
              </h1>
              <p className="text-crm-gray-light">Continue your discipleship journey</p>
            </div>
            <div className="flex items-center gap-2">
              {['admin', 'super_admin'].includes(user.role) && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-crm-purple text-crm-black font-semibold hover:opacity-90 transition-all"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-crm-gray hover:bg-white/10 hover:text-crm-white transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Member ID Card */}
          <GlassCard className="p-6 bg-gradient-to-br from-crm-purple/10 to-transparent border-crm-purple/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-crm-gray mb-1">Member ID</p>
                <p className="text-2xl font-bold text-crm-purple tracking-wider">{user.unique_id}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-crm-purple to-crm-purple-light flex items-center justify-center text-crm-black font-bold text-2xl">
                {user.full_name?.charAt(0)}
              </div>
            </div>
          </GlassCard>
        </motion.div>

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
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-crm-white flex items-center gap-2">
                <Target className="w-6 h-6 text-crm-purple" />
                Growth Track
              </h2>
              <span className="text-crm-purple font-medium">{Math.round(progress)}% Complete</span>
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
            <div className="grid grid-cols-5 gap-2">
              {[
                { name: 'New Believer', stage: 'new_believer' },
                { name: 'Growing', stage: 'growing' },
                { name: 'Mature', stage: 'mature' },
                { name: 'Leader', stage: 'leader' },
                { name: 'Commissioned', stage: 'commissioned' }
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
                    i <= currentStageIndex 
                      ? 'bg-crm-purple text-crm-black' 
                      : 'bg-white/10 text-crm-gray'
                  }`}>
                    {i + 1}
                  </div>
                  <p className={`text-xs ${
                    i <= currentStageIndex ? 'text-crm-white font-medium' : 'text-crm-gray'
                  }`}>
                    {item.name}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-crm-purple/10 border border-crm-purple/20">
              <p className="text-sm text-crm-gray-light">
                <strong className="text-crm-purple">Next Step:</strong> Complete the "Foundations" course to advance to the next stage
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <GlassCard className="p-6 group hover:border-crm-purple/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-8 h-8 text-crm-purple" />
              <ChevronRight className="w-5 h-5 text-crm-gray group-hover:text-crm-purple transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-crm-white mb-2">My Courses</h3>
            <p className="text-sm text-crm-gray mb-4">Continue learning and growing</p>
            <div className="text-sm text-crm-purple font-medium">3 in progress →</div>
          </GlassCard>

          <GlassCard className="p-6 group hover:border-crm-purple/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <Heart className="w-8 h-8 text-crm-live" />
              <ChevronRight className="w-5 h-5 text-crm-gray group-hover:text-crm-live transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-crm-white mb-2">Prayer Requests</h3>
            <p className="text-sm text-crm-gray mb-4">View and pray for others</p>
            <div className="text-sm text-crm-live font-medium">2 new requests →</div>
          </GlassCard>

          <GlassCard className="p-6 group hover:border-crm-purple/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-400" />
              <ChevronRight className="w-5 h-5 text-crm-gray group-hover:text-green-400 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-crm-white mb-2">Support History</h3>
            <p className="text-sm text-crm-gray mb-4">View your donations</p>
            <div className="text-sm text-green-400 font-medium">${stats.givingTotal} YTD →</div>
          </GlassCard>
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
