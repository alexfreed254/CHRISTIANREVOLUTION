import { useState, useEffect, useMemo } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, MapPin, Heart, Lock, Save, ArrowLeft, Camera, CheckCircle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { MINISTRIES } from '../constants/churchInfo'
import GlassCard from '../components/common/GlassCard'
import Footer from '../components/common/Footer'

const MEMBERSHIP_STATUSES = [
  { value: 'visitor', label: 'Visitor' },
  { value: 'new_convert', label: 'New Convert' },
  { value: 'new_member', label: 'New Member' },
  { value: 'active_member', label: 'Active Member' },
  { value: 'inactive_member', label: 'Inactive Member' },
  { value: 'transferred', label: 'Transferred Member' },
]

const CONTINENTS = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica']

function profileCompletion(user) {
  if (!user) return 0
  const checks = [
    user.full_name,
    user.email,
    user.phone,
    user.city,
    user.country,
    user.profile_photo_url,
    user.bio,
    user.ministry_interests?.length,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export default function Profile() {
  const { user, token, loading, refreshUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    continent: '',
    country: '',
    city: '',
    village: '',
    bio: '',
    profile_photo_url: '',
    membership_status: 'active_member',
    preferred_language: 'en',
    timezone: 'UTC',
    ministry_interests: [],
  })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  useEffect(() => {
    if (!user) return
    setForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      continent: user.continent || '',
      country: user.country || '',
      city: user.city || '',
      village: user.village || '',
      bio: user.bio || '',
      profile_photo_url: user.profile_photo_url || '',
      membership_status: user.membership_status || 'active_member',
      preferred_language: user.preferred_language || 'en',
      timezone: user.timezone || 'UTC',
      ministry_interests: user.ministry_interests || [],
    })
  }, [user])

  const completion = useMemo(() => profileCompletion(user), [user])

  const toggleMinistry = (name) => {
    setForm((prev) => {
      const set = new Set(prev.ministry_interests)
      if (set.has(name)) set.delete(name)
      else set.add(name)
      return { ...prev, ministry_interests: [...set] }
    })
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await axios.patch('/api/me', form, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await refreshUser()
      toast.success('Profile saved')
      if (res.data) {
        setForm((prev) => ({
          ...prev,
          ...res.data,
          ministry_interests: res.data.ministry_interests || prev.ministry_interests,
        }))
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match')
      return
    }
    try {
      await axios.post('/api/me/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      }, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Password updated')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password update failed')
    }
  }

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
      <div className="page-container max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/portal" className="inline-flex items-center gap-1 text-sm text-crm-purple hover:underline mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Portal
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-crm-white mb-2">My Profile</h1>
          <p className="text-sm text-crm-gray">Build your member profile — photo, bio, location, and ministries.</p>
        </motion.div>

        <GlassCard hover={false} className="p-5 mb-6">
          <div className="flex items-center gap-4">
            {form.profile_photo_url ? (
              <img src={form.profile_photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-crm-purple/30" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-crm-purple flex items-center justify-center text-white text-xl font-bold">
                {form.full_name?.charAt(0) || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-crm-white truncate">{form.full_name || user.full_name}</p>
              <p className="text-xs text-crm-purple font-mono">{user.unique_id}</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-crm-gray mb-1">
                  <span>Profile completion</span>
                  <span className="font-semibold text-crm-purple">{completion}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-crm-purple transition-all" style={{ width: `${completion}%` }} />
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <form onSubmit={saveProfile} className="space-y-6">
          <GlassCard hover={false} className="p-5 space-y-4">
            <h2 className="font-semibold text-crm-white flex items-center gap-2">
              <User className="w-5 h-5 text-crm-purple" /> Personal Information
            </h2>
            <div>
              <label className="block text-sm text-crm-gray mb-1">Full name</label>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-crm-white" />
            </div>
            <div>
              <label className="block text-sm text-crm-gray mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-crm-white" />
            </div>
            <div>
              <label className="block text-sm text-crm-gray mb-1">Email</label>
              <input disabled value={user.email || ''} className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-gray cursor-not-allowed" />
              <p className="text-xs text-crm-gray mt-1">Contact admin to change your email.</p>
            </div>
            <div>
              <label className="block text-sm text-crm-gray mb-1 flex items-center gap-1">
                <Camera className="w-4 h-4" /> Profile photo URL
              </label>
              <input value={form.profile_photo_url} onChange={(e) => setForm({ ...form, profile_photo_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-crm-white text-sm" />
            </div>
            <div>
              <label className="block text-sm text-crm-gray mb-1">Bio / testimony (short)</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4} placeholder="Share a brief testimony or introduction..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-crm-white" />
            </div>
            <div>
              <label className="block text-sm text-crm-gray mb-1">Membership status</label>
              <select value={form.membership_status} onChange={(e) => setForm({ ...form, membership_status: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-crm-white">
                {MEMBERSHIP_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </GlassCard>

          <GlassCard hover={false} className="p-5 space-y-4">
            <h2 className="font-semibold text-crm-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-crm-purple" /> Location
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-crm-gray mb-1">Continent</label>
                <select required value={form.continent} onChange={(e) => setForm({ ...form, continent: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-crm-white">
                  <option value="">Select</option>
                  {CONTINENTS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-crm-gray mb-1">Country</label>
                <input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-crm-white" />
              </div>
              <div>
                <label className="block text-sm text-crm-gray mb-1">City</label>
                <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-crm-white" />
              </div>
              <div>
                <label className="block text-sm text-crm-gray mb-1">Village / area (optional)</label>
                <input value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-crm-white" />
              </div>
            </div>
          </GlassCard>

          <GlassCard hover={false} className="p-5 space-y-4">
            <h2 className="font-semibold text-crm-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-crm-purple" /> Ministry Interests
            </h2>
            <p className="text-sm text-crm-gray">Select ministries you serve in or want to join.</p>
            <div className="flex flex-wrap gap-2">
              {MINISTRIES.map((m) => {
                const selected = form.ministry_interests.includes(m.name)
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => toggleMinistry(m.name)}
                    className={`px-3 py-2 rounded-xl text-sm border transition-colors ${
                      selected
                        ? 'bg-crm-purple text-white border-crm-purple'
                        : 'bg-slate-50 text-crm-gray-light border-slate-200 hover:border-crm-purple/40'
                    }`}
                  >
                    {selected && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {m.name}
                  </button>
                )
              })}
            </div>
          </GlassCard>

          <button type="submit" disabled={saving} className="w-full shield-button py-3 flex items-center justify-center gap-2 disabled:opacity-60">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>

        <form onSubmit={changePassword} className="mt-8">
          <GlassCard hover={false} className="p-5 space-y-4">
            <h2 className="font-semibold text-crm-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-crm-purple" /> Change Password
            </h2>
            <input type="password" required placeholder="Current password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-crm-white" />
            <input type="password" required placeholder="New password (min 6 characters)" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-crm-white" />
            <input type="password" required placeholder="Confirm new password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-crm-white" />
            <button type="submit" className="w-full py-3 rounded-xl border border-slate-200 text-crm-white font-semibold hover:bg-slate-50">
              Update Password
            </button>
          </GlassCard>
        </form>
      </div>
      <Footer />
    </div>
  )
}
