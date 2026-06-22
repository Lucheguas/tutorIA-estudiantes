import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Menu } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AttendancePage from './pages/Attendance'
import LearningPath from './pages/LearningPath'
import Resources from './pages/Resources'
import Chat from './pages/Chat'
import StudyMethods from './pages/StudyMethods'
import Notifications from './pages/Notifications'
import Sidebar from './components/layout/Sidebar'

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-500 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  if (!profile) return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-500 text-sm">Cargando tu perfil...</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#faf9f7]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#e8e4df] bg-white sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-[#f5f3f0] transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-stone-900">E-Tutor UNFV</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-stone-900 text-xs font-bold">
              {profile.iniciales}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/asistencias" element={<AttendancePage />} />
            <Route path="/ruta" element={<LearningPath />} />
            <Route path="/recursos" element={<Resources />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/metodos" element={<StudyMethods />} />
            <Route path="/notificaciones" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a1a', color: '#f1f5f9', border: '1px solid #333' },
            success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
