import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Radio, Library, DollarSign, Heart,
  Plus, Trash2, Save, RefreshCw, Shield, Search
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import useLiveStats from '../hooks/useLiveStats'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'streams', label: 'Streams', icon: Radio },
  { id: 'media', label: 'Media', icon: Library },
  { id: 'giving', label: 'Donations', icon: DollarSign },
  { id: 'prayers', label: 'Prayers', icon: Heart },
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

  const isAdmin = user && ['admin', 'super_admin'].includes(user.role)

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

  const createMedia = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...mediaForm,
        duration: Number(mediaForm.duration) || 0,
        topics: mediaForm.bible_reference ? ['Teaching'] : [],
      }
      await axios.post('/api/admin/media', payload, authHeaders(token))
      toast.success('Media added — it will appear in the library')
      setMediaForm({ title: '', description: '', video_url: '', audio_url: '', thumbnail_url: '', speaker: '', duration: 3600, bible_reference: '' })
      loadTab('media')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add media')
    }
  }

  const deleteMedia = async (id) => {
    if (!confirm('Delete this media item?')) return
    try {
      await axios.delete(`/api/admin/media/${id}`, authHeaders(token))
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

  if (authLoading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-crm-purple/30 border-t-crm-purple rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-28 px-4 flex flex-col items-center justify-center text-center">
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
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-crm-white">Superadmin Dashboard</h1>
            <p className="text-crm-gray">Manage users, streams, media, donations, and prayers</p>
          </div>
          <button onClick={() => loadTab(tab)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-crm-gray-light hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-crm-purple/20 text-crm-purple border border-crm-purple/30' : 'bg-white/5 text-crm-gray-light border border-transparent hover:bg-white/10'
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
              <div key={label} className="p-5 rounded-2xl bg-crm-dark/60 border border-white/10">
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
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-crm-white"
                />
              </div>
              <button className="px-4 py-2 rounded-xl bg-crm-purple text-crm-black font-semibold">Search</button>
            </form>
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-crm-gray">
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
                          className="bg-crm-dark border border-white/10 rounded-lg px-2 py-1 text-crm-white"
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
            <form onSubmit={createStream} className="p-6 rounded-2xl bg-crm-dark/60 border border-white/10 space-y-3">
              <h2 className="text-lg font-semibold text-crm-white flex items-center gap-2"><Plus className="w-5 h-5" /> Add / Go Live</h2>
              {['title', 'speaker', 'stream_url', 'thumbnail_url'].map((field) => (
                <input
                  key={field}
                  required={field === 'title' || field === 'stream_url'}
                  placeholder={field.replace('_', ' ')}
                  value={streamForm[field]}
                  onChange={(e) => setStreamForm({ ...streamForm, [field]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-crm-white"
                />
              ))}
              <textarea
                placeholder="description"
                value={streamForm.description}
                onChange={(e) => setStreamForm({ ...streamForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-crm-white"
                rows={3}
              />
              <select
                value={streamForm.status}
                onChange={(e) => setStreamForm({ ...streamForm, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-crm-white"
              >
                <option value="scheduled">scheduled</option>
                <option value="live">live</option>
                <option value="ended">ended</option>
              </select>
              <button type="submit" className="w-full py-3 rounded-xl bg-crm-purple text-crm-black font-bold flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Stream
              </button>
            </form>

            <div className="space-y-3">
              {streams.map((s) => (
                <div key={s.id} className="p-4 rounded-2xl bg-crm-dark/60 border border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-crm-white">{s.title}</h3>
                      <p className="text-xs text-crm-gray mt-1">{s.speaker} · <span className="text-crm-purple">{s.status}</span></p>
                      <p className="text-xs text-crm-gray truncate max-w-sm mt-1">{s.stream_url}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => setStreamStatus(s.id, 'live')} className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300">Go Live</button>
                      <button onClick={() => setStreamStatus(s.id, 'ended')} className="text-xs px-2 py-1 rounded bg-white/10 text-crm-gray-light">End</button>
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
            <form onSubmit={createMedia} className="p-6 rounded-2xl bg-crm-dark/60 border border-white/10 space-y-3">
              <h2 className="text-lg font-semibold text-crm-white flex items-center gap-2"><Plus className="w-5 h-5" /> Add Media</h2>
              {['title', 'speaker', 'video_url', 'audio_url', 'thumbnail_url', 'bible_reference'].map((field) => (
                <input
                  key={field}
                  required={field === 'title' || field === 'video_url'}
                  placeholder={field.replace('_', ' ')}
                  value={mediaForm[field]}
                  onChange={(e) => setMediaForm({ ...mediaForm, [field]: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-crm-white"
                />
              ))}
              <input
                type="number"
                placeholder="duration (seconds)"
                value={mediaForm.duration}
                onChange={(e) => setMediaForm({ ...mediaForm, duration: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-crm-white"
              />
              <textarea
                placeholder="description"
                value={mediaForm.description}
                onChange={(e) => setMediaForm({ ...mediaForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-crm-white"
                rows={3}
              />
              <button type="submit" className="w-full py-3 rounded-xl bg-crm-purple text-crm-black font-bold">Add to Library</button>
            </form>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {media.map((m) => (
                <div key={m.id} className="p-4 rounded-2xl bg-crm-dark/60 border border-white/10 flex gap-3">
                  {m.thumbnail_url && (
                    <img src={m.thumbnail_url} alt="" className="w-24 h-16 object-cover rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-crm-white truncate">{m.title}</h3>
                    <p className="text-xs text-crm-gray">{m.speaker}</p>
                    <Link to={`/media/${m.id}`} className="text-xs text-crm-purple hover:underline">Play →</Link>
                  </div>
                  <button onClick={() => deleteMedia(m.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-crm-gray">
                  <tr>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Method</th>
                    <th className="text-left p-3">Receipt</th>
                    <th className="text-left p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {giving.map((g) => (
                    <tr key={g.id} className="border-t border-white/5">
                      <td className="p-3 text-crm-white font-medium">{g.currency} {g.amount}</td>
                      <td className="p-3 text-crm-gray-light">{g.category}</td>
                      <td className="p-3 text-crm-gray">{g.payment_method}</td>
                      <td className="p-3 text-crm-gray">{g.receipt_id}</td>
                      <td className="p-3 text-crm-gray">{g.created_at ? new Date(g.created_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                  {giving.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-crm-gray">No donations recorded yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'prayers' && (
          <div className="space-y-3">
            {prayers.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-crm-dark/60 border border-white/10 flex justify-between gap-4">
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
