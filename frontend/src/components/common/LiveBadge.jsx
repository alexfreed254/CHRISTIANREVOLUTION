import { motion } from 'framer-motion'

export default function LiveBadge({ size = 'md', pulsing = true }) {
  const sizes = { sm: 'text-[10px] px-2 py-0.5', md: 'text-xs px-3 py-1', lg: 'text-sm px-4 py-1.5' }

  return (
    <motion.span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider ${sizes[size]}`}
      style={{ background: 'linear-gradient(135deg, #8B7FC7 0%, #B8B0E3 100%)', clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
      animate={pulsing ? { opacity: [1, 0.7, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.span className="w-1.5 h-1.5 rounded-full bg-white"
        animate={pulsing ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
      LIVE
    </motion.span>
  )
}
