import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SeriesCarousel({ series, title, subtitle }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  const scroll = (direction) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -400 : 400, behavior: 'smooth' })
    setTimeout(checkScroll, 300)
  }

  return (
    <div className="relative">
      <div className="flex items-end justify-between mb-4">
        <div><h2 className="text-xl font-bold text-crm-white">{title}</h2>{subtitle && <p className="text-sm text-crm-gray mt-1">{subtitle}</p>}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll('left')} disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-all ${canScrollLeft ? 'bg-slate-200 hover:bg-slate-300 text-crm-white' : 'bg-slate-100 text-crm-gray cursor-not-allowed'}`}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll('right')} disabled={!canScrollRight}
            className={`p-2 rounded-full transition-all ${canScrollRight ? 'bg-slate-200 hover:bg-slate-300 text-crm-white' : 'bg-slate-100 text-crm-gray cursor-not-allowed'}`}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} onScroll={checkScroll} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {series.map((s, index) => (
          <motion.div key={s.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex-shrink-0 w-72 group">
            <Link to={`/series/${s.id}`}>
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <img src={s.thumbnail_url} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-bold text-white line-clamp-1">{s.title}</h3>
                  <p className="text-xs text-crm-gray-light mt-0.5">{s.total_episodes} Episodes</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-crm-purple/90 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
