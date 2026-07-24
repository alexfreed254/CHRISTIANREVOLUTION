import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react'
import { CONTACT, SERVICE_TIMES } from '../constants/churchInfo'
import Footer from '../components/common/Footer'
import GlassCard from '../components/common/GlassCard'

export default function Contact() {
  return (
    <div className="page-shell safe-bottom">
      <div className="page-container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-crm-white mb-2">Contact Us</h1>
          <p className="text-crm-gray-light">We would love to hear from you. Reach out anytime.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <GlassCard hover={false} className="p-5">
            <MapPin className="w-6 h-6 text-crm-purple mb-3" />
            <h2 className="font-semibold text-crm-white mb-1">Location</h2>
            <p className="text-sm text-crm-gray mb-3">{CONTACT.address}</p>
            <a
              href={CONTACT.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-crm-purple hover:underline"
            >
              Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </GlassCard>
          <GlassCard hover={false} className="p-5">
            <Phone className="w-6 h-6 text-crm-purple mb-3" />
            <h2 className="font-semibold text-crm-white mb-1">Phone</h2>
            <a href={`tel:${CONTACT.phone}`} className="text-sm text-crm-gray hover:text-crm-purple">{CONTACT.phone}</a>
          </GlassCard>
          <GlassCard hover={false} className="p-5">
            <Mail className="w-6 h-6 text-crm-purple mb-3" />
            <h2 className="font-semibold text-crm-white mb-1">Email</h2>
            <a href={`mailto:${CONTACT.email}`} className="text-sm text-crm-gray hover:text-crm-purple">{CONTACT.email}</a>
          </GlassCard>
          <GlassCard hover={false} className="p-5">
            <Clock className="w-6 h-6 text-crm-purple mb-3" />
            <h2 className="font-semibold text-crm-white mb-3">Service Times</h2>
            <ul className="space-y-2">
              {SERVICE_TIMES.map((s) => (
                <li key={s.day} className="text-sm">
                  <span className="font-medium text-crm-white">{s.day}</span>
                  <span className="text-crm-gray"> — {s.time} ({s.label})</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        <GlassCard hover={false} className="p-6 mb-8">
          <h2 className="font-semibold text-crm-white mb-4">Connect With Us</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(CONTACT.social).map(([name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm text-crm-gray-light hover:text-crm-purple capitalize"
              >
                {name}
              </a>
            ))}
          </div>
        </GlassCard>

        <div className="flex flex-wrap gap-3">
          <Link to="/register" className="shield-button">Join Us</Link>
          <Link to="/prayer" className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm text-crm-white hover:bg-slate-50">Prayer Request</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
