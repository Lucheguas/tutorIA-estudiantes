import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export interface Notif {
  id:         string
  title:      string
  message:    string
  type:       'warning' | 'info' | 'success' | 'danger'
  read:       boolean
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notif[]>([])

  async function load() {
    if (!user) return
    const { data, error } = await supabase
      .from('notifications')
      .select('id,title,message,type,read,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    // Tabla puede no existir — simplemente queda vacío
    if (!error && data) setNotifications(data as Notif[])
  }

  useEffect(() => { load() }, [user])

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return {
    notifications,
    unread: notifications.filter(n => !n.read).length,
    markRead,
    markAllRead,
    reload: load,
  }
}
