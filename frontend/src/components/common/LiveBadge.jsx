import { motion } from 'framer-motion'

export default function LiveBadge({ size = 'md', pulsing = true }) {
  const sizes = { sm: 'text-[10px] px-2 py-0.5', md: 'text-xs px-3 py-1', lg: 'text-sm px-4 py-1.5' }

  return (
    <motion.span
      className={`live-badge inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-white ${sizes[size]}`}
      animate={pulsing ? { opacity: [1, 0.85, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-white shrink-0"
        animate={pulsing ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      LIVE
    </motion.span>
  )
}
