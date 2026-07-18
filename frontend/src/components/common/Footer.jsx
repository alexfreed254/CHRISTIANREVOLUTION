import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-crm-black/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Christ Revolution Movement" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h3 className="font-bold text-lg text-crm-white">Christ Revolution Movement</h3>
              <p className="text-xs text-crm-gray">Discipling 2 Billion Souls by 2033</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-crm-gray">
            <Link to="/" className="hover:text-crm-white transition-colors">Home</Link>
            <Link to="/live" className="hover:text-crm-white transition-colors">Live</Link>
            <Link to="/media" className="hover:text-crm-white transition-colors">Media</Link>
            <Link to="/prayer" className="hover:text-crm-white transition-colors">Prayer</Link>
            <Link to="/give" className="hover:text-crm-white transition-colors">Support</Link>
          </div>
          <p className="text-xs text-crm-gray">© 2026 Christ Revolution Movement. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
