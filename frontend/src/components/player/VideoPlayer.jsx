import { useState, useRef, useCallback } from 'react'
import ReactPlayer from 'react-player'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, SkipBack, SkipForward, Users, Heart, Share2, Download, MessageCircle, ChevronDown } from 'lucide-react'
import LiveBadge from '../common/LiveBadge'

export default function VideoPlayer({ stream, onToggleChat, showChat }) {
  const [playing, setPlaying] = useState(true)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [quality, setQuality] = useState('auto')
  const [language, setLanguage] = useState('en')
  const [showSettings, setShowSettings] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(stream?.like_count || 0)
  const [viewerCount, setViewerCount] = useState(stream?.viewer_count || 0)
  const [showShareModal, setShowShareModal] = useState(false)

  const playerRef = useRef(null)
  const containerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'sw', label: 'Swahili', flag: '🇰🇪' },
    { code: 'pt', label: 'Portuguese', flag: '🇧🇷' },
    { code: 'fr', label: 'French', flag: '🇫🇷' },
    { code: 'es', label: 'Spanish', flag: '🇪🇸' },
    { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  ]

  const qualities = ['Auto', '1080p', '720p', '480p', '360p', '240p', '144p']

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => { if (playing) setShowControls(false) }, 3000)
  }, [playing])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const handleProgress = (state) => { setProgress(state.played); }
  const handleDuration = (dur) => { setDuration(dur); }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleLike = () => { setLiked(!liked); setLikeCount(prev => liked ? prev - 1 : prev + 1); }
  const copyLink = () => { navigator.clipboard.writeText(window.location.href); setShowShareModal(false); }

  const isLive = stream?.status === 'live'

  return (
    <div className="relative w-full">
      <div ref={containerRef} className="relative bg-black overflow-hidden group w-full aspect-video rounded-xl"
        onMouseMove={handleMouseMove} onMouseLeave={() => playing && setShowControls(false)}>
        <ReactPlayer ref={playerRef} url={stream?.stream_url} playing={playing} volume={volume} muted={muted}
          width="100%" height="100%" onProgress={handleProgress} onDuration={handleDuration}
          config={{ file: { forceHLS: true, hlsOptions: { maxBufferLength: 30, maxMaxBufferLength: 600 } } }} />

        <AnimatePresence>
          {showControls && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none">

              <div className="flex items-center justify-between p-4 pointer-events-auto">
                <div className="flex items-center gap-3">
                  {isLive && <LiveBadge size="md" />}
                  {!isLive && stream?.scheduled_for && (
                    <span className="text-sm text-crm-gray-light bg-black/50 px-3 py-1 rounded-full">Starts soon</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button onClick={() => { setShowLanguageMenu(!showLanguageMenu); setShowSettings(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white text-sm transition-all">
                      <span className="text-base">{languages.find(l => l.code === language)?.flag}</span>
                      <span className="hidden sm:inline">{languages.find(l => l.code === language)?.label}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showLanguageMenu && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-crm-dark border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                          {languages.map((lang) => (
                            <button key={lang.code} onClick={() => { setLanguage(lang.code); setShowLanguageMenu(false); }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                                language === lang.code ? 'bg-crm-purple/20 text-crm-purple' : 'text-crm-gray-light hover:bg-white/5 hover:text-white'
                              }`}>
                              <span className="text-lg">{lang.flag}</span><span>{lang.label}</span>
                              {language === lang.code && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-crm-purple" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative">
                    <button onClick={() => { setShowSettings(!showSettings); setShowLanguageMenu(false); }}
                      className="p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-all">
                      <Settings className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 top-full mt-2 w-40 bg-crm-dark border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                          <div className="px-3 py-2 text-xs text-crm-gray uppercase tracking-wider border-b border-white/10">Quality</div>
                          {qualities.map((q) => (
                            <button key={q} onClick={() => { setQuality(q); setShowSettings(false); }}
                              className={`w-full text-left px-4 py-2 text-sm transition-all ${quality === q ? 'bg-crm-purple/20 text-crm-purple' : 'text-crm-gray-light hover:bg-white/5 hover:text-white'}`}>
                              {q}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {!playing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                  <motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setPlaying(true)} className="w-20 h-20 rounded-full bg-crm-purple/90 flex items-center justify-center shadow-2xl">
                    <Play className="w-10 h-10 text-crm-black ml-1" fill="currentColor" />
                  </motion.button>
                </div>
              )}

              <div className="p-4 pointer-events-auto">
                <div className="relative h-1 bg-white/20 rounded-full mb-3 cursor-pointer group/progress">
                  <div className="absolute inset-y-0 left-0 bg-crm-purple rounded-full" style={{ width: `${progress * 100}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-crm-purple rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" style={{ left: `${progress * 100}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPlaying(!playing)} className="p-2 rounded-lg hover:bg-white/10 transition-all">
                      {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <button onClick={() => playerRef.current?.seekTo(Math.max(0, progress - 10 / duration), 'seconds')}
                      className="p-2 rounded-lg hover:bg-white/10 transition-all hidden sm:block"><SkipBack className="w-4 h-4" /></button>
                    <button onClick={() => playerRef.current?.seekTo(Math.min(1, progress + 10 / duration), 'seconds')}
                      className="p-2 rounded-lg hover:bg-white/10 transition-all hidden sm:block"><SkipForward className="w-4 h-4" /></button>
                    <div className="flex items-center gap-2 group/volume">
                      <button onClick={() => setMuted(!muted)} className="p-2 rounded-lg hover:bg-white/10 transition-all">
                        {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-200">
                        <input type="range" min="0" max="1" step="0.1" value={muted ? 0 : volume}
                          onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                          className="w-20 h-1 accent-crm-purple cursor-pointer" />
                      </div>
                    </div>
                    <span className="text-xs text-crm-gray-light hidden sm:inline">{formatTime(progress * duration)} / {formatTime(duration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-white/10 transition-all" title="Fullscreen">
                      {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLive && <div className="absolute top-4 left-4 pointer-events-none"><LiveBadge size="md" /></div>}
      </div>

      <div className="mt-4 px-1">
        <h1 className="text-xl sm:text-2xl font-bold text-crm-white leading-tight">{stream?.title}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-crm-gray-light">
          <span className="text-crm-purple font-medium">{stream?.speaker}</span>
          <span>•</span><span>{stream?.bible_reference}</span>
          {isLive && <><span>•</span><span className="flex items-center gap-1 text-crm-live"><Users className="w-3.5 h-3.5" />{viewerCount.toLocaleString()} watching</span></>}
        </div>

        <div className="flex items-center gap-2 mt-4 pb-4 border-b border-white/10">
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              liked ? 'bg-crm-purple/20 text-crm-purple border border-crm-purple/30' : 'bg-white/5 text-crm-gray-light hover:bg-white/10 hover:text-white border border-white/10'
            }`}>
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /><span>{likeCount.toLocaleString()}</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-crm-gray-light hover:bg-white/10 hover:text-white border border-white/10 transition-all">
            <Share2 className="w-4 h-4" /><span className="hidden sm:inline">Share</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-crm-gray-light hover:bg-white/10 hover:text-white border border-white/10 transition-all">
            <Download className="w-4 h-4" /><span className="hidden sm:inline">Download</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onToggleChat}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ml-auto sm:ml-0 ${
              showChat ? 'bg-crm-purple/20 text-crm-purple border border-crm-purple/30' : 'bg-white/5 text-crm-gray-light hover:bg-white/10 hover:text-white border border-white/10'
            }`}>
            <MessageCircle className="w-4 h-4" /><span className="hidden sm:inline">Chat</span>
          </motion.button>
        </div>

        <div className="mt-4 pb-4">
          <p className="text-crm-gray-light text-sm leading-relaxed">{stream?.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {stream?.topics?.map((topic) => (
              <span key={topic} className="px-3 py-1 text-xs rounded-full bg-crm-purple/10 text-crm-purple border border-crm-purple/20">{topic}</span>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showShareModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-crm-dark border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Share This Message</h3>
              <div className="flex gap-3 mb-4">
                {['WhatsApp', 'Facebook', 'Twitter', 'Telegram', 'Email'].map((platform) => (
                  <button key={platform} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium transition-all">{platform}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={window.location.href} readOnly
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-crm-gray-light" />
                <button onClick={copyLink} className="px-4 py-2.5 rounded-xl bg-crm-purple text-crm-black font-bold text-sm hover:bg-crm-purple-light transition-all">Copy</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
