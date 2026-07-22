import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, Search, Globe, Headphones, Video, FileText, GraduationCap,
  Sun, ChevronRight, Bookmark
} from 'lucide-react'
import axios from 'axios'
import GlassCard from '../components/common/GlassCard'
import Footer from '../components/common/Footer'
import { useAuth } from '../context/AuthContext'

const SECTION_ICONS = {
  courses: GraduationCap,
  ebooks: BookOpen,
  pdfs: FileText,
  videos: Video,
  audios: Headphones,
  podcasts: Headphones,
  bible_studies: BookOpen,
  devotionals: Sun,
  training: GraduationCap,
}

const TYPE_ICONS = {
  course: GraduationCap,
  ebook: BookOpen,
  pdf: FileText,
  video: Video,
  audio: Headphones,
  podcast: Headphones,
  daily_devotional: Sun,
  daily_christ_bite: Sun,
  bible_study: BookOpen,
  sermon_note: FileText,
  training_material: GraduationCap,
}

export default function DiscipleshipLibrary() {
  const { user, token } = useAuth()
  const [sections, setSections] = useState([])
  const [materials, setMaterials] = useState([])
  const [today, setToday] = useState(null)
  const [activeSection, setActiveSection] = useState('')
  const [query, setQuery] = useState('')
  const [lang, setLang] = useState(user?.preferred_language || 'en')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLibrary()
  }, [activeSection, query, lang, user])

  const loadLibrary = async () => {
    setLoading(true)
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const [metaRes, libRes, todayRes] = await Promise.all([
        axios.get('/api/discipleship/meta'),
        axios.get('/api/discipleship/library', {
          headers,
          params: { section: activeSection || undefined, q: query || undefined, lang },
        }),
        axios.get('/api/discipleship/today', { headers, params: { lang } }),
      ])
      setSections(metaRes.data.sections || [])
      setMaterials(libRes.data.materials || [])
      setToday(todayRes.data.material)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell safe-bottom">
      <div className="page-container max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-crm-white mb-3">Discipleship Library</h1>
          <p className="text-sm sm:text-base text-crm-gray-light max-w-2xl mx-auto px-2">
            Daily spiritual materials, courses, devotionals, Bible studies, and training resources for every stage of your journey.
          </p>
        </motion.div>

        {today && (
          <GlassCard className="p-4 sm:p-6 mb-8 sm:mb-10 border-crm-purple/30 bg-gradient-to-br from-crm-purple/10 to-transparent">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
              {today.thumbnail_url && (
                <img src={today.thumbnail_url} alt="" className="w-full lg:w-48 aspect-video object-cover rounded-xl shrink-0" />
              )}
              <div className="flex-1 min-w-0 w-full">
                <p className="text-xs uppercase tracking-widest text-crm-purple mb-2">Today&apos;s Spiritual Material</p>
                <h2 className="text-lg sm:text-2xl font-bold text-crm-white mb-2">{today.title}</h2>
                <p className="text-sm text-crm-gray-light mb-4">{today.description}</p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  <Link to={`/discipleship/${today.id}?lang=${lang}`} className="shield-button text-center w-full sm:w-auto">Read</Link>
                  {today.audio_url && (
                    <a href={today.audio_url} target="_blank" rel="noreferrer" className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-white/20 text-sm text-crm-white hover:bg-white/5">Listen</a>
                  )}
                  {today.video_url && (
                    <Link to={`/discipleship/${today.id}?lang=${lang}`} className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-white/20 text-sm text-crm-white hover:bg-white/5">Watch</Link>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-crm-gray" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search materials, speakers, topics..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-crm-white"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Globe className="w-4 h-4 text-crm-gray shrink-0" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full sm:w-auto min-w-[140px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-crm-white"
            >
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="pt">Portuguese</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
        </div>

        <div className="scroll-tabs mb-6 sm:mb-8 flex-nowrap sm:flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSection('')}
            className={`shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
              !activeSection ? 'bg-crm-purple text-crm-black' : 'bg-white/5 text-crm-gray-light hover:bg-white/10'
            }`}
          >
            All
          </button>
          {sections.map((sec) => {
            const Icon = SECTION_ICONS[sec.id] || BookOpen
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`shrink-0 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                  activeSection === sec.id ? 'bg-crm-purple text-crm-black' : 'bg-white/5 text-crm-gray-light hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {sec.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-crm-purple/30 border-t-crm-purple rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {materials.map((m, i) => {
              const Icon = TYPE_ICONS[m.material_type] || BookOpen
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Link to={`/discipleship/${m.id}?lang=${lang}`} className="block group">
                    <GlassCard className="overflow-hidden h-full hover:border-crm-purple/30 transition-all">
                      <div className="relative aspect-video bg-crm-dark">
                        {m.thumbnail_url ? (
                          <img src={m.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-crm-purple/10">
                            <Icon className="w-12 h-12 text-crm-purple/50" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase bg-crm-purple/90 text-crm-black rounded">
                          {m.material_type_label || m.material_type}
                        </span>
                        {m.visibility === 'members' && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] bg-black/70 text-crm-white rounded flex items-center gap-1">
                            <Bookmark className="w-3 h-3" /> Members
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-crm-white line-clamp-2 group-hover:text-crm-purple transition-colors">{m.title}</h3>
                        <p className="text-xs text-crm-gray mt-1">{m.speaker || m.ministry}</p>
                        <p className="text-xs text-crm-gray mt-2 line-clamp-2">{m.description}</p>
                        <div className="flex items-center justify-between mt-3 text-xs text-crm-gray">
                          <span className="uppercase">{m.language}</span>
                          <ChevronRight className="w-4 h-4 text-crm-purple opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}

        {!loading && materials.length === 0 && (
          <p className="text-center text-crm-gray py-16">No materials found in this section.</p>
        )}
      </div>
      <Footer />
    </div>
  )
}
