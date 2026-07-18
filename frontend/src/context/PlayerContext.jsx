import { createContext, useState, useContext } from 'react'

const PlayerContext = createContext()

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(0)

  const playTrack = (track, tracks = []) => {
    setCurrentTrack(track)
    setIsPlaying(true)
    setProgress(0)
    if (tracks.length > 0) {
      const idx = tracks.findIndex(t => t.id === track.id)
      setQueue(tracks)
      setQueueIndex(idx >= 0 ? idx : 0)
    }
  }

  const togglePlay = () => setIsPlaying(!isPlaying)

  const nextTrack = () => {
    if (queue.length > 0) {
      const nextIdx = (queueIndex + 1) % queue.length
      setQueueIndex(nextIdx)
      setCurrentTrack(queue[nextIdx])
      setProgress(0)
    }
  }

  const prevTrack = () => {
    if (queue.length > 0) {
      const prevIdx = queueIndex > 0 ? queueIndex - 1 : queue.length - 1
      setQueueIndex(prevIdx)
      setCurrentTrack(queue[prevIdx])
      setProgress(0)
    }
  }

  const seek = (time) => setProgress(time)

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, progress, duration, volume, playbackSpeed, isExpanded, queue, queueIndex,
      playTrack, togglePlay, nextTrack, prevTrack, seek, setVolume, setPlaybackSpeed, setIsExpanded, setDuration, setProgress
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => useContext(PlayerContext)
