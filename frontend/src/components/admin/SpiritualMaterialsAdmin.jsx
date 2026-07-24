import { useState, useEffect } from 'react'
import {
  Plus, Trash2, Save, RefreshCw, CheckCircle, Clock, Archive, Globe
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const MATERIAL_TYPES = [
  { id: 'daily_christ_bite', label: 'Daily Christ Bite' },
  { id: 'daily_devotional', label: 'Daily Devotional' },
  { id: 'bible_study', label: 'Bible Study' },
  { id: 'sermon_note', label: 'Sermon Note' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' },
  { id: 'podcast', label: 'Podcast' },
  { id: 'ebook', label: 'E-book' },
  { id: 'pdf', label: 'PDF' },
  { id: 'course', label: 'Course' },
  { id: 'training_material', label: 'Training Material' },
  { id: 'prayer', label: 'Prayer Material' },
  { id: 'fasting', label: 'Fasting Material' },
  { id: 'bible_reading_plan', label: 'Bible Reading Plan' },
]

const EMPTY_FORM = {
  title: '',
  material_type: 'daily_devotional',
  description: '',
  content: '',
  file_url: '',
  video_url: '',
  audio_url: '',
  thumbnail_url: '',
  language: 'en',
  parent_id: '',
  all_languages: false,
  category: '',
  ministry: '',
  speaker: '',
  bible_reference: '',
  publish_mode: 'immediate',
  publish_at: '',
  available_until: '',
  featured: false,
  visibility: 'public',
}

function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export default function SpiritualMaterialsAdmin({ token }) {
  const [stats, setStats] = useState(null)
  const [materials, setMaterials] = useState([])
  const [platformLanguages, setPlatformLanguages] = useState([{ code: 'en', label: 'English' }])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    axios.get('/api/languages').then((res) => {
      if (res.data.languages?.length) setPlatformLanguages(res.data.languages)
    }).catch(() => {})
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [statsRes, listRes] = await Promise.all([
        axios.get('/api/admin/spiritual-materials/stats', authHeaders(token)),
        axios.get('/api/admin/spiritual-materials', {
          ...authHeaders(token),
          params: filterStatus ? { status: filterStatus } : {},
        }),
      ])
      setStats(statsRes.data)
      setMaterials(listRes.data.materials || [])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load spiritual materials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) load()
  }, [token, filterStatus])

  const createMaterial = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        parent_id: form.parent_id || null,
        publish_at: form.publish_mode === 'schedule' && form.publish_at
          ? new Date(form.publish_at).toISOString()
          : undefined,
        available_until: form.available_until ? new Date(form.available_until).toISOString() : null,
      }
      await axios.post('/api/admin/spiritual-materials', payload, authHeaders(token))
      toast.success('Material created')
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Create failed')
    }
  }

  const publishNow = async (id) => {
    try {
      await axios.post(`/api/admin/spiritual-materials/${id}/publish`, {}, authHeaders(token))
      toast.success('Published')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Publish failed')
    }
  }

  const archiveMaterial = async (id) => {
    try {
      await axios.post(`/api/admin/spiritual-materials/${id}/archive`, {}, authHeaders(token))
      toast.success('Archived')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Archive failed')
    }
  }

  const deleteMaterial = async (id) => {
    if (!confirm('Delete this material permanently?')) return
    try {
      await axios.delete(`/api/admin/spiritual-materials/${id}`, authHeaders(token))
      toast.success('Deleted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed')
    }
  }

  const statusBadge = (status) => {
    const colors = {
      published: 'bg-green-500/20 text-green-300',
      scheduled: 'bg-yellow-500/20 text-yellow-300',
      draft: 'bg-slate-200 text-crm-gray-light',
      archived: 'bg-red-500/20 text-red-300',
    }
    return (
      <span className={`px-2 py-0.5 rounded text-xs uppercase ${colors[status] || colors.draft}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-crm-white">Daily Spiritual Materials</h2>
          <p className="text-sm text-crm-gray">Upload, schedule, translate, and publish official discipleship content.</p>
        </div>
        <button type="button" onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-crm-gray-light">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Today's Material", value: stats.today_material?.title || 'None', ok: !!stats.today_material },
            { label: "Tomorrow's Material", value: stats.tomorrow_material?.title || 'None', ok: !!stats.tomorrow_material },
            { label: 'Draft Materials', value: stats.draft_count },
            { label: 'Published', value: stats.published_count },
            { label: 'Awaiting Translation', value: stats.awaiting_translation_count },
            { label: 'Most Viewed', value: stats.most_viewed?.title || '—' },
            { label: 'Most Downloaded', value: stats.most_downloaded?.title || '—' },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-crm-gray uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-crm-white line-clamp-2 flex items-center gap-2">
                {item.ok !== undefined && (item.ok ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> : <Clock className="w-4 h-4 text-yellow-400 shrink-0" />)}
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={createMaterial} className="p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <h3 className="text-lg font-semibold text-crm-white flex items-center gap-2">
          <Plus className="w-5 h-5" /> Create New Material
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Understanding the Power of Prayer"
              className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white"
            />
          </div>
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">Material Type</label>
            <select
              value={form.material_type}
              onChange={(e) => setForm({ ...form, material_type: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white"
            >
              {MATERIAL_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-crm-gray-light mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white"
          />
        </div>

        <div>
          <label className="block text-sm text-crm-gray-light mb-1">Main Content (text)</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={6}
            placeholder="Write the devotional, study notes, or lesson content..."
            className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white font-mono text-sm"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">File URL (PDF, EPUB…)</label>
            <input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">Video URL</label>
            <input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white text-sm" />
          </div>
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">Audio URL (MP3, M4A…)</label>
            <input value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white text-sm" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">Language</label>
            <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white">
              {platformLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}{lang.native && lang.native !== lang.label ? ` (${lang.native})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">Category</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Prayer, Faith…" className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white" />
          </div>
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">Ministry</label>
            <input value={form.ministry} onChange={(e) => setForm({ ...form, ministry: e.target.value })} placeholder="Daily Christ Bites" className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white" />
          </div>
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">Speaker</label>
            <input value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">Translation of (parent ID)</label>
            <input value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} placeholder="Leave blank for base material" className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">Bible Reference</label>
            <input value={form.bible_reference} onChange={(e) => setForm({ ...form, bible_reference: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">Publication</label>
            <select value={form.publish_mode} onChange={(e) => setForm({ ...form, publish_mode: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white">
              <option value="immediate">Publish immediately</option>
              <option value="schedule">Schedule for later</option>
              <option value="draft">Save as draft</option>
            </select>
          </div>
          {form.publish_mode === 'schedule' && (
            <div>
              <label className="block text-sm text-crm-gray-light mb-1">Publish date & time</label>
              <input type="datetime-local" value={form.publish_at} onChange={(e) => setForm({ ...form, publish_at: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white" />
            </div>
          )}
          <div>
            <label className="block text-sm text-crm-gray-light mb-1">Available until (optional)</label>
            <input type="datetime-local" value={form.available_until} onChange={(e) => setForm({ ...form, available_until: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white" />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-crm-gray-light">
            <input type="checkbox" checked={form.all_languages} onChange={(e) => setForm({ ...form, all_languages: e.target.checked })} className="rounded" />
            <Globe className="w-4 h-4" /> Available in all languages
          </label>
          <label className="flex items-center gap-2 text-sm text-crm-gray-light">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded" />
            Featured
          </label>
          <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-crm-white text-sm">
            <option value="public">Public (guests)</option>
            <option value="members">Members only</option>
          </select>
        </div>

        <button type="submit" className="inline-flex items-center gap-2 shield-button px-6 py-3">
          <Save className="w-4 h-4" /> Create Material
        </button>
      </form>

      <div>
        <div className="scroll-tabs mb-4">
          {['', 'published', 'scheduled', 'draft', 'archived'].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs uppercase ${
                filterStatus === s ? 'bg-crm-purple text-white' : 'bg-slate-100 text-crm-gray-light'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {materials.map((m) => (
            <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {statusBadge(m.status)}
                  <span className="text-xs text-crm-gray uppercase">{m.material_type_label || m.material_type}</span>
                  <span className="text-xs text-crm-gray uppercase">{m.language}</span>
                </div>
                <p className="font-semibold text-crm-white break-words">{m.title}</p>
                <p className="text-xs text-crm-gray mt-1 break-words">
                  {m.speaker || m.ministry || '—'}
                  {m.publish_at && ` · ${new Date(m.publish_at).toLocaleString()}`}
                  {` · ${m.view_count || 0} views · ${m.download_count || 0} downloads`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {m.status !== 'published' && (
                  <button type="button" onClick={() => publishNow(m.id)} className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300">
                    Publish
                  </button>
                )}
                {m.status !== 'archived' && (
                  <button type="button" onClick={() => archiveMaterial(m.id)} className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 flex items-center gap-1">
                    <Archive className="w-3 h-3" /> Archive
                  </button>
                )}
                <button type="button" onClick={() => deleteMaterial(m.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {materials.length === 0 && !loading && (
            <p className="text-crm-gray text-center py-8">No materials yet. Create your first daily devotional above.</p>
          )}
        </div>
      </div>
    </div>
  )
}
