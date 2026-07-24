import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Globe, Target, Users, Heart, BookOpen, ChevronRight } from 'lucide-react'
import BrandLogo from '../components/common/BrandLogo'
import GlassCard from '../components/common/GlassCard'
import Footer from '../components/common/Footer'

const JOURNEY = [
  'Discover', 'Register', 'Connect', 'Attend', 'Learn', 'Grow', 'Serve', 'Disciple Others',
]

export default function About() {
  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <BrandLogo size="md" className="mx-auto mb-6" />
          <h1 className="text-3xl sm:text-4xl font-bold text-crm-white mb-4">About Us</h1>
          <p className="text-crm-gray-light max-w-2xl mx-auto text-lg leading-relaxed">
            Christ Revolution Movement is a global discipleship ministry reaching nations with the undiluted gospel of Jesus Christ.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {[
            { icon: Target, title: 'Vision', text: 'Discipling 2 billion souls by 2033' },
            { icon: Heart, title: 'Mission', text: 'Undiluted gospel, transformed lives' },
            { icon: Globe, title: 'Reach', text: 'Multilingual ministry across nations' },
            { icon: Users, title: 'Community', text: 'Believers growing and serving together' },
          ].map((item) => (
            <GlassCard key={item.title} hover={false} className="p-6">
              <item.icon className="w-8 h-8 text-crm-purple mb-3" />
              <h3 className="font-bold text-crm-white mb-2">{item.title}</h3>
              <p className="text-sm text-crm-gray">{item.text}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard hover={false} className="p-6 sm:p-8 mb-12">
          <h2 className="text-xl font-bold text-crm-white mb-3">Our Beliefs</h2>
          <p className="text-crm-gray-light text-sm leading-relaxed mb-4">
            We believe in the authority of Scripture, salvation through Jesus Christ alone, the work of the Holy Spirit,
            the Great Commission, and the unity of believers in love and truth.
          </p>
          <h2 className="text-xl font-bold text-crm-white mb-3">Church History</h2>
          <p className="text-crm-gray-light text-sm leading-relaxed">
            CRM began as a movement to raise disciples who will transform nations. Today we serve online and in person
            through worship, teaching, prayer, and global missions.
          </p>
        </GlassCard>

        <GlassCard hover={false} className="p-6 mb-12">
          <h2 className="text-xl font-bold text-crm-white mb-4">Your Journey With Us</h2>
          <div className="flex flex-wrap gap-2">
            {JOURNEY.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-crm-purple/10 text-crm-purple text-sm border border-crm-purple/20">{step}</span>
                {i < JOURNEY.length - 1 && <span className="text-crm-gray hidden sm:inline">→</span>}
              </span>
            ))}
          </div>
        </GlassCard>

        <div className="grid sm:grid-cols-3 gap-4 text-center mb-12">
          <Link to="/ministries" className="p-6 rounded-2xl bg-crm-purple/10 border border-crm-purple/20 hover:bg-crm-purple/15 transition-all">
            <BookOpen className="w-8 h-8 text-crm-purple mx-auto mb-2" />
            <span className="font-semibold text-crm-white">Ministries</span>
          </Link>
          <Link to="/sermons" className="p-6 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all">
            <BookOpen className="w-8 h-8 text-crm-purple mx-auto mb-2" />
            <span className="font-semibold text-crm-white">Sermons</span>
          </Link>
          <Link to="/register" className="p-6 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all">
            <Users className="w-8 h-8 text-crm-purple mx-auto mb-2" />
            <span className="font-semibold text-crm-white">Join Us</span>
          </Link>
        </div>

        <Link to="/ministries" className="flex items-center justify-center gap-2 text-crm-purple font-medium hover:underline">
          Explore all ministries <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <Footer />
    </div>
  )
}
