import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, Newspaper } from 'lucide-react'
import { UPCOMING_EVENTS, CHURCH_NEWS } from '../constants/churchInfo'
import Footer from '../components/common/Footer'
import GlassCard from '../components/common/GlassCard'

export default function EventsNews() {
  return (
    <div className="page-shell safe-bottom">
      <div className="page-container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-crm-white mb-2">Events & News</h1>
          <p className="text-crm-gray-light">Upcoming gatherings and church announcements.</p>
        </motion.div>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-crm-white flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-crm-purple" /> Upcoming Events
          </h2>
          <div className="space-y-4">
            {UPCOMING_EVENTS.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard hover={false} className="p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-crm-white mb-2">{event.title}</h3>
                  <p className="text-sm text-crm-gray mb-3">{event.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-crm-gray-light">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-crm-purple" /> {event.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-crm-purple" /> {event.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-crm-purple" /> {event.location}</span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-crm-gray mt-4">
            Members can register for events in the{' '}
            <Link to="/portal" className="text-crm-purple hover:underline">Member Portal</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-crm-white flex items-center gap-2 mb-4">
            <Newspaper className="w-5 h-5 text-crm-purple" /> Church News
          </h2>
          <div className="space-y-3">
            {CHURCH_NEWS.map((item) => (
              <GlassCard key={item.id} hover={false} className="p-5">
                <p className="text-xs text-crm-purple font-medium mb-1">{item.date}</p>
                <h3 className="font-semibold text-crm-white mb-1">{item.title}</h3>
                <p className="text-sm text-crm-gray">{item.excerpt}</p>
              </GlassCard>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  )
}
