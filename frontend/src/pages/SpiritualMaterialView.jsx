import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactPlayer from 'react-player'
import {
  BookOpen, Headphones, Video, FileText, Download, Share2, CheckCircle,
  Bookmark, Globe, ArrowLeft
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import GlassCard from '../components/common/GlassCard'
import Footer from '../components/common/Footer'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/common/LanguageSelector'

export default function SpiritualMaterialView() {
  const { materialId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, token } = useAuth()
  const { language, setLanguage, t, aiTranslation, languages } = useLanguage()
  const lang = searchParams.get('lang') || language
  const [material, setMaterial] = useState(null)
  const [translations, setTranslations] = useState([])
  const [saved, setSaved] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const urlLang = searchParams.get('lang')
    if (urlLang && urlLang !== language) {
      setLanguage(urlLang)
    }
  }, [])

  useEffect(() => {
    loadMaterial()
  }, [materialId, lang, token])

  useEffect(() => {
    if (language && searchParams.get('lang') !== language) {
      setSearchParams({ lang: language }, { replace: true })
    }
  }, [language])

  const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

  const loadMaterial = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/discipleship/materials/${materialId}`, {
        ...authHeaders,
        params: { lang },
      })
      setMaterial(res.data.material)
      setTranslations(res.data.translations || [])
      setSaved(res.data.saved)
      setCompleted(res.data.completed)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Material not found')
    } finally {
      setLoading(false)
    }
  }

  const changeLang = (code) => {
    setLanguage(code)
    setSearchParams({ lang: code })
  }

  const langLabel = (code) => languages.find((l) => l.code === code)?.label || code

  const handleSave = async () => {
    if (!user) {
      toast.error('Sign in to save materials')
      return
    }
    try {
      await axios.post(`/api/discipleship/materials/${materialId}/save`, {}, authHeaders)
      setSaved(true)
      toast.success('Saved to your library')
    } catch {
      toast.error('Could not save')
    }
  }

  const handleComplete = async () => {
    if (!user) {
      toast.error('Sign in to track progress')
      return
    }
    try {
      await axios.post(`/api/discipleship/materials/${materialId}/complete`, {}, authHeaders)
      setCompleted(true)
      toast.success('Marked as completed')
    } catch {
      toast.error('Could not update progress')
    }
  }

  const handleDownload = async () => {
    if (!material?.file_url) {
      toast.error('No downloadable file for this material')
      return
    }
    try {
      await axios.post(`/api/discipleship/materials/${materialId}/download`)
      window.open(material.file_url, '_blank', 'noopener,noreferrer')
    } catch {
      window.open(material.file_url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: material?.title, url })
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-crm-purple/30 border-t-crm-purple rounded-full animate-spin" />
      </div>
    )
  }

  if (!material) {
    return (
      <div className="min-h-screen pt-28 text-center">
        <p className="text-crm-gray">Material not found.</p>
        <Link to="/discipleship" className="text-crm-purple mt-4 inline-block">Back to library</Link>
      </div>
    )
  }

  const langs = [...new Set(translations.map((t) => t.language).filter(Boolean))]

  return (
    <div className="page-shell safe-bottom">
      <div className="page-container max-w-4xl">
        <Link to="/discipleship" className="inline-flex items-center gap-2 text-sm text-crm-gray hover:text-crm-white mb-4 sm:mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('library.title')}
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-4 sm:p-6 lg:p-8 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold uppercase bg-crm-purple/20 text-crm-purple rounded-full">
                {material.material_type_label || material.material_type}
              </span>
              {material.category && (
                <span className="px-3 py-1 text-xs bg-white/5 text-crm-gray-light rounded-full">{material.category}</span>
              )}
              {material._ai_translated && aiTranslation && (
                <span className="px-3 py-1 text-xs bg-crm-purple/10 text-crm-purple rounded-full">{t('common.aiTranslated')}</span>
              )}
              </div>
              <LanguageSelector compact className="shrink-0" />
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-crm-white mb-2 break-words">{material.title}</h1>
            <p className="text-crm-purple font-medium mb-1">{material.speaker}</p>
            {material.bible_reference && (
              <p className="text-sm text-crm-gray-light mb-4">📖 {material.bible_reference}</p>
            )}
            <p className="text-crm-gray-light mb-6">{material.description}</p>

            {(langs.length > 1 || language !== 'en') && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Globe className="w-4 h-4 text-crm-gray" />
                {(langs.length > 1 ? langs : [language]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => changeLang(code)}
                    className={`px-3 py-1 rounded-lg text-xs ${
                      lang === code ? 'bg-crm-purple text-crm-black' : 'bg-white/5 text-crm-gray-light'
                    }`}
                  >
                    {langLabel(code)}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-6 sm:mb-8">
              <button type="button" onClick={handleSave} className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm min-h-[44px] ${saved ? 'bg-crm-purple/20 text-crm-purple' : 'bg-white/5 text-crm-gray-light hover:bg-white/10'}`}>
                <Bookmark className="w-4 h-4 shrink-0" /> <span className="truncate">{saved ? 'Saved' : t('library.save')}</span>
              </button>
              <button type="button" onClick={handleComplete} className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm min-h-[44px] ${completed ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-crm-gray-light hover:bg-white/10'}`}>
                <CheckCircle className="w-4 h-4 shrink-0" /> <span className="truncate">{completed ? 'Done' : t('library.complete')}</span>
              </button>
              {material.file_url && (
                <button type="button" onClick={handleDownload} className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm bg-white/5 text-crm-gray-light hover:bg-white/10 min-h-[44px]">
                  <Download className="w-4 h-4 shrink-0" /> {t('library.download')}
                </button>
              )}
              <button type="button" onClick={handleShare} className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm bg-white/5 text-crm-gray-light hover:bg-white/10 min-h-[44px]">
                <Share2 className="w-4 h-4 shrink-0" /> {t('library.share')}
              </button>
            </div>

            {material.video_url && (
              <div className="video-embed rounded-xl mb-6 sm:mb-8">
                <ReactPlayer url={material.video_url} controls width="100%" height="100%" />
              </div>
            )}

            {material.content && (
              <div className="prose prose-invert max-w-none mb-8">
                <div className="flex items-center gap-2 text-crm-purple mb-4">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-semibold">{t('library.read')}</span>
                </div>
                <div className="text-sm sm:text-base text-crm-gray-light leading-relaxed whitespace-pre-wrap break-words">{material.content}</div>
              </div>
            )}

            {material.audio_url && (
              <div className="mb-8">
                <div className="flex items-center gap-2 text-crm-purple mb-3">
                  <Headphones className="w-5 h-5" />
                  <span className="font-semibold">{t('library.listen')}</span>
                </div>
                <audio controls className="w-full" src={material.audio_url}>
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            {material.file_url && !material.video_url && (
              <a
                href={material.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-crm-purple/10 border border-crm-purple/20 text-crm-purple"
              >
                <FileText className="w-5 h-5" /> Open PDF / document
              </a>
            )}
          </GlassCard>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}
