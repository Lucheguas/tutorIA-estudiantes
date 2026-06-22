import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Calendar, BookOpen, GitBranch,
  FolderOpen, Brain, MessageSquare, Bell, LogOut, Award
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/asistencias', icon: Calendar, label: 'Asistencias' },
  { to: '/silabo', icon: BookOpen, label: 'Sílabo' },
  { to: '/ruta', icon: GitBranch, label: 'Ruta de Aprendizaje' },
  { to: '/recursos', icon: FolderOpen, label: 'Recursos' },
  { to: '/chat', icon: MessageSquare, label: 'Tutor IA' },
  { to: '/metodos', icon: Brain, label: 'Métodos de Estudio' },
]

export default function Sidebar() {
  const { profile } = useAuth()
  const { unread } = useNotifications()

  const xpForNextLevel = (profile?.level ?? 1) * 500
  const xpProgress = ((profile?.xp ?? 0) % xpForNextLevel) / xpForNextLevel * 100

  return (
    <aside className="w-64 bg-[#111] border-r border-[#222] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-[#222]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-orange-500" />
          </div>
          <span className="font-bold text-white text-lg">TutorIA</span>
        </div>
      </div>

      {/* XP / Level */}
      {profile && (
        <div className="p-4 border-b border-[#222]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-bold text-sm">
              {profile.full_name?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile.full_name}</p>
              <p className="text-gray-500 text-xs">{profile.career}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="flex items-center gap-1"><Award className="w-3 h-3 text-orange-500" /> Nivel {profile.level}</span>
            <span>{profile.xp % xpForNextLevel} / {xpForNextLevel} XP</span>
          </div>
          <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          {profile.streak > 0 && (
            <p className="text-xs text-orange-400 mt-2">🔥 {profile.streak} días seguidos</p>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        <NavLink
          to="/notificaciones"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              isActive ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
            }`
          }
        >
          <div className="relative">
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full text-[10px] text-white flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
          Notificaciones
        </NavLink>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[#222]">
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
