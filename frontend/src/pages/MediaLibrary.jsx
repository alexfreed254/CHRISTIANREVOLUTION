import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, TrendingUp, Clock, Eye, Heart } from 'lucide-react'
import axios from 'axios'
import VideoCard from '../components/media/VideoCard'
import FilterBar from '../components/media/FilterBar'
import { usePlayer } from '../context/PlayerContext'
import toast from 'react-hot-toast'
import Footer from '../components/common/Footer'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/common/LanguageSelector'

export default function MediaLibrary({ pageTitle, pageSubtitle }) {
  const { language, t, aiTranslation } = useLanguage()
  const title = pageTitle || t('media.library')
  const subtitle = pageSubtitle || 'Explore thousands of sermons, teachings, and resources from the CRM global network'
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    sort: 'latest',
    topic: 'all',
    language: 'all'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 12,
    total: 0,
    total_pages: 0
  })
  const { playTrack } = usePlayer()

  useEffect(() => {
    fetchMedia()
  }, [filters, pagination.page, searchQuery, language])

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const params = {
        ...filters,
        page: pagination.page,
        per_page: pagination.per_page,
        q: searchQuery,
        lang: language !== 'en' ? language : undefined,
      }
      const res = await axios.get('/api/media/library', { params })
      setMedia(res.data.media || [])
      setPagination(prev => ({
        ...prev,
        total: res.data.total,
        total_pages: res.data.total_pages
      }))
    } catch (err) {
      console.error('Failed to fetch media:', err)
      toast.error('Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchMedia()
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-crm-white mb-4">{title}</h1>
              <p className="text-crm-gray-light">{subtitle}</p>
            </div>
            <LanguageSelector compact className="shrink-0" />
          </div>
          {aiTranslation && language !== 'en' && (
            <p className="text-xs text-crm-purple mb-2">{t('common.aiTranslated')}</p>
          )}
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-crm-gray" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sermons, speakers, topics, or Bible references..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 backdrop-blur-md border border-slate-200 rounded-2xl text-crm-white placeholder-crm-gray focus:outline-none focus:border-crm-purple focus:ring-2 focus:ring-crm-purple/20 transition-all"
            />
          </form>
        </motion.div>

        {/* Filter Bar */}
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-crm-gray">
            Showing {media.length} of {pagination.total} results
          </p>
          {loading && (
            <div className="flex items-center gap-2 text-crm-purple">
              <div className="w-4 h-4 border-2 border-crm-purple/30 border-t-crm-purple rounded-full animate-spin" />
              <span className="text-sm">{t('common.loading')}</span>
            </div>
          )}
        </div>

        {/* Media Grid */}
        {loading && media.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-slate-100 rounded-xl mb-4" />
                <div className="h-4 bg-slate-100 rounded mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : media.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {media.map((item, index) => (
              <VideoCard 
                key={item.id} 
                media={item} 
                index={index}
                onPlayAudio={(m) => playTrack(m, media)}
              />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-crm-gray mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-crm-white mb-2">No Results Found</h3>
            <p className="text-crm-gray">Try adjusting your filters or search query</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-lg bg-slate-100 text-crm-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-all"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {[...Array(pagination.total_pages)].map((_, i) => {
                const page = i + 1
                if (
                  page === 1 ||
                  page === pagination.total_pages ||
                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        page === pagination.page
                          ? 'bg-crm-purple text-white'
                          : 'bg-slate-100 text-crm-white hover:bg-slate-200'
                      }`}
                    >
                      {page}
                    </button>
                  )
                } else if (
                  page === pagination.page - 2 ||
                  page === pagination.page + 2
                ) {
                  return <span key={page} className="text-crm-gray">...</span>
                }
                return null
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
              className="px-4 py-2 rounded-lg bg-slate-100 text-crm-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  )
}
