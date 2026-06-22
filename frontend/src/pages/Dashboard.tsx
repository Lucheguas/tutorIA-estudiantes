import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { StudentCourse, Attendance } from '../types'
import {
  TrendingUp, TrendingDown, Award, BookOpen, AlertTriangle,
  User, Calendar, Star, Activity
} from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'

const CURRENT_WEEK = 12 // can be dynamic

function StatCard({ icon: Icon, label, value, sub, color = 'orange', glow = false }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; glow?: boolean
}) {
  const colors: Record<string, string> = {
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 ${glow ? 'glow' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <Icon className={`w-5 h-5 ${colors[color].split(' ').pop()}`} />
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </motion.div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState<StudentCourse[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    Promise.all([loadCourses(), loadAttendance()]).finally(() => setLoading(false))
  }, [profile])

  async function loadCourses() {
    if (!profile) return
    const { data } = await supabase
      .from('student_courses')
      .select('*, course:courses(*)')
      .eq('student_id', profile.id)
      .eq('cycle', profile.cycle)
    setCourses(data ?? [])
  }

  async function loadAttendance() {
    if (!profile) return
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', profile.id)
    setAttendance(data ?? [])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const grades = courses.filter(c => c.grade !== null).map(c => c.grade as number)
  const highestGrade = grades.length ? Math.max(...grades) : 0
  const lowestGrade = grades.length ? Math.min(...grades) : 0
  const totalCredits = courses.filter(c => c.grade !== null && c.grade >= 11)
    .reduce((acc, c) => acc + (c.course?.credits ?? 0), 0)

  // Attendance risk per course
  const courseRisk = courses.map(sc => {
    const courseAttendance = attendance.filter(a => a.course_id === sc.course_id)
    const absences = courseAttendance.filter(a => !a.present).length
    const totalClasses = CURRENT_WEEK
    const absenceRate = totalClasses > 0 ? absences / totalClasses : 0
    return { ...sc, absences, absenceRate, atRisk: absenceRate >= 0.3 }
  })

  const atRiskCourses = courseRisk.filter(c => c.atRisk)

  const radarData = courses.slice(0, 6).map(c => ({
    subject: c.course?.name?.slice(0, 12) ?? '',
    nota: c.grade ?? 0,
  }))

  const xpForNextLevel = profile!.level * 500

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hola, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 mt-1">{profile?.career} · {profile?.cycle}° ciclo</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Semana actual</div>
          <div className="text-3xl font-bold text-orange-400">{CURRENT_WEEK}</div>
          <div className="text-xs text-gray-500">de 16</div>
        </div>
      </div>

      {/* Risk Alert */}
      {atRiskCourses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium">⚠️ Riesgo académico detectado</p>
            <p className="text-red-400/70 text-sm mt-0.5">
              {atRiskCourses.map(c => c.course?.name).join(', ')} — supera 33% de inasistencias.
              Tu tutor ha sido notificado.
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Semana actual" value={`${CURRENT_WEEK}/16`} color="orange" glow />
        <StatCard icon={BookOpen} label="Créditos aprobados" value={totalCredits} sub="este ciclo" color="green" />
        <StatCard icon={TrendingUp} label="Nota más alta" value={highestGrade} color="blue" />
        <StatCard icon={TrendingDown} label="Nota más baja" value={lowestGrade} color={lowestGrade < 11 ? 'red' : 'orange'} />
      </div>

      {/* XP Progress */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-500" />
            <span className="text-white font-medium">Nivel {profile?.level}</span>
          </div>
          <span className="text-sm text-gray-400">{profile?.xp} / {xpForNextLevel} XP</span>
        </div>
        <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(((profile?.xp ?? 0) % xpForNextLevel) / xpForNextLevel * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
          <span>🔥 {profile?.streak} días de racha</span>
          <span>⭐ {profile?.xp} XP total</span>
        </div>
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Courses list */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" /> Cursos del ciclo
          </h3>
          <div className="space-y-3">
            {courses.length === 0 && <p className="text-gray-500 text-sm">No hay cursos registrados.</p>}
            {courseRisk.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#222] last:border-0">
                <div>
                  <p className="text-white text-sm">{c.course?.name}</p>
                  <p className="text-gray-500 text-xs">{c.course?.credits} créditos</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    c.grade === null ? 'text-gray-500' :
                    c.grade >= 14 ? 'text-green-400' :
                    c.grade >= 11 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {c.grade ?? '--'}
                  </p>
                  {c.atRisk && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md">
                      Riesgo
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar chart */}
        {radarData.length > 2 && (
          <div className="glass rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-orange-500" /> Rendimiento por curso
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2a2a2a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Radar dataKey="nota" stroke="#f97316" fill="#f97316" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Student info */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-orange-500" /> Datos personales
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Nombre', value: profile?.full_name },
            { label: 'Carrera', value: profile?.career },
            { label: 'Ciclo', value: `${profile?.cycle}°` },
            { label: 'Correo', value: profile?.email },
            { label: 'Rendimiento previo', value: profile?.academic_performance },
            { label: 'Horas de estudio', value: profile?.weekly_study_hours },
            { label: 'Situación laboral', value: profile?.work_situation },
            { label: 'Estilo de aprendizaje', value: profile?.learning_style },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-gray-500">{label}</p>
              <p className="text-white mt-0.5 font-medium">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
