import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Cross, Globe, Radio, Library, Heart, User, LogIn, LogOut, Menu, X, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from './BrandLogo'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLive, setIsLive] = useState(true)
  const location = useLocation()
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { path: '/', label: 'Home', icon: Globe },
    { path: '/live', label: 'Live', icon: Radio, badge: isLive ? 'LIVE' : null },
    { path: '/media', label: 'Media', icon: Library },
    { path: '/prayer', label: 'Prayer', icon: Heart },
    { path: '/give', label: 'Support', icon: Heart },
  ]

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-crm-black/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24">
            <Link to="/" className="flex items-center gap-3 group">
              <BrandLogo size="nav" priority className="group-hover:scale-105 transition-transform drop-shadow-[0_0_12px_rgba(139,127,199,0.35)]" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-black tracking-wider uppercase leading-tight">
                  <span className="text-crm-white">Christ</span>
                  <span className="text-crm-purple ml-1">Revolution</span>
                </h1>
                <p className="text-[10px] text-crm-gray tracking-[0.3em] uppercase">Movement 2033</p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive(link.path) ? 'text-crm-purple bg-crm-purple/10' : 'text-crm-gray-light hover:text-crm-white hover:bg-white/5'
                  }`}>
                  <link.icon className="w-4 h-4" />
                  {link.label}
                  {link.badge && (
                    <span className="live-badge text-[10px]">{link.badge}</span>
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  {['admin', 'super_admin'].includes(user.role) && (
                    <Link to="/admin" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-crm-purple text-crm-black font-semibold text-sm hover:opacity-90 transition-all">
                      <Shield className="w-4 h-4" /> Admin
                    </Link>
                  )}
                  <Link to="/portal" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-crm-purple/10 border border-crm-purple/20 text-crm-purple hover:bg-crm-purple/20 transition-all">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.full_name?.split(' ')[0]}</span>
                  </Link>
                  <button onClick={logout} className="p-2 rounded-lg hover:bg-white/5 text-crm-gray-light hover:text-crm-white transition-all" title="Logout">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-crm-gray-light hover:text-crm-white hover:bg-white/5 transition-all">
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                  <Link to="/register" className="shield-button text-xs">Join CRM</Link>
                </div>
              )}
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-all">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-crm-black/95 backdrop-blur-xl" onClick={() => setIsMobileMenuOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-crm-dark border-l border-white/10 p-6 pt-24">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive(link.path) ? 'bg-crm-purple/10 text-crm-purple border border-crm-purple/20' : 'text-crm-gray-light hover:bg-white/5 hover:text-crm-white'
                    }`}>
                    <link.icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                    {link.badge && <span className="live-badge text-[10px] ml-auto">{link.badge}</span>}
                  </Link>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-white/10">
                {user ? (
                  <div className="flex flex-col gap-3">
                    {['admin', 'super_admin'].includes(user.role) && (
                      <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-crm-purple text-crm-black font-semibold">
                        <Shield className="w-5 h-5" /> <span className="font-medium">Admin Dashboard</span>
                      </Link>
                    )}
                    <Link to="/portal" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-crm-purple/10 text-crm-purple">
                      <User className="w-5 h-5" /> <span className="font-medium">My Portal</span>
                    </Link>
                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-lg text-crm-gray-light hover:bg-white/5">
                      <LogOut className="w-5 h-5" /> <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-crm-gray-light hover:bg-white/5">
                      <LogIn className="w-5 h-5" /> <span className="font-medium">Sign In</span>
                    </Link>
                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="shield-button text-center">Join the Movement</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
