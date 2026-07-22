import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Radio, Library, Heart, User, LogIn, LogOut, Menu, X, Shield,
  BookOpen, Info, ChevronDown, GraduationCap
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from './BrandLogo'
import useLiveStats from '../../hooks/useLiveStats'
import LanguageSelector from './LanguageSelector'
import { useLanguage } from '../../context/LanguageContext'

const MINISTRIES = [
  'Daily Christ Bites', 'Christ Decrees', 'Worldwide Invasions', 'Jesus Bootcamps',
  'Prayers & Fasting', 'Throne Worship', 'Elders & Orphans Tower', 'Radah Schools',
  'CRM Media House', 'CRM Youths', 'CRM Teens', 'CRM Kids',
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [ministriesOpen, setMinistriesOpen] = useState(false)
  const { stats } = useLiveStats({ pollMs: 30000 })
  const isLive = (stats.live_now || 0) > 0
  const location = useLocation()
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setMinistriesOpen(false)
  }, [location.pathname])

  const navLinks = [
    { path: '/', label: t('nav.home'), icon: Globe },
    { path: '/about', label: t('nav.about'), icon: Info },
    { path: '/live', label: t('nav.live'), icon: Radio, badge: isLive ? 'LIVE' : null },
    { path: '/discipleship', label: t('nav.discipleship'), icon: BookOpen },
    { path: '/media', label: t('nav.media'), icon: Library },
    { path: '/prayer', label: t('nav.prayer'), icon: Heart },
    { path: '/portal', label: t('nav.portal'), icon: GraduationCap, auth: true },
    { path: '/support', label: t('nav.support'), icon: Heart },
  ]

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/')

  const NavLinkItem = ({ link, mobile = false }) => {
    if (link.auth && !user) return null
    const cls = mobile
      ? `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          isActive(link.path) ? 'bg-crm-purple/10 text-crm-purple border border-crm-purple/20' : 'text-crm-gray-light hover:bg-white/5 hover:text-crm-white'
        }`
      : `relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
          isActive(link.path) ? 'text-crm-purple bg-crm-purple/10' : 'text-crm-gray-light hover:text-crm-white hover:bg-white/5'
        }`
    return (
      <Link to={link.path} className={cls}>
        <link.icon className={mobile ? 'w-5 h-5' : 'w-4 h-4'} />
        {link.label}
        {link.badge && <span className="live-badge text-[10px] ml-1">{link.badge}</span>}
      </Link>
    )
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-crm-black/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20' : 'bg-crm-black/40 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 lg:h-20 gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2.5 -ml-1 rounded-xl hover:bg-white/10 transition-all text-crm-white shrink-0"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 shrink-0 max-w-[45%] sm:max-w-none">
              <BrandLogo size="nav" priority className="group-hover:scale-105 transition-transform shrink-0" />
              <div className="hidden sm:block min-w-0">
                <h1 className="text-sm lg:text-base font-black tracking-wider uppercase leading-tight truncate">
                  <span className="text-crm-white">Christ</span>
                  <span className="text-crm-purple ml-1">Revolution</span>
                </h1>
                <p className="text-[9px] lg:text-[10px] text-crm-gray tracking-[0.25em] uppercase truncate">
                  Global Digital Ministry
                </p>
              </div>
            </Link>

            <div className="hidden xl:flex items-center gap-0.5 flex-1 min-w-0 justify-center overflow-x-auto scrollbar-hide px-1">
              {navLinks.map((link) => (
                <NavLinkItem key={link.path} link={link} />
              ))}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMinistriesOpen(!ministriesOpen)}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-crm-gray-light hover:text-crm-white hover:bg-white/5 flex items-center gap-1"
                >
                  <BookOpen className="w-4 h-4" /> {t('nav.ministries')}
                  <ChevronDown className={`w-3 h-3 transition-transform ${ministriesOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {ministriesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute top-full left-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl bg-crm-dark border border-white/10 shadow-2xl p-2 z-50"
                    >
                      {MINISTRIES.map((name) => (
                        <Link
                          key={name}
                          to="/about#ministries"
                          onClick={() => setMinistriesOpen(false)}
                          className="block px-3 py-2 rounded-lg text-sm text-crm-gray-light hover:bg-white/5 hover:text-crm-white"
                        >
                          {name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto relative z-20">
              <LanguageSelector compact className="hidden sm:block" />
              {user ? (
                <>
                  {['admin', 'super_admin'].includes(user.role) && (
                    <Link to="/admin" className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-crm-purple text-crm-black font-semibold text-sm hover:opacity-90 shrink-0">
                      <Shield className="w-4 h-4" /> {t('nav.admin')}
                    </Link>
                  )}
                  <Link to="/portal" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-crm-purple/10 border border-crm-purple/20 text-crm-purple text-sm shrink-0">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="font-medium max-w-[72px] truncate">{user.full_name?.split(' ')[0]}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center justify-center p-2.5 rounded-lg border border-white/15 bg-white/10 text-crm-white hover:bg-white/15 hover:text-crm-white shrink-0"
                    title={t('nav.signOut')}
                    aria-label={t('nav.signOut')}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-crm-gray-light hover:text-crm-white hover:bg-white/10 shrink-0"
                  >
                    <LogIn className="w-4 h-4 shrink-0" /> {t('nav.signIn')}
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg bg-crm-purple text-crm-black font-bold text-xs sm:text-sm uppercase tracking-wide hover:opacity-90 shrink-0 whitespace-nowrap shadow-lg shadow-crm-purple/20"
                  >
                    {t('nav.join')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 xl:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} aria-hidden />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute left-0 top-0 bottom-0 w-[min(320px,88vw)] bg-crm-dark border-r border-white/10 flex flex-col shadow-2xl"
            >
              <div className="p-5 pt-20 border-b border-white/10">
                <p className="text-xs text-crm-gray uppercase tracking-widest mb-1">CRM Global</p>
                <p className="text-lg font-bold text-crm-white">Digital Ministry Platform</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLinkItem key={link.path} link={link} mobile />
                ))}
                <button
                  type="button"
                  onClick={() => setMinistriesOpen(!ministriesOpen)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-crm-gray-light hover:bg-white/5 w-full"
                >
                  <span className="flex items-center gap-3"><BookOpen className="w-5 h-5" /> Ministries</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${ministriesOpen ? 'rotate-180' : ''}`} />
                </button>
                {ministriesOpen && (
                  <div className="pl-4 pb-2 space-y-1">
                    {MINISTRIES.map((name) => (
                      <Link key={name} to="/about#ministries" className="block px-3 py-2 text-sm text-crm-gray hover:text-crm-white rounded-lg">
                        {name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-white/10 space-y-3">
                <LanguageSelector />
                {user ? (
                  <div className="flex flex-col gap-2">
                    {['admin', 'super_admin'].includes(user.role) && (
                      <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-crm-purple text-crm-black font-semibold">
                        <Shield className="w-5 h-5" /> Admin Dashboard
                      </Link>
                    )}
                    <Link to="/portal" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-crm-purple/10 text-crm-purple">
                      <User className="w-5 h-5" /> My Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 bg-white/10 text-crm-white hover:bg-white/15"
                    >
                      <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/login" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-crm-white">
                      <LogIn className="w-5 h-5" /> Sign In
                    </Link>
                    <Link to="/register" className="flex items-center justify-center py-3 rounded-lg bg-crm-purple text-crm-black font-bold uppercase tracking-wide">
                      Join Now
                    </Link>
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
