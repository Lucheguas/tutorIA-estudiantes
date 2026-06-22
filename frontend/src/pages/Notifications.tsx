import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../context/AuthContext'
import { apiGet } from '../lib/apiClient'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Notification } from '../types'

const typeConfig = {
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  danger: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
}

interface ApiNotification {
  id: string
  title?: string
  message?: string
  body?: string
  type?: string
  created_at?: string
  timestamp?: string
}

function normalizeApiNotif(n: ApiNotification): Notification {
  const validTypes = ['warning', 'info', 'success', 'danger']
  const type = validTypes.includes(n.type ?? '') ? (n.type as Notification['type']) : 'info'
  return {
    id: `api-${n.id}`,
    user_id: '',
    title: n.title ?? 'Notificación',
    message: n.message ?? n.body ?? '',
    type,
    read: false,
    created_at: n.created_at ?? n.timestamp ?? new Date().toISOString(),
  }
}

export default function Notifications() {
  const { profile } = useAuth()
  const { notifications: supabaseNotifs, unread: supabaseUnread, markRead, markAllRead } = useNotifications()
  const [apiNotifs, setApiNotifs] = useState<Notification[]>([])

  // Fetch additional notifications from the AI API
  useEffect(() => {
    if (!profile) return
    apiGet<ApiNotification[] | { notifications?: ApiNotification[] }>(`/notifications?studentId=${profile.id}`)
      .then(data => {
        const list = Array.isArray(data) ? data : (data.notifications ?? [])
        setApiNotifs(list.map(normalizeApiNotif))
      })
      .catch(() => {
        // Non-fatal: Supabase notifications still work
        setApiNotifs([])
      })
  }, [profile])

  // Merge and deduplicate: Supabase first (they can be marked read), then API ones
  const allNotifications: Notification[] = [
    ...supabaseNotifs,
    ...apiNotifs.filter(an => !supabaseNotifs.some(sn => sn.id === an.id)),
  ]

  const totalUnread = supabaseUnread + apiNotifs.filter(n => !n.read).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-500" /> Notificaciones
          </h1>
          <p className="text-gray-400 mt-1">{totalUnread} sin leer</p>
        </div>
        {supabaseUnread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white bg-[#1a1a1a] border border-[#333] transition"
          >
            <CheckCheck className="w-4 h-4" /> Marcar todas leídas
          </button>
        )}
      </div>

      <div className="space-y-3">
        {allNotifications.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No tienes notificaciones aún.</p>
          </div>
        )}

        {allNotifications.map((notif, idx) => {
          const { icon: Icon, color, bg } = typeConfig[notif.type] ?? typeConfig.info
          const isSupabase = !notif.id.startsWith('api-')

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => isSupabase && !notif.read && markRead(notif.id)}
              className={`border rounded-2xl p-4 flex items-start gap-3 transition-all ${
                isSupabase ? 'cursor-pointer' : 'cursor-default'
              } ${
                notif.read ? 'bg-[#111] border-[#222] opacity-60' : `${bg}`
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white font-medium text-sm">{notif.title}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 mt-1" />
                    )}
                    {!isSupabase && (
                      <span className="text-xs text-gray-600 bg-[#1a1a1a] border border-[#2a2a2a] px-1.5 py-0.5 rounded-md">IA</span>
                    )}
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-0.5">{notif.message}</p>
                <p className="text-gray-600 text-xs mt-2">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
