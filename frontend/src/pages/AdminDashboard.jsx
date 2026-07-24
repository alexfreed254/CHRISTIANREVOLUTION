import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Radio, Library, DollarSign, Heart,
  Plus, Trash2, Save, RefreshCw, Shield, Search, Settings, BookMarked, Pencil, X
} from 'lucide-react'
import SpiritualMaterialsAdmin from '../components/admin/SpiritualMaterialsAdmin'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import useLiveStats from '../hooks/useLiveStats'
import PayPalLogo from '../components/common/PayPalLogo'
import MpesaLogo from '../components/common/MpesaLogo'
import StripeLogo from '../components/common/StripeLogo'

const TABS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Members', icon: Users },
  { id: 'spiritual', label: 'Daily Materials', icon: BookMarked, superOnly: true },
  { id: 'media', label: 'Sermons & Media', icon: Library },
  { id: 'streams', label: 'Live & Events', icon: Radio },
  { id: 'prayers', label: 'Prayer', icon: Heart },
  { id: 'giving', label: 'Donations', icon: DollarSign },
  { id: 'payments', label: 'Settings', icon: Settings, superOnly: true },
]

const ROLES = ['member', 'volunteer', 'leader', 'admin', 'super_admin']

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth()
  const [tab, setTab] = useState('overview')
  const { stats: liveStats, refresh: refreshLiveStats } = useLiveStats({ pollMs: 10000 })
  const [stats, setStats] = useState(null)
  const [members, setMembers] = useState([])
  const [streams, setStreams] = useState([])
  const [media, setMedia] = useState([])
  const [giving, setGiving] = useState([])
  const [givingTotal, setGivingTotal] = useState(0)
  const [prayers, setPrayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')

  const [streamForm, setStreamForm] = useState({
    title: '', description: '', stream_url: '', thumbnail_url: '', speaker: '', status: 'scheduled', category: 'service'
  })
  const [mediaForm, setMediaForm] = useState({
    title: '', description: '', video_url: '', audio_url: '', thumbnail_url: '', speaker: '', duration: 3600, bible_reference: ''
  })
  const [editingMediaId, setEditingMediaId] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    paypal_email: '',
    paypal_client_id: '',
    mpesa_till_number: '',
    mpesa_shortcode: '',
    mpesa_passkey: '',
    mpesa_consumer_key: '',
    mpesa_consumer_secret: '',
    mpesa_callback_url: '',
    stripe_publishable_key: '',
    stripe_account_id: '',
    stripe_display_name: 'Christ Revolution Movement',
    stripe_enabled: true,
  })
  const [paymentMeta, setPaymentMeta] = useState(null)

  const isAdmin = user && ['admin', 'super_admin'].includes(user.role)
  const isSuperAdmin = user?.role === 'super_admin'
  const visibleTabs = TABS.filter((t) => !t.superOnly || isSuperAdmin)

  useEffect(() => {
    if (isAdmin && token) loadTab(tab)
  }, [tab, isAdmin, token])

  // Keep overview cards in sync with socket broadcasts
  useEffect(() => {
    if (tab === 'overview' && liveStats) {
      setStats((prev) => ({ ...(prev || {}), ...liveStats }))
    }
  }, [liveStats, tab])

  const loadTab = async (id) => {
    setLoading(true)
    try {
      if (id === 'overview') {
        const res = await axios.get('/api/admin/stats', authHeaders(token))
        setStats({ ...res.data, ...liveStats })
        refreshLiveStats()
      } else if (id === 'users') {
        const res = await axios.get('/api/admin/members', { ...authHeaders(token), params: { q: memberQuery } })
        setMembers(res.data.members || [])
      } else if (id === 'streams') {
        const res = await axios.get('/api/admin/streams', authHeaders(token))
        setStreams(res.data.streams || [])
      } else if (id === 'media') {
        const res = await axios.get('/api/admin/media', authHeaders(token))
        setMedia(res.data.media || [])
      } else if (id === 'giving') {
        const res = await axios.get('/api/admin/giving', authHeaders(token))
        setGiving(res.data.giving || [])
        setGivingTotal(res.data.total_amount || 0)
      } else if (id === 'payments') {
        if (!isSuperAdmin) {
          toast.error('Only superadmin can manage payment settings')
          setLoading(false)
          return
        }
        const res = await axios.get('/api/admin/payment-settings', authHeaders(token))
        setPaymentMeta(res.data)
        setPaymentForm({
          paypal_email: res.data.paypal_email || '',
          paypal_client_id: res.data.paypal_client_id || '',
          mpesa_till_number: res.data.mpesa_till_number || '',
          mpesa_shortcode: res.data.mpesa_shortcode || '',
          mpesa_passkey: '',
          mpesa_consumer_key: '',
          mpesa_consumer_secret: '',
          mpesa_callback_url: res.data.mpesa_callback_url || '',
          stripe_publishable_key: res.data.stripe_publishable_key || '',
          stripe_account_id: res.data.stripe_account_id || '',
          stripe_display_name: res.data.stripe_display_name || 'Christ Revolution Movement',
          stripe_enabled: res.data.stripe_enabled !== false,
        })
      } else if (id === 'prayers') {
        const res = await axios.get('/api/admin/prayers', authHeaders(token))
        setPrayers(res.data.prayers || [])
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (id, role) => {
    try {
      await axios.patch(`/api/admin/members/${id}`, { role }, authHeaders(token))
      toast.success('Role updated')
      loadTab('users')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
    }
  }

  const deleteMember = async (id) => {
    if (!confirm('Delete this member?')) return
    try {
      await axios.delete(`/api/admin/members/${id}`, authHeaders(token))
      toast.success('Member deleted')
      loadTab('users')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed')
    }
  }

  const createStream = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/admin/streams', streamForm, authHeaders(token))
      toast.success('Stream created')
      setStreamForm({ title: '', description: '', stream_url: '', thumbnail_url: '', speaker: '', status: 'scheduled', category: 'service' })
      loadTab('streams')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create stream')
    }
  }

  const setStreamStatus = async (id, status) => {
    try {
      await axios.patch(`/api/admin/streams/${id}`, { status }, authHeaders(token))
      toast.success(`Stream marked ${status}`)
      loadTab('streams')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
    }
  }

  const deleteStream = async (id) => {
    if (!confirm('Delete this stream?')) return
    try {
      await axios.delete(`/api/admin/streams/${id}`, authHeaders(token))
      toast.success('Stream deleted')
      loadTab('streams')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed')
    }
  }

  const resetMediaForm = () => {
    setMediaForm({ title: '', description: '', video_url: '', audio_url: '', thumbnail_url: '', speaker: '', duration: 3600, bible_reference: '' })
    setEditingMediaId(null)
  }

  const startEditMedia = (item) => {
    setEditingMediaId(item.id)
    setMediaForm({
      title: item.title || '',
      description: item.description || '',
      video_url: item.video_url || item.url || '',
      audio_url: item.audio_url || '',
      thumbnail_url: item.thumbnail_url || '',
      speaker: item.speaker || '',
      duration: item.duration || item.duration_seconds || 3600,
      bible_reference: item.bible_reference || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveMedia = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...mediaForm,
        duration: Number(mediaForm.duration) || 0,
        topics: mediaForm.bible_reference ? ['Teaching'] : [],
      }
      if (editingMediaId) {
        await axios.patch(`/api/admin/media/${editingMediaId}`, payload, authHeaders(token))
        toast.success('Sermon updated')
      } else {
        await axios.post('/api/admin/media', payload, authHeaders(token))
        toast.success('Media added — it will appear in the library')
      }
      resetMediaForm()
      loadTab('media')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save media')
    }
  }

  const deleteMedia = async (id) => {
    if (!confirm('Delete this sermon/media item permanently?')) return
    try {
      await axios.delete(`/api/admin/media/${id}`, authHeaders(token))
      if (editingMediaId === id) resetMediaForm()
      toast.success('Media deleted')
      loadTab('media')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed')
    }
  }

  const deletePrayer = async (id) => {
    if (!confirm('Delete this prayer request?')) return
    try {
      await axios.delete(`/api/admin/prayers/${id}`, authHeaders(token))
      toast.success('Prayer deleted')
      loadTab('prayers')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed')
    }
  }

  const savePaymentSettings = async (e) => {
    e.preventDefault()
    if (!isSuperAdmin) return
    try {
      const payload = {
        paypal_email: paymentForm.paypal_email,
        paypal_client_id: paymentForm.paypal_client_id,
        mpesa_till_number: paymentForm.mpesa_till_number,
        mpesa_shortcode: paymentForm.mpesa_shortcode,
        mpesa_callback_url: paymentForm.mpesa_callback_url,
        stripe_publishable_key: paymentForm.stripe_publishable_key,
        stripe_account_id: paymentForm.stripe_account_id,
        stripe_display_name: paymentForm.stripe_display_name,
        stripe_enabled: paymentForm.stripe_enabled,
      }
      // Only send secrets when superadmin typed a new value (blank = leave unchanged)
      if (paymentForm.mpesa_passkey.trim()) payload.mpesa_passkey = paymentForm.mpesa_passkey.trim()
      if (paymentForm.mpesa_consumer_key.trim()) payload.mpesa_consumer_key = paymentForm.mpesa_consumer_key.trim()
      if (paymentForm.mpesa_consumer_secret.trim()) payload.mpesa_consumer_secret = paymentForm.mpesa_consumer_secret.trim()

      const res = await axios.put('/api/admin/payment-settings', payload, authHeaders(token))
      setPaymentMeta(res.data.settings)
      setPaymentForm((prev) => ({
        ...prev,
        paypal_email: res.data.settings.paypal_email || '',
        paypal_client_id: res.data.settings.paypal_client_id || '',
        mpesa_till_number: res.data.settings.mpesa_till_number || '',
        mpesa_shortcode: res.data.settings.mpesa_shortcode || '',
        mpesa_callback_url: res.data.settings.mpesa_callback_url || '',
        mpesa_passkey: '',
        mpesa_consumer_key: '',
        mpesa_consumer_secret: '',
      }))
      toast.success('Payment settings saved')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save payment settings')
    }
  }

  const clearPaypalEmail = async () => {
    if (!confirm('Remove the PayPal receiving email?')) return
    try {
      const res = await axios.put('/api/admin/payment-settings', { paypal_email: '' }, authHeaders(token))
      setPaymentMeta(res.data.settings)
      setPaymentForm((prev) => ({ ...prev, paypal_email: '' }))
      toast.success('PayPal email removed')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to clear PayPal email')
    }
  }

  const clearTill = async () => {
    if (!confirm('Remove the M-Pesa Till / number?')) return
    try {
      const res = await axios.put('/api/admin/payment-settings', { mpesa_till_number: '', mpesa_shortcode: '' }, authHeaders(token))
      setPaymentMeta(res.data.settings)
      setPaymentForm((prev) => ({ ...prev, mpesa_till_number: '', mpesa_shortcode: '' }))
      toast.success('M-Pesa Till cleared')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to clear Till')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-crm-purple/30 border-t-crm-purple rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) {
    return (
      <div className="min-h-screen px-4 flex flex-col items-center justify-center text-center">
        <Shield className="w-12 h-12 text-crm-purple mb-4" />
        <h1 className="text-2xl font-bold text-crm-white mb-2">Admin access required</h1>
        <p className="text-crm-gray mb-6 max-w-md">
          Your account role is <span className="text-crm-purple">{user.role || 'member'}</span>.
          Ask a superadmin to promote you, or set SUPERADMIN_EMAIL and log in with that email.
        </p>
        <Link to="/portal" className="text-crm-purple hover:underline">Back to portal</Link>
      </div>
    )
  }

  return (
    <div className="page-shell safe-bottom">
      <div className="page-container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-crm-white">Church Admin</h1>
            <p className="text-sm sm:text-base text-crm-gray">Members, content, events, prayer, and donations</p>
          </div>
          <button onClick={() => loadTab(tab)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 text-crm-gray-light hover:text-crm-purple-dark">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="scroll-tabs mb-4 sm:mb-6">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm ${
                tab === t.id ? 'bg-crm-purple/20 text-crm-purple border border-crm-purple/30' : 'bg-slate-100 text-crm-gray-light border border-transparent hover:bg-slate-200'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Members', stats.members],
              ['Online now', stats.online_now],
              ['Watching now', stats.watching_now],
              ['Live streams', stats.live_now],
              ['Media items', stats.media],
              ['Reactions', stats.reactions],
              ['Donations', `$${Number(stats.giving_total || 0).toLocaleString()}`],
              ['Donation records', stats.giving_count],
              ['Prayer requests', stats.prayers],
              ['Nations', stats.countries],
              ['Streams', stats.streams],
              ['Souls reached', stats.souls ?? stats.souls_reached],
            ].map(([label, value]) => (
              <div key={label} className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-crm-gray text-sm mb-1">{label}</p>
                <p className="text-2xl font-bold text-crm-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => { e.preventDefault(); loadTab('users') }}
              className="flex gap-2 max-w-md"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-crm-gray" />
                <input
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  placeholder="Search members..."
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-crm-white"
                />
              </div>
              <button className="px-4 py-2 rounded-xl bg-crm-purple text-white font-semibold">Search</button>
            </form>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-crm-gray">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Location</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-t border-white/5">
                      <td className="p-3 text-crm-white">
                        <div className="font-medium">{m.full_name}</div>
                        <div className="text-xs text-crm-gray">@{m.username} · {m.unique_id}</div>
                      </td>
                      <td className="p-3 text-crm-gray-light">{m.email}</td>
                      <td className="p-3 text-crm-gray">{m.city}, {m.country}</td>
                      <td className="p-3">
                        <select
                          value={m.role || 'member'}
                          onChange={(e) => updateRole(m.id, e.target.value)}
                          className="bg-crm-dark border border-slate-200 rounded-lg px-2 py-1 text-crm-white"
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <button onClick={() => deleteMember(m.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'streams' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <form onSubmit={createStream} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h2 className="text-lg font-semibold text-crm-white flex items-center gap-2"><Plus className="w-5 h-5" /> Add / Go Live</h2>
              {['title', 'speaker', 'stream_url', 'thumbnail_url'].map((field) => (
                <input
                  key={field}
                  required={field === 'title' || field === 'stream_url'}
                  placeholder={field.replace('_', ' ')}
                  value={streamForm[field]}
                  onChange={(e) => setStreamForm({ ...streamForm, [field]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-crm-white"
                />
              ))}
              <textarea
                placeholder="description"
                value={streamForm.description}
                onChange={(e) => setStreamForm({ ...streamForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-crm-white"
                rows={3}
              />
              <select
                value={streamForm.status}
                onChange={(e) => setStreamForm({ ...streamForm, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-crm-white"
              >
                <option value="scheduled">scheduled</option>
                <option value="live">live</option>
                <option value="ended">ended</option>
              </select>
              <button type="submit" className="w-full py-3 rounded-xl bg-crm-purple text-white font-bold flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Stream
              </button>
            </form>

            <div className="space-y-3">
              {streams.map((s) => (
                <div key={s.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-crm-white">{s.title}</h3>
                      <p className="text-xs text-crm-gray mt-1">{s.speaker} · <span className="text-crm-purple">{s.status}</span></p>
                      <p className="text-xs text-crm-gray truncate max-w-sm mt-1">{s.stream_url}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => setStreamStatus(s.id, 'live')} className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300">Go Live</button>
                      <button onClick={() => setStreamStatus(s.id, 'ended')} className="text-xs px-2 py-1 rounded bg-slate-200 text-crm-gray-light">End</button>
                      <button onClick={() => deleteStream(s.id)} className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400">Delete</button>
                    </div>
                  </div>
                  <Link to={`/live/${s.id}`} className="text-xs text-crm-purple hover:underline mt-2 inline-block">Open public page →</Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'media' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <form onSubmit={saveMedia} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-crm-white flex items-center gap-2">
                  {editingMediaId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingMediaId ? 'Edit Sermon / Media' : 'Add Sermon / Media'}
                </h2>
                {editingMediaId && (
                  <button type="button" onClick={resetMediaForm} className="p-2 rounded-lg hover:bg-slate-200 text-crm-gray">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {['title', 'speaker', 'video_url', 'audio_url', 'thumbnail_url', 'bible_reference'].map((field) => (
                <input
                  key={field}
                  required={field === 'title' || field === 'video_url'}
                  placeholder={field.replace('_', ' ')}
                  value={mediaForm[field]}
                  onChange={(e) => setMediaForm({ ...mediaForm, [field]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-crm-white"
                />
              ))}
              <input
                type="number"
                placeholder="duration (seconds)"
                value={mediaForm.duration}
                onChange={(e) => setMediaForm({ ...mediaForm, duration: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-crm-white"
              />
              <textarea
                placeholder="description"
                value={mediaForm.description}
                onChange={(e) => setMediaForm({ ...mediaForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-crm-white"
                rows={3}
              />
              <button type="submit" className="w-full py-3 rounded-xl bg-crm-purple text-white font-bold">
                {editingMediaId ? 'Save Changes' : 'Add to Library'}
              </button>
            </form>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {media.map((m) => (
                <div key={m.id} className={`p-4 rounded-2xl border flex gap-3 ${editingMediaId === m.id ? 'bg-crm-purple/5 border-crm-purple/40' : 'bg-slate-50 border-slate-200'}`}>
                  {m.thumbnail_url && (
                    <img src={m.thumbnail_url} alt="" className="w-24 h-16 object-cover rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-crm-white truncate">{m.title}</h3>
                    <p className="text-xs text-crm-gray">{m.speaker}</p>
                    <Link to={`/sermons/${m.id}`} className="text-xs text-crm-purple hover:underline">Play →</Link>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button type="button" onClick={() => startEditMedia(m)} className="p-2 text-crm-purple hover:bg-crm-purple/10 rounded-lg" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => deleteMedia(m.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'giving' && (
          <div>
            <div className="mb-4 p-5 rounded-2xl bg-crm-purple/10 border border-crm-purple/20">
              <p className="text-crm-gray text-sm">Total recorded giving</p>
              <p className="text-3xl font-bold text-crm-white">${Number(givingTotal).toLocaleString()}</p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-crm-gray">
                  <tr>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Method</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Txn / Receipt</th>
                    <th className="text-left p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {giving.map((g) => (
                    <tr key={g.id} className="border-t border-white/5">
                      <td className="p-3 text-crm-white font-medium">{g.currency} {g.amount}</td>
                      <td className="p-3 text-crm-gray-light">{g.category}</td>
                      <td className="p-3 text-crm-gray">{g.payment_method}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          g.transaction_status === 'completed' ? 'bg-green-500/20 text-green-400'
                            : g.transaction_status === 'failed' ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {g.transaction_status || '—'}
                        </span>
                      </td>
                      <td className="p-3 text-crm-gray font-mono text-xs">
                        {g.transaction_id || g.receipt_id}
                      </td>
                      <td className="p-3 text-crm-gray">{g.created_at ? new Date(g.created_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                  {giving.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-crm-gray">No donations recorded yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'spiritual' && isSuperAdmin && (
          <SpiritualMaterialsAdmin token={token} />
        )}

        {tab === 'payments' && isSuperAdmin && (
          <form onSubmit={savePaymentSettings} className="space-y-8 max-w-3xl">
            <div className="p-6 rounded-2xl bg-slate-50 border border-[#635BFF]/30 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <StripeLogo className="h-7" />
                <h2 className="text-lg font-bold text-crm-white">Stripe (cards · Apple Pay · Google Pay)</h2>
              </div>
              <p className="text-sm text-crm-gray">
                Set where Stripe donations are collected. Add your <strong className="text-crm-white">Connected Account ID</strong> (acct_…)
                so funds go directly to the church Stripe account. Server must have <code className="text-crm-purple">STRIPE_SECRET_KEY</code> set on Render.
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentForm.stripe_enabled}
                  onChange={(e) => setPaymentForm({ ...paymentForm, stripe_enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-200 text-crm-purple"
                />
                <span className="text-sm text-crm-gray-light">Enable Stripe on Support and Donations</span>
              </label>
              <label className="block text-sm text-crm-gray-light">Church / ministry name (shown on checkout)</label>
              <input
                value={paymentForm.stripe_display_name}
                onChange={(e) => setPaymentForm({ ...paymentForm, stripe_display_name: e.target.value })}
                placeholder="Christ Revolution Movement"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white"
              />
              <label className="block text-sm text-crm-gray-light">Stripe Publishable Key (pk_live_… or pk_test_…)</label>
              <input
                value={paymentForm.stripe_publishable_key}
                onChange={(e) => setPaymentForm({ ...paymentForm, stripe_publishable_key: e.target.value })}
                placeholder="pk_live_..."
                className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white font-mono text-sm"
              />
              <label className="block text-sm text-crm-gray-light">Stripe Account ID — where money is collected (acct_…)</label>
              <div className="flex gap-2">
                <input
                  value={paymentForm.stripe_account_id}
                  onChange={(e) => setPaymentForm({ ...paymentForm, stripe_account_id: e.target.value })}
                  placeholder="acct_1234567890"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('Remove Stripe account ID?')) return
                    const res = await axios.put('/api/admin/payment-settings', { stripe_account_id: '' }, authHeaders(token))
                    setPaymentMeta(res.data.settings)
                    setPaymentForm((p) => ({ ...p, stripe_account_id: '' }))
                    toast.success('Stripe account cleared')
                  }}
                  className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 text-sm"
                >
                  Remove
                </button>
              </div>
              {paymentMeta?.public && (
                <p className="text-xs text-crm-gray">
                  Stripe: {paymentMeta.public.stripe_configured ? 'Ready' : 'Not ready — set STRIPE_SECRET_KEY on server + enable above'}
                </p>
              )}
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <PayPalLogo className="h-7" />
                <h2 className="text-lg font-bold text-crm-white">PayPal (international / cards)</h2>
              </div>
              <p className="text-sm text-crm-gray">
                Add the church PayPal Business email used to receive donations. Optional Client ID enables full Checkout API when
                <code className="mx-1 text-crm-purple">PAYPAL_CLIENT_SECRET</code> is also set on the server.
              </p>
              <label className="block text-sm text-crm-gray-light">PayPal receiving email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={paymentForm.paypal_email}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paypal_email: e.target.value })}
                  placeholder="church@paypal.com"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white"
                />
                <button type="button" onClick={clearPaypalEmail} className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 text-sm">
                  Remove
                </button>
              </div>
              <label className="block text-sm text-crm-gray-light">PayPal Client ID (optional)</label>
              <input
                value={paymentForm.paypal_client_id}
                onChange={(e) => setPaymentForm({ ...paymentForm, paypal_client_id: e.target.value })}
                placeholder="PayPal REST App Client ID"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white font-mono text-sm"
              />
              {paymentMeta?.public && (
                <p className="text-xs text-crm-gray">
                  Status: {paymentMeta.public.paypal_configured ? 'Ready for donations' : 'Not configured'}
                  {' · '}Mode: {paymentMeta.public.paypal_mode}
                </p>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <MpesaLogo className="h-7" />
                <h2 className="text-lg font-bold text-crm-white">M-Pesa (Kenya)</h2>
              </div>
              <p className="text-sm text-crm-gray">
                Set the Till / Buy Goods number shown to donors. For automatic STK Push, also add Daraja shortcode, passkey, and consumer credentials (or set them as Render env vars).
              </p>
              <label className="block text-sm text-crm-gray-light">Till / M-Pesa number</label>
              <div className="flex gap-2">
                <input
                  value={paymentForm.mpesa_till_number}
                  onChange={(e) => setPaymentForm({ ...paymentForm, mpesa_till_number: e.target.value })}
                  placeholder="e.g. 123456"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white font-mono tracking-wider"
                />
                <button type="button" onClick={clearTill} className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 text-sm">
                  Remove
                </button>
              </div>
              <label className="block text-sm text-crm-gray-light">Business shortcode (Daraja)</label>
              <input
                value={paymentForm.mpesa_shortcode}
                onChange={(e) => setPaymentForm({ ...paymentForm, mpesa_shortcode: e.target.value })}
                placeholder="Same as Till, or Paybill shortcode"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white font-mono"
              />
              <label className="block text-sm text-crm-gray-light">STK Callback URL</label>
              <input
                value={paymentForm.mpesa_callback_url}
                onChange={(e) => setPaymentForm({ ...paymentForm, mpesa_callback_url: e.target.value })}
                placeholder="https://your-app.onrender.com/api/payments/mpesa/callback"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white text-sm"
              />
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs text-crm-gray mb-1">
                    Consumer Key {paymentMeta?.mpesa_consumer_key_set ? `(set: ${paymentMeta.mpesa_consumer_key_masked})` : ''}
                  </label>
                  <input
                    type="password"
                    value={paymentForm.mpesa_consumer_key}
                    onChange={(e) => setPaymentForm({ ...paymentForm, mpesa_consumer_key: e.target.value })}
                    placeholder="Leave blank to keep existing"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-crm-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-crm-gray mb-1">
                    Consumer Secret {paymentMeta?.mpesa_consumer_secret_set ? '(set)' : ''}
                  </label>
                  <input
                    type="password"
                    value={paymentForm.mpesa_consumer_secret}
                    onChange={(e) => setPaymentForm({ ...paymentForm, mpesa_consumer_secret: e.target.value })}
                    placeholder="Leave blank to keep existing"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-crm-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-crm-gray mb-1">
                  Passkey {paymentMeta?.mpesa_passkey_set ? `(set: ${paymentMeta.mpesa_passkey_masked})` : ''}
                </label>
                <input
                  type="password"
                  value={paymentForm.mpesa_passkey}
                  onChange={(e) => setPaymentForm({ ...paymentForm, mpesa_passkey: e.target.value })}
                  placeholder="Leave blank to keep existing"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-crm-white text-sm"
                />
              </div>
              {paymentMeta?.public && (
                <p className="text-xs text-crm-gray">
                  STK: {paymentMeta.public.mpesa_stk_configured ? 'Ready' : 'Not ready'} ·
                  Manual Till: {paymentMeta.public.mpesa_manual_available ? 'Available' : 'No'} ·
                  Env: {paymentMeta.public.mpesa_env}
                </p>
              )}
            </div>

            <button type="submit" className="inline-flex items-center gap-2 shield-button px-6 py-3">
              <Save className="w-4 h-4" /> Save payment settings
            </button>
          </form>
        )}

        {tab === 'prayers' && (
          <div className="space-y-3">
            {prayers.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between gap-4">
                <div>
                  <p className="text-crm-white">{p.content}</p>
                  <p className="text-xs text-crm-gray mt-2">
                    {p.is_public ? 'Public' : 'Private'} · {p.pray_count || 0} prayers · {p.created_at ? new Date(p.created_at).toLocaleString() : ''}
                  </p>
                </div>
                <button onClick={() => deletePrayer(p.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg h-fit">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {prayers.length === 0 && <p className="text-crm-gray">No prayer requests yet</p>}
          </div>
        )}
      </div>
    </div>
  )
}
