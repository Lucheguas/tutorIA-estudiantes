import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import ProfileQuestionnaire from './pages/ProfileQuestionnaire'
import Dashboard from './pages/Dashboard'
import AttendancePage from './pages/Attendance'
import SyllabusPage from './pages/Syllabus'
import LearningPath from './pages/LearningPath'
import Resources from './pages/Resources'
import Chat from './pages/Chat'
import StudyMethods from './pages/StudyMethods'
import Notifications from './pages/Notifications'
import Sidebar from './components/layout/Sidebar'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  // Profile incomplete — needs career set
  if (!profile?.career) return <ProfileQuestionnaire />

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/asistencias" element={<AttendancePage />} />
          <Route path="/silabo" element={<SyllabusPage />} />
          <Route path="/ruta" element={<LearningPath />} />
          <Route path="/recursos" element={<Resources />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/metodos" element={<StudyMethods />} />
          <Route path="/notificaciones" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
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
