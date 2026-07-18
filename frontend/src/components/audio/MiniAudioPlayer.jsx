import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronUp, Download, ListMusic, Clock } from 'lucide-react'
import { usePlayer } from '../../context/PlayerContext'

export default function MiniAudioPlayer() {
  const { currentTrack, isPlaying, progress, duration, volume, playbackSpeed, isExpanded,
    togglePlay, nextTrack, prevTrack, setVolume, setPlaybackSpeed, setIsExpanded, setDuration, setProgress } = usePlayer()
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const audioRef = useRef(null)
  const progressRef = useRef(null)
  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackSpeed }, [playbackSpeed])
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume }, [volume])

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) { setProgress(audioRef.current.currentTime); setDuration(audioRef.current.duration || 0) }
  }

  const handleSeek = (e) => {
    const rect = progressRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    if (audioRef.current) { audioRef.current.currentTime = newTime; setProgress(newTime) }
  }

  if (!currentTrack) return null

  return (
    <>
      <audio ref={audioRef} src={currentTrack.audio_url} onTimeUpdate={handleTimeUpdate} onEnded={nextTrack} autoPlay={isPlaying} />
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-40 bg-crm-dark/95 backdrop-blur-xl border-t border-white/10">
        <div ref={progressRef} className="h-1 bg-white/10 cursor-pointer group/progress" onClick={handleSeek}>
          <div className="h-full bg-crm-purple relative" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-crm-purple rounded-full opacity-0 group-hover/progress:opacity-100 shadow-lg" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsExpanded(!isExpanded)}
            className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative group">
            <img src={currentTrack.thumbnail_url} alt={currentTrack.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronUp className="w-4 h-4 text-white" />
            </div>
          </motion.button>
          <div className="flex-1 min-w-0 hidden sm:block">
            <h4 className="text-sm font-medium text-crm-white truncate">{currentTrack.title}</h4>
            <p className="text-xs text-crm-gray truncate">{currentTrack.speaker}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={prevTrack} className="p-2 rounded-lg hover:bg-white/10 text-crm-gray-light hover:text-white transition-all"><SkipBack className="w-4 h-4" /></button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-crm-purple flex items-center justify-center hover:bg-crm-purple-light transition-all">
              {isPlaying ? <Pause className="w-4 h-4 text-crm-black" fill="currentColor" /> : <Play className="w-4 h-4 text-crm-black ml-0.5" fill="currentColor" />}
            </motion.button>
            <button onClick={nextTrack} className="p-2 rounded-lg hover:bg-white/10 text-crm-gray-light hover:text-white transition-all"><SkipForward className="w-4 h-4" /></button>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs text-crm-gray font-mono">{formatTime(progress)} / {formatTime(duration)}</span>
            <div className="flex items-center gap-1 group/volume">
              <button onClick={() => setVolume(volume === 0 ? 0.8 : 0)} className="p-1.5 rounded hover:bg-white/10 text-crm-gray-light">
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-200">
                <input type="range" min="0" max="1" step="0.1" value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 h-1 accent-crm-purple cursor-pointer" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-lg bg-white/5 text-xs text-crm-gray-light hover:bg-white/10 transition-all">{playbackSpeed}x</button>
              <AnimatePresence>
                {showSpeedMenu && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-2 w-20 bg-crm-dark border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    {speeds.map((s) => (
                      <button key={s} onClick={() => { setPlaybackSpeed(s); setShowSpeedMenu(false); }}
                        className={`w-full px-3 py-2 text-xs transition-all ${playbackSpeed === s ? 'bg-crm-purple/20 text-crm-purple' : 'text-crm-gray-light hover:bg-white/5'}`}>
                        {s}x
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-lg hover:bg-white/10 text-crm-gray-light transition-all">
              <ChevronUp className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-crm-black/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setIsExpanded(false)}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}
              className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 shadow-2xl">
                <img src={currentTrack.thumbnail_url} alt={currentTrack.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <h2 className="text-2xl font-bold text-crm-white text-center mb-1">{currentTrack.title}</h2>
              <p className="text-crm-gray text-center mb-6">{currentTrack.speaker}</p>
              <div className="h-2 bg-white/10 rounded-full cursor-pointer mb-2" onClick={handleSeek}>
                <div className="h-full bg-crm-purple rounded-full relative" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-crm-purple rounded-full shadow-lg" />
                </div>
              </div>
              <div className="flex justify-between text-xs text-crm-gray mb-6"><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div>
              <div className="flex items-center justify-center gap-6">
                <button onClick={prevTrack} className="p-3 rounded-full hover:bg-white/10 text-crm-gray-light"><SkipBack className="w-6 h-6" /></button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-crm-purple flex items-center justify-center hover:bg-crm-purple-light transition-all">
                  {isPlaying ? <Pause className="w-8 h-8 text-crm-black" fill="currentColor" /> : <Play className="w-8 h-8 text-crm-black ml-1" fill="currentColor" />}
                </motion.button>
                <button onClick={nextTrack} className="p-3 rounded-full hover:bg-white/10 text-crm-gray-light"><SkipForward className="w-6 h-6" /></button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-8">
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm text-crm-gray-light transition-all"><Download className="w-4 h-4" /> Download</button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm text-crm-gray-light transition-all"><ListMusic className="w-4 h-4" /> Queue</button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm text-crm-gray-light transition-all"><Clock className="w-4 h-4" /> Sleep Timer</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
