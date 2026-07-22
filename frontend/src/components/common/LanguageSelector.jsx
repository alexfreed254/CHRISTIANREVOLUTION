import { useMemo, useState } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function LanguageSelector({ compact = false, className = '' }) {
  const { language, setLanguage, languages, languageGroups, aiTranslation, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const current = useMemo(
    () => languages.find((l) => l.code === language) || { code: language, label: language },
    [languages, language]
  )

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return languageGroups
    return languageGroups
      .map((g) => ({
        ...g,
        languages: g.languages.filter(
          (l) => l.label.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.languages.length > 0)
  }, [languageGroups, query])

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-crm-white transition-all shrink-0 ${
          compact ? 'px-2 py-2' : 'px-3 py-2'
        }`}
        aria-label={t('common.language')}
      >
        <Globe className="w-4 h-4 shrink-0 text-crm-purple" />
        {!compact && (
          <span className="text-xs sm:text-sm max-w-[100px] truncate hidden sm:inline">
            {current.label}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full mt-2 z-50 w-[min(320px,calc(100vw-2rem))] max-h-[min(420px,70vh)] overflow-hidden rounded-2xl bg-crm-dark border border-white/10 shadow-2xl flex flex-col">
            <div className="p-3 border-b border-white/10">
              <p className="text-xs text-crm-gray uppercase tracking-wider mb-2">{t('common.language')}</p>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search languages..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-crm-white"
              />
              {aiTranslation && (
                <p className="text-[10px] text-crm-purple mt-2">{t('common.aiTranslated')}</p>
              )}
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {filteredGroups.map((group) => (
                <div key={group.id} className="mb-2">
                  <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-crm-gray">{group.label}</p>
                  {group.languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code)
                        setOpen(false)
                        setQuery('')
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        language === lang.code
                          ? 'bg-crm-purple/20 text-crm-purple'
                          : 'text-crm-gray-light hover:bg-white/5 hover:text-crm-white'
                      }`}
                    >
                      <span className="font-medium">{lang.label}</span>
                      {lang.native && lang.native !== lang.label && (
                        <span className="text-xs text-crm-gray ml-2">{lang.native}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
