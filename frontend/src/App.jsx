import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/common/Navbar'
import MiniAudioPlayer from './components/audio/MiniAudioPlayer'
import Home from './pages/Home'
import LiveStreamPage from './pages/LiveStreamPage'
import MediaLibrary from './pages/MediaLibrary'
import SeriesPage from './pages/SeriesPage'
import PrayerWall from './pages/PrayerWall'
import Login from './pages/Login'
import Register from './pages/Register'
import Portal from './pages/Portal'
import Support from './pages/Support'
import About from './pages/About'
import MediaWatch from './pages/MediaWatch'
import DiscipleshipLibrary from './pages/DiscipleshipLibrary'
import SpiritualMaterialView from './pages/SpiritualMaterialView'
import AdminDashboard from './pages/AdminDashboard'
import { AuthProvider } from './context/AuthContext'
import { PlayerProvider } from './context/PlayerContext'

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <AuthProvider>
      <PlayerProvider>
        <div className="min-h-screen bg-crm-black">
          <Navbar />
          <main className={isMobile ? 'pb-24 safe-bottom' : ''}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/live/:streamId" element={<LiveStreamPage />} />
              <Route path="/live" element={<LiveStreamPage />} />
              <Route path="/media/:mediaId" element={<MediaWatch />} />
              <Route path="/media" element={<MediaLibrary />} />
              <Route path="/series/:seriesId" element={<SeriesPage />} />
              <Route path="/prayer" element={<PrayerWall />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/portal" element={<Portal />} />
              <Route path="/discipleship/:materialId" element={<SpiritualMaterialView />} />
              <Route path="/discipleship" element={<DiscipleshipLibrary />} />
              <Route path="/about" element={<About />} />
              <Route path="/support" element={<Support />} />
              <Route path="/give" element={<Navigate to="/support" replace />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          <MiniAudioPlayer />
        </div>
      </PlayerProvider>
    </AuthProvider>
  )
}

export default App
