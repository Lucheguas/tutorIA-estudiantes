import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface EstudianteProfile {
  profile_id:    string
  estudiante_id: string
  codigo:        string
  nombre:        string
  iniciales:     string
  seccion:       string
  grupo:         string
  parcial:       number | null
  final:         number | null
  practica:      number | null
  promedio:      number | null
  faltas:        number
  presentes:     number
  sesiones:      { sesion: number; presente: boolean }[]
  matricula_id:  string
  riesgo:        'ROJO' | 'ROJO_FALTAS' | 'AMBAR' | 'VERDE' | 'PENDIENTE'
}

interface AuthContextType {
  user:           User | null
  session:        Session | null
  profile:        EstudianteProfile | null
  loading:        boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, loading: true,
  refreshProfile: async () => {}
})

const CURSO_ID = '00000000-0000-0000-0000-000000000002'

function calcRiesgo(promedio: number | null, faltas: number): EstudianteProfile['riesgo'] {
  if (promedio === null) return faltas >= 5 ? 'ROJO_FALTAS' : 'PENDIENTE'
  if (promedio < 11 || faltas >= 5) return 'ROJO'
  if (promedio < 13) return 'AMBAR'
  return 'VERDE'
}

function iniciales(nombre: string) {
  const p = nombre.trim().split(/\s+/)
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase()
}

async function fetchProfile(userId: string): Promise<EstudianteProfile | null> {
  // 1. Link user → estudiante
  const { data: sp } = await supabase
    .from('student_profiles')
    .select('id, estudiante_id')
    .eq('user_id', userId)
    .single()
  if (!sp) return null

  // 2. Datos del estudiante
  const { data: est } = await supabase
    .from('estudiantes')
    .select('id, codigo, apellidos_y_nombres, seccion, grupo')
    .eq('id', sp.estudiante_id)
    .single()
  if (!est) return null

  // 3. Matrícula
  const { data: mat } = await supabase
    .from('matriculas')
    .select('id')
    .eq('estudiante_id', sp.estudiante_id)
    .eq('curso_id', CURSO_ID)
    .single()
  if (!mat) return null

  // 4. Notas + asistencias en paralelo
  const [{ data: notas }, { data: asist }] = await Promise.all([
    supabase.from('notas_con_promedio').select('parcial,final,practica,promedio').eq('matricula_id', mat.id).single(),
    supabase.from('asistencias').select('sesion,presente').eq('matricula_id', mat.id).order('sesion'),
  ])

  const sesiones  = (asist ?? []) as { sesion: number; presente: boolean }[]
  const faltas    = sesiones.filter(a => !a.presente).length
  const presentes = sesiones.filter(a => a.presente).length

  return {
    profile_id:    sp.id,
    estudiante_id: sp.estudiante_id,
    codigo:        est.codigo,
    nombre:        est.apellidos_y_nombres,
    iniciales:     iniciales(est.apellidos_y_nombres),
    seccion:       est.seccion,
    grupo:         est.grupo ?? '',
    parcial:       notas?.parcial  ?? null,
    final:         notas?.final    ?? null,
    practica:      notas?.practica ?? null,
    promedio:      notas?.promedio ?? null,
    faltas,
    presentes,
    sesiones,
    matricula_id:  mat.id,
    riesgo:        calcRiesgo(notas?.promedio ?? null, faltas),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<EstudianteProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshProfile() {
    if (user) setProfile(await fetchProfile(user.id))
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).then(p => { setProfile(p); setLoading(false) })
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).then(setProfile)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
