import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X, Mic } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'most_viewed', label: 'Most Viewed' },
  { value: 'most_shared', label: 'Most Shared' },
  { value: 'longest', label: 'Longest' },
  { value: 'shortest', label: 'Shortest' },
]

const TOPICS = ['All', 'Healing', 'Finance', 'Marriage', 'Evangelism', 'Leadership', 'Prayer', 'Prophecy', 'Worship', 'Faith']

export default function FilterBar({ filters, onFilterChange, onSearch, searchQuery }) {
  const { languages, t } = useLanguage()
  const [showFilters, setShowFilters] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const filterLanguages = [
    { code: 'all', label: 'All Languages' },
    ...languages.map((lang) => ({ code: lang.code, label: lang.label })),
  ]

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) || !onSearch) return
    const recognition = new window.webkitSpeechRecognition()
    recognition.lang = 'en-US'
    recognition.start()
    setIsListening(true)
    recognition.onresult = (event) => { onSearch(event.results[0][0].transcript); setIsListening(false) }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
  }

  return (
    <div className="space-y-4">
      {onSearch && (
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-crm-gray" />
            <input type="text" value={searchQuery || ''} onChange={(e) => onSearch(e.target.value)}
              placeholder="Search sermons, speakers, scriptures..."
              className="w-full pl-11 pr-12 py-3 rounded-xl bg-slate-100 border border-slate-200 text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple transition-all" />
            {searchQuery && (
              <button onClick={() => onSearch('')} className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded">
                <X className="w-4 h-4 text-crm-gray" />
              </button>
            )}
            <button onClick={handleVoiceSearch}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'bg-crm-live/20 text-crm-live animate-pulse' : 'hover:bg-slate-200 text-crm-gray'}`}>
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              showFilters ? 'bg-crm-purple/10 border-crm-purple/30 text-crm-purple' : 'bg-slate-100 border-slate-200 text-crm-gray-light hover:bg-slate-200'
            }`}>
            <SlidersHorizontal className="w-4 h-4" /><span className="hidden sm:inline text-sm font-medium">Filters</span>
          </button>
        </div>
      )}

      {!onSearch && (
        <div className="flex justify-end">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              showFilters ? 'bg-crm-purple/10 border-crm-purple/30 text-crm-purple' : 'bg-slate-100 border-slate-200 text-crm-gray-light hover:bg-slate-200'
            }`}>
            <SlidersHorizontal className="w-4 h-4" /><span className="hidden sm:inline text-sm font-medium">Filters</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {SORT_OPTIONS.map((option) => (
          <button key={option.value} onClick={() => onFilterChange('sort', option.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filters.sort === option.value ? 'bg-crm-purple text-white' : 'bg-slate-100 text-crm-gray-light hover:bg-slate-200 hover:text-crm-purple-dark border border-slate-200'
            }`}>
            {option.label}
          </button>
        ))}
      </div>

      <motion.div initial={false} animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }} className="overflow-hidden">
        <div className="space-y-4 p-4 rounded-xl bg-slate-100 border border-slate-200">
          <div>
            <h4 className="text-xs font-semibold text-crm-gray uppercase tracking-wider mb-2">Topics</h4>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((topic) => (
                <button key={topic} onClick={() => onFilterChange('topic', topic === 'All' ? 'all' : topic)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    (filters.topic === topic) || (topic === 'All' && filters.topic === 'all') ? 'bg-crm-purple/20 text-crm-purple border border-crm-purple/30' : 'bg-slate-100 text-crm-gray-light hover:bg-slate-200 border border-slate-200'
                  }`}>
                  {topic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-crm-gray uppercase tracking-wider mb-2">{t('common.language')}</h4>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {filterLanguages.map((lang) => (
                <button key={lang.code} onClick={() => onFilterChange('language', lang.code)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filters.language === lang.code ? 'bg-crm-purple/20 text-crm-purple border border-crm-purple/30' : 'bg-slate-100 text-crm-gray-light hover:bg-slate-200 border border-slate-200'
                  }`}>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
