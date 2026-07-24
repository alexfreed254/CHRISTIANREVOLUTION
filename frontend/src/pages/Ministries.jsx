import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight } from 'lucide-react'
import { MINISTRIES } from '../constants/churchInfo'
import Footer from '../components/common/Footer'

export default function Ministries() {
  return (
    <div className="page-shell safe-bottom">
      <div className="page-container max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-crm-white mb-2">Ministries</h1>
          <p className="text-crm-gray-light max-w-2xl mx-auto">
            Serving every generation and nation through focused ministry arms.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {MINISTRIES.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={m.href}
                className="block p-5 rounded-2xl bg-white border border-slate-200 hover:border-crm-purple/40 hover:shadow-md transition-all group h-full"
              >
                <BookOpen className="w-5 h-5 text-crm-purple mb-3" />
                <h2 className="font-semibold text-crm-white mb-1 group-hover:text-crm-purple transition-colors">{m.name}</h2>
                <p className="text-sm text-crm-gray mb-3">{m.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm text-crm-purple font-medium">
                  Learn more <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}
