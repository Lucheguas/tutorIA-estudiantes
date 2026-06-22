import { motion } from 'framer-motion'
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import { useNotifications, type Notif } from '../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const typeConfig = {
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  danger: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
}

export default function Notifications() {
  const { notifications, unread, markRead, markAllRead } = useNotifications()

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-500" /> Notificaciones
          </h1>
          <p className="text-gray-400 mt-1">{unread} sin leer</p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white bg-[#1a1a1a] border border-[#333] transition"
          >
            <CheckCheck className="w-4 h-4" /> Marcar todas leídas
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No tienes notificaciones aún.</p>
          </div>
        )}

        {notifications.map((notif: Notif, idx) => {
          const { icon: Icon, color, bg } = typeConfig[notif.type] ?? typeConfig.info

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => !notif.read && markRead(notif.id)}
              className={`border rounded-2xl p-4 flex items-start gap-3 transition-all cursor-pointer ${
                notif.read ? 'bg-[#111] border-[#222] opacity-60' : `${bg}`
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white font-medium text-sm">{notif.title}</p>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1" />
                  )}
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
