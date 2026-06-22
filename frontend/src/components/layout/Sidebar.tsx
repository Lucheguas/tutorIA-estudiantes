import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Calendar, GitBranch,
  FolderOpen, Brain, MessageSquare, Bell, LogOut, BookOpen, X
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/asistencias',    icon: Calendar,         label: 'Asistencias' },
  { to: '/ruta',           icon: GitBranch,        label: 'Ruta de Aprendizaje' },
  { to: '/recursos',       icon: FolderOpen,       label: 'Recursos' },
  { to: '/chat',           icon: MessageSquare,    label: 'Tutor IA' },
  { to: '/metodos',        icon: Brain,            label: 'Métodos de Estudio' },
  { to: '/notificaciones', icon: Bell,             label: 'Notificaciones' },
]

interface SidebarProps {
  isOpen:  boolean
  onClose: () => void
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth()

  const riesgoColor = {
    ROJO:       'text-red-400 bg-red-500/20',
    ROJO_FALTAS:'text-red-400 bg-red-500/20',
    AMBAR:      'text-yellow-400 bg-yellow-500/20',
    VERDE:      'text-green-400 bg-green-500/20',
    PENDIENTE:  'text-stone-500 bg-gray-500/20',
  }[profile?.riesgo ?? 'PENDIENTE'] ?? 'text-stone-500 bg-gray-500/20'

  return (
    <div className="flex flex-col h-full">
      {/* Logo + close on mobile */}
      <div className="p-5 border-b border-[#e8e4df] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-orange-500" />
          </div>
          <span className="font-bold text-stone-900 text-lg">TutorIA</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-[#f5f3f0] transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Student info */}
      {profile && (
        <div className="p-4 border-b border-[#e8e4df]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-stone-900 font-bold text-sm flex-shrink-0">
              {profile.iniciales}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-stone-900 text-sm font-medium truncate leading-tight">
                {profile.nombre.split(' ').slice(2).join(' ') || profile.nombre.split(' ')[0]}
              </p>
              <p className="text-stone-400 text-xs truncate">{profile.codigo}@unfv.edu.pe</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-[#f5f3f0] text-stone-500 border border-[#d6d0ca] px-2 py-1 rounded-lg">
              Sección {profile.seccion}
            </span>
            {profile.promedio !== null && (
              <span className="text-xs bg-[#f5f3f0] text-orange-400 border border-orange-500/30 px-2 py-1 rounded-lg">
                Prom. {profile.promedio.toFixed(1)}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-lg ${riesgoColor}`}>
              {profile.riesgo === 'VERDE' ? 'Al día' :
               profile.riesgo === 'AMBAR' ? 'Atención' :
               profile.riesgo === 'PENDIENTE' ? 'Sin notas' : 'En riesgo'}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-[#f5f3f0]'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[#e8e4df]">
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop: always visible */}
      <aside className="hidden md:flex w-64 bg-white border-r border-[#e8e4df] flex-col h-screen sticky top-0 flex-shrink-0">
        <SidebarContent onClose={onClose} />
      </aside>

      {/* Mobile: slide-over drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="md:hidden fixed inset-y-0 left-0 w-72 bg-white border-r border-[#e8e4df] flex flex-col z-30"
          >
            <SidebarContent onClose={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
