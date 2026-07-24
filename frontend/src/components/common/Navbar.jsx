import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home as HomeIcon, Info, BookOpen, Heart, User, LogIn, LogOut, Menu, X, Shield,
  Mic, Calendar, Library, Mail, DollarSign, GraduationCap
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from './BrandLogo'
import LanguageSelector from './LanguageSelector'
import { useLanguage } from '../../context/LanguageContext'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
  }, [location.pathname])

  const navLinks = [
    { path: '/', label: t('nav.home'), icon: HomeIcon },
    { path: '/about', label: t('nav.about'), icon: Info },
    { path: '/ministries', label: t('nav.ministries'), icon: BookOpen },
    { path: '/sermons', label: t('nav.sermons'), icon: Mic },
    { path: '/events', label: t('nav.events'), icon: Calendar },
    { path: '/discipleship', label: t('nav.discipleship'), icon: Library },
    { path: '/prayer', label: t('nav.prayer'), icon: Heart },
    { path: '/give', label: t('nav.give'), icon: DollarSign },
    { path: '/contact', label: t('nav.contact'), icon: Mail },
  ]

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/')

  const NavLinkItem = ({ link, mobile = false }) => {
    const cls = mobile
      ? `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          isActive(link.path) ? 'bg-crm-purple/10 text-crm-purple border border-crm-purple/20' : 'text-crm-gray-light hover:bg-slate-100 hover:text-crm-white'
        }`
      : `relative px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
          isActive(link.path) ? 'text-crm-purple bg-crm-purple/10' : 'text-crm-gray-light hover:text-crm-white hover:bg-slate-100'
        }`
    return (
      <Link to={link.path} className={cls}>
        {!mobile && <link.icon className="w-3.5 h-3.5 hidden 2xl:block" />}
        {link.label}
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
          isScrolled ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm' : 'bg-white/95 backdrop-blur-md border-b border-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[4.25rem] gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="xl:hidden p-2.5 -ml-1 rounded-xl hover:bg-slate-200 transition-all text-crm-white shrink-0"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
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
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative z-20">
              <LanguageSelector compact className="hidden lg:block" />
              {user ? (
                <>
                  {['admin', 'super_admin'].includes(user.role) && (
                    <Link to="/admin" className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-crm-purple text-white font-semibold text-sm hover:opacity-90 shrink-0">
                      <Shield className="w-4 h-4" /> {t('nav.admin')}
                    </Link>
                  )}
                  <Link to="/portal" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-crm-purple/10 border border-crm-purple/20 text-crm-purple text-sm shrink-0">
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span className="font-medium hidden sm:inline">{t('nav.portal')}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center justify-center p-2.5 rounded-lg border border-slate-300 bg-slate-100 text-crm-white hover:bg-slate-200 shrink-0"
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
                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-crm-gray-light hover:text-crm-white hover:bg-slate-200 shrink-0"
                  >
                    <LogIn className="w-4 h-4 shrink-0" /> {t('nav.signIn')}
                  </Link>
                  <Link
                    to="/portal"
                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-crm-purple border border-crm-purple/20 hover:bg-crm-purple/5 shrink-0"
                  >
                    <User className="w-4 h-4" /> {t('nav.portal')}
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg bg-crm-purple text-white font-bold text-xs sm:text-sm uppercase tracking-wide hover:opacity-90 shrink-0 whitespace-nowrap"
                  >
                    {t('nav.join')}
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="hidden xl:block border-t border-slate-100">
            <div className="flex items-center flex-wrap gap-0.5 py-2">
              {navLinks.map((link) => (
                <NavLinkItem key={link.path} link={link} />
              ))}
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="h-16 sm:h-20 xl:h-[7rem] shrink-0" aria-hidden="true" />

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 xl:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} aria-hidden />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute left-0 top-0 bottom-0 w-[min(320px,88vw)] bg-white border-r border-slate-200 flex flex-col shadow-2xl"
            >
              <div className="p-5 pt-20 border-b border-slate-200">
                <p className="text-lg font-bold text-crm-white">Menu</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLinkItem key={link.path} link={link} mobile />
                ))}
              </div>
              <div className="p-4 border-t border-slate-200 space-y-3">
                <LanguageSelector />
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link to="/portal" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-crm-purple/10 text-crm-purple">
                      <GraduationCap className="w-5 h-5" /> {t('nav.portal')}
                    </Link>
                    {['admin', 'super_admin'].includes(user.role) && (
                      <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-crm-purple text-white font-semibold">
                        <Shield className="w-5 h-5" /> {t('nav.admin')}
                      </Link>
                    )}
                    <button type="button" onClick={logout} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-300 bg-slate-100 text-crm-white">
                      <LogOut className="w-5 h-5" /> {t('nav.signOut')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/login" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-crm-white">
                      <LogIn className="w-5 h-5" /> {t('nav.signIn')}
                    </Link>
                    <Link to="/register" className="flex items-center justify-center py-3 rounded-lg bg-crm-purple text-white font-bold uppercase tracking-wide">
                      {t('nav.join')}
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
