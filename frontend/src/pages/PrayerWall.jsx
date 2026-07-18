import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Plus, Send, MapPin } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import GlassCard from '../components/common/GlassCard'
import Footer from '../components/common/Footer'

export default function PrayerWall() {
  const [prayers, setPrayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newPrayer, setNewPrayer] = useState({ content: '', is_public: true })
  const [submitting, setSubmitting] = useState(false)
  const { user, token } = useAuth()

  useEffect(() => {
    fetchPrayers()
  }, [])

  const fetchPrayers = async () => {
    try {
      const res = await axios.get('/api/prayers')
      setPrayers(res.data.prayers || [])
    } catch (err) {
      console.error('Failed to fetch prayers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPrayer = async (e) => {
    e.preventDefault()

    if (!user) {
      toast.error('Please login to submit a prayer request')
      return
    }

    if (!newPrayer.content.trim()) {
      toast.error('Please enter your prayer request')
      return
    }

    setSubmitting(true)

    try {
      const res = await axios.post('/api/prayers', newPrayer, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPrayers([res.data.prayer, ...prayers])
      setNewPrayer({ content: '', is_public: true })
      setShowModal(false)
      toast.success('Prayer request submitted!')
    } catch (err) {
      console.error('Submit prayer error:', err)
      toast.error('Failed to submit prayer request')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePray = async (prayerId) => {
    if (!user) {
      toast.error('Please login to pray')
      return
    }

    try {
      await axios.post(`/api/prayers/${prayerId}/pray`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPrayers(prayers.map(p => 
        p.id === prayerId ? { ...p, pray_count: (p.pray_count || 0) + 1 } : p
      ))
      toast.success('Praying with you! 🙏')
    } catch (err) {
      console.error('Pray error:', err)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-crm-live/20 to-crm-live/10 mb-4">
            <Heart className="w-8 h-8 text-crm-live" />
          </div>
          <h1 className="text-4xl font-bold text-crm-white mb-4">Prayer Wall</h1>
          <p className="text-crm-gray-light max-w-2xl mx-auto mb-8">
            Join the global prayer movement. Share your burdens, pray for others, and watch God move.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="shield-button inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Submit Prayer Request
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Total Prayers', value: prayers.length },
            { label: 'People Praying', value: prayers.reduce((acc, p) => acc + (p.pray_count || 0), 0) },
            { label: 'Countries', value: '78+' },
            { label: 'Answered', value: prayers.filter(p => p.is_answered).length }
          ].map((stat, i) => (
            <GlassCard key={i} className="p-4 text-center">
              <div className="text-2xl font-bold text-crm-purple">{stat.value}</div>
              <div className="text-xs text-crm-gray uppercase tracking-wider mt-1">{stat.label}</div>
            </GlassCard>
          ))}
        </div>

        {/* Prayer Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-crm-purple/30 border-t-crm-purple rounded-full animate-spin" />
          </div>
        ) : prayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prayers.map((prayer, index) => (
              <motion.div
                key={prayer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-6 h-full flex flex-col">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-crm-purple to-crm-purple-light flex items-center justify-center text-crm-black font-bold">
                      {prayer.member_name?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-crm-white">{prayer.member_name || 'Anonymous'}</h4>
                      {prayer.member_location && (
                        <p className="text-xs text-crm-gray flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {prayer.member_location}
                        </p>
                      )}
                      <p className="text-xs text-crm-gray mt-1">{formatDate(prayer.created_at)}</p>
                    </div>
                  </div>

                  <p className="text-crm-gray-light mb-4 flex-1 line-clamp-6">{prayer.content}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-crm-purple text-sm">
                      <Heart className="w-4 h-4" />
                      <span className="font-medium">{prayer.pray_count || 0} praying</span>
                    </div>
                    <button
                      onClick={() => handlePray(prayer.id)}
                      className="px-4 py-2 rounded-lg bg-crm-purple/10 text-crm-purple hover:bg-crm-purple/20 border border-crm-purple/20 transition-all text-sm font-medium"
                    >
                      Pray 🙏
                    </button>
                  </div>

                  {prayer.is_answered && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                      ✓ Prayer Answered
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-crm-gray mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-crm-white mb-2">No Prayer Requests Yet</h3>
            <p className="text-crm-gray mb-6">Be the first to share your prayer request</p>
            <button
              onClick={() => setShowModal(true)}
              className="shield-button inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Submit Prayer Request
            </button>
          </div>
        )}
      </div>

      <Footer />

      {/* Prayer Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-6">
              <h2 className="text-2xl font-bold text-crm-white mb-4">Submit Prayer Request</h2>
              <form onSubmit={handleSubmitPrayer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-crm-gray-light mb-2">
                    What would you like us to pray for? *
                  </label>
                  <textarea
                    value={newPrayer.content}
                    onChange={(e) => setNewPrayer({ ...newPrayer, content: e.target.value })}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-crm-black/50 border border-white/10 rounded-xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-1 focus:ring-crm-purple transition-all resize-none"
                    placeholder="Share your prayer request here..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={newPrayer.is_public}
                    onChange={(e) => setNewPrayer({ ...newPrayer, is_public: e.target.checked })}
                    className="w-4 h-4 rounded border-white/10 bg-crm-black/50 text-crm-purple focus:ring-crm-purple"
                  />
                  <label htmlFor="is_public" className="ml-2 text-sm text-crm-gray">
                    Make this prayer request public
                  </label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-crm-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 shield-button py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-crm-black/30 border-t-crm-black rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </div>
  )
}
