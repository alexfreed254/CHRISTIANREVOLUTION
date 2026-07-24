import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', hover = true, onClick }) {
  return (
    <motion.div
      className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ${
        hover ? 'hover:border-crm-purple/40 hover:shadow-md transition-all duration-300 cursor-pointer' : ''
      } ${className}`}
      whileHover={hover ? { y: -4, boxShadow: '0 8px 24px rgba(107, 95, 167, 0.12)' } : {}}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
