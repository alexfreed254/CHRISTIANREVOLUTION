import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'

const FOOTER_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/ministries', label: 'Ministries' },
  { to: '/sermons', label: 'Sermons' },
  { to: '/events', label: 'Events' },
  { to: '/discipleship', label: 'Library' },
  { to: '/prayer', label: 'Prayer' },
  { to: '/give', label: 'Give' },
  { to: '/contact', label: 'Contact' },
]

export default function Footer() {
  return (
    <footer className="py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <div>
              <h3 className="font-bold text-lg text-crm-white">Christ Revolution Movement</h3>
              <p className="text-xs text-crm-gray">Discipling 2 Billion Souls by 2033</p>
            </div>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-crm-gray">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-crm-purple transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-crm-gray text-center">© 2026 Christ Revolution Movement</p>
        </div>
      </div>
    </footer>
  )
}
