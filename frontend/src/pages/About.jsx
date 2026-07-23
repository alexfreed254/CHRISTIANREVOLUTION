import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Globe, Target, Users, Heart, Radio, BookOpen } from 'lucide-react'
import BrandLogo from '../components/common/BrandLogo'
import GlassCard from '../components/common/GlassCard'
import Footer from '../components/common/Footer'

const MINISTRIES = [
  { name: 'Daily Christ Bites', desc: 'Short daily devotionals' },
  { name: 'Christ Decrees', desc: 'Prophetic declarations' },
  { name: 'Worldwide Invasions', desc: 'Global outreach missions' },
  { name: 'Worldwide Jesus Bootcamps', desc: 'Intensive discipleship training' },
  { name: 'Worldwide Prayers and Fasting', desc: 'United global prayer' },
  { name: 'Worldwide Throne Worship', desc: '24/7 worship gatherings' },
  { name: 'Elders and Orphans Tower', desc: 'Care for vulnerable communities' },
  { name: 'Radah Schools', desc: 'Biblical education' },
  { name: 'CRM Media House', desc: 'Content production & broadcast' },
  { name: 'CRM Youths', desc: 'Young adults ministry' },
  { name: 'CRM Teens', desc: 'Teen discipleship' },
  { name: 'CRM Kids', desc: 'Children\'s ministry (safeguarded)' },
]

const JOURNEY = [
  'Discover', 'Register', 'Connect', 'Attend', 'Learn', 'Grow', 'Serve', 'Disciple Others',
]

export default function About() {
  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <BrandLogo size="md" className="mx-auto mb-6" />
          <p className="text-crm-purple text-sm font-semibold uppercase tracking-[0.3em] mb-3">CRM Global Digital</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-crm-white mb-4">Ministry & Discipleship Platform</h1>
          <p className="text-crm-gray-light max-w-3xl mx-auto text-lg leading-relaxed">
            One global ecosystem to discover Christ Revolution Movement, connect in your language,
            grow through discipleship, and serve nations — online or in person.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {[
            { icon: Target, title: 'Vision', text: 'Discipling 2 billion souls by 2033' },
            { icon: Globe, title: 'Reach', text: 'Multilingual content & live ministry' },
            { icon: Users, title: 'Community', text: 'Digital & physical cells worldwide' },
            { icon: Heart, title: 'Mission', text: 'Undiluted gospel, transformed lives' },
          ].map((item, i) => (
            <GlassCard key={item.title} className="p-6">
              <item.icon className="w-8 h-8 text-crm-purple mb-3" />
              <h3 className="font-bold text-crm-white mb-2">{item.title}</h3>
              <p className="text-sm text-crm-gray">{item.text}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-8 mb-16">
          <h2 className="text-2xl font-bold text-crm-white mb-4">Your Journey</h2>
          <div className="flex flex-wrap gap-2">
            {JOURNEY.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-crm-purple/10 text-crm-purple text-sm border border-crm-purple/20">{step}</span>
                {i < JOURNEY.length - 1 && <span className="text-crm-gray hidden sm:inline">→</span>}
              </span>
            ))}
          </div>
        </GlassCard>

        <section id="ministries" className="mb-16 scroll-mt-28">
          <h2 className="text-3xl font-bold text-crm-white mb-2">Ministries</h2>
          <p className="text-crm-gray mb-8">Twelve ministry arms reaching every generation and nation.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MINISTRIES.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="p-5 rounded-2xl bg-crm-dark/60 border border-white/10 hover:border-crm-purple/30 transition-colors"
              >
                <BookOpen className="w-5 h-5 text-crm-purple mb-2" />
                <h3 className="font-semibold text-crm-white mb-1">{m.name}</h3>
                <p className="text-sm text-crm-gray">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <div className="grid sm:grid-cols-3 gap-4 text-center">
          <Link to="/live" className="p-6 rounded-2xl bg-crm-purple/10 border border-crm-purple/20 hover:bg-crm-purple/20 transition-all">
            <Radio className="w-8 h-8 text-crm-purple mx-auto mb-2" />
            <span className="font-semibold text-crm-white">Watch Live</span>
          </Link>
          <Link to="/media" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <BookOpen className="w-8 h-8 text-crm-purple mx-auto mb-2" />
            <span className="font-semibold text-crm-white">Media Library</span>
          </Link>
          <Link to="/register" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <Users className="w-8 h-8 text-crm-purple mx-auto mb-2" />
            <span className="font-semibold text-crm-white">Join CRM</span>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
