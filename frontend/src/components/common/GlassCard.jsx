import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', hover = true, onClick }) {
  return (
    <motion.div
      className={`backdrop-blur-md bg-white/5 border border-white/10 rounded-xl overflow-hidden ${
        hover ? 'hover:bg-white/10 hover:border-crm-purple/30 transition-all duration-300 cursor-pointer' : ''
      } ${className}`}
      whileHover={hover ? { y: -4, boxShadow: '0 0 30px rgba(139, 127, 199, 0.15)' } : {}}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
