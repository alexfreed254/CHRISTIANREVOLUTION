import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Eye, Heart, Share2, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import LiveBadge from '../common/LiveBadge'

export default function VideoCard({ media, index = 0, onPlayAudio }) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatViews = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const thumb = media.thumbnail_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(media.speaker || 'CRM')}&background=8B7FC7&color=0a0a0a&size=512`

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Link to={`/media/${media.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-crm-purple rounded-xl">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-crm-dark shadow-lg shadow-black/20">
          {!imageLoaded && <div className="absolute inset-0 bg-gradient-to-br from-crm-dark via-crm-purple/5 to-crm-black animate-pulse" />}
          <img src={thumb} alt={media.title}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out ${isHovered ? 'scale-105' : 'scale-100'} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)} loading="lazy" />
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-xs font-medium">{formatDuration(media.duration)}</div>
          {media.is_live && <div className="absolute top-2 left-2"><LiveBadge size="sm" /></div>}
          {media.is_new && !media.is_live && (
            <div className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-crm-black"
              style={{ background: 'linear-gradient(135deg, #8B7FC7 0%, #B8B0E3 100%)', clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}>NEW</div>
          )}
          <motion.div initial={false} animate={{ opacity: isHovered ? 1 : 0 }} className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <motion.div initial={false} animate={{ scale: isHovered ? 1 : 0.8 }} className="w-14 h-14 rounded-full bg-crm-purple/90 flex items-center justify-center">
              <Play className="w-7 h-7 text-crm-black ml-1" fill="currentColor" />
            </motion.div>
          </motion.div>
          {media.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div className="h-full bg-crm-purple" style={{ width: `${media.progress * 100}%` }} />
            </div>
          )}
        </div>
        <div className="mt-3 flex gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-crm-purple to-crm-purple-light flex items-center justify-center text-crm-black text-sm font-bold flex-shrink-0">
            {media.speaker?.charAt(0) || 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-crm-white line-clamp-2 leading-tight group-hover:text-crm-purple transition-colors">{media.title}</h3>
            <p className="text-xs text-crm-gray mt-0.5">{media.speaker}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-crm-gray">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatViews(media.view_count)}</span>
              <span>•</span><span>{media.upload_date ? formatDistanceToNow(new Date(media.upload_date), { addSuffix: true }) : 'Recently'}</span>
            </div>
          </div>
        </div>
      </Link>
      <motion.div initial={false} animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 5 }}
        className="flex items-center gap-2 mt-2">
        <button onClick={(e) => { e.preventDefault(); onPlayAudio?.(media); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-crm-gray-light hover:text-white transition-all">
          <Play className="w-3 h-3" /> Audio
        </button>
        <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-crm-gray-light hover:text-white transition-all"><Heart className="w-3.5 h-3.5" /></button>
        <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-crm-gray-light hover:text-white transition-all"><Share2 className="w-3.5 h-3.5" /></button>
        <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-crm-gray-light hover:text-white transition-all"><Download className="w-3.5 h-3.5" /></button>
      </motion.div>
    </motion.div>
  )
}
