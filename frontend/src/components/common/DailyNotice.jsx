import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BookOpen, ChevronRight, Headphones, Video } from 'lucide-react'
import axios from 'axios'
import { useLanguage } from '../../context/LanguageContext'

/**
 * Daily notice banner — today's sermon teaching / spiritual material.
 * Shown prominently on Home and Portal.
 */
export default function DailyNotice({ compact = false, className = '' }) {
  const { language, t } = useLanguage()
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get('/api/discipleship/today', { params: { lang: language } })
      .then((res) => setMaterial(res.data.material))
      .catch(() => setMaterial(null))
      .finally(() => setLoading(false))
  }, [language])

  if (loading) {
    return (
      <div className={`rounded-2xl border border-crm-purple/20 bg-crm-purple/5 p-4 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
        <div className="h-6 bg-slate-200 rounded w-2/3" />
      </div>
    )
  }

  if (!material) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 ${className}`}>
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-crm-purple shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-crm-purple mb-1">Daily Notice</p>
            <p className="text-crm-gray text-sm">Today&apos;s teaching will be posted soon. Check back or browse the discipleship library.</p>
            <Link to="/discipleship" className="inline-flex items-center gap-1 text-sm text-crm-purple font-medium mt-2 hover:underline">
              Discipleship Library <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  if (compact) {
    return (
      <Link
        to={`/discipleship/${material.id}?lang=${language}`}
        className={`block rounded-xl border border-crm-purple/30 bg-crm-purple/5 p-4 hover:bg-crm-purple/10 transition-colors ${className}`}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-crm-purple mb-1">Today&apos;s Notice</p>
        <p className="font-semibold text-crm-white line-clamp-1">{material.title}</p>
      </Link>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 border-crm-purple/30 bg-gradient-to-br from-crm-purple/10 via-white to-purple-50/50 shadow-sm ${className}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-crm-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-crm-purple flex items-center justify-center shrink-0 shadow-lg shadow-crm-purple/20">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-crm-purple mb-1">
                Daily Notice · {dateLabel}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-crm-white mb-2 leading-tight">
                {material.title}
              </h2>
              {material.speaker && (
                <p className="text-sm text-crm-purple font-medium mb-2">{material.speaker}</p>
              )}
              {material.description && (
                <p className="text-sm text-crm-gray-light line-clamp-2 max-w-2xl">{material.description}</p>
              )}
              {material.bible_reference && (
                <p className="text-sm text-crm-gray mt-2">📖 {material.bible_reference}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              to={`/discipleship/${material.id}?lang=${language}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-crm-purple text-white font-semibold text-sm hover:opacity-90 min-h-[44px]"
            >
              <BookOpen className="w-4 h-4" /> {t('library.read')}
            </Link>
            {material.audio_url && (
              <Link
                to={`/discipleship/${material.id}?lang=${language}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-crm-white hover:bg-slate-50 min-h-[44px]"
              >
                <Headphones className="w-4 h-4" /> {t('library.listen')}
              </Link>
            )}
            {material.video_url && (
              <Link
                to={`/discipleship/${material.id}?lang=${language}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-crm-white hover:bg-slate-50 min-h-[44px]"
              >
                <Video className="w-4 h-4" /> {t('library.watch')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
