import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/common/Navbar'
import MiniAudioPlayer from './components/audio/MiniAudioPlayer'
import Home from './pages/Home'
import LiveStreamPage from './pages/LiveStreamPage'
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
import Contact from './pages/Contact'
import EventsNews from './pages/EventsNews'
import Ministries from './pages/Ministries'
import Sermons from './pages/Sermons'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
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
      <LanguageProvider>
      <PlayerProvider>
        <div className="min-h-screen bg-crm-black">
          <Navbar />
          <main className={isMobile ? 'pb-24 safe-bottom' : ''}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/live/:streamId" element={<LiveStreamPage />} />
              <Route path="/live" element={<LiveStreamPage />} />
              <Route path="/media/:mediaId" element={<MediaWatch />} />
              <Route path="/media" element={<Navigate to="/sermons" replace />} />
              <Route path="/sermons/:mediaId" element={<MediaWatch />} />
              <Route path="/sermons" element={<Sermons />} />
              <Route path="/series/:seriesId" element={<SeriesPage />} />
              <Route path="/prayer" element={<PrayerWall />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/portal/profile" element={<Profile />} />
              <Route path="/portal" element={<Portal />} />
              <Route path="/discipleship/:materialId" element={<SpiritualMaterialView />} />
              <Route path="/discipleship" element={<DiscipleshipLibrary />} />
              <Route path="/about" element={<About />} />
              <Route path="/ministries" element={<Ministries />} />
              <Route path="/events" element={<EventsNews />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/support" element={<Support />} />
              <Route path="/give" element={<Navigate to="/support" replace />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          <MiniAudioPlayer />
        </div>
      </PlayerProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App
