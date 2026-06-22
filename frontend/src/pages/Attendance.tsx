import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { StudentCourse, Attendance as AttendanceType } from '../types'
import { CheckCircle, XCircle, AlertTriangle, Calendar } from 'lucide-react'

const WEEKS = Array.from({ length: 16 }, (_, i) => i + 1)

export default function AttendancePage() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState<StudentCourse[]>([])
  const [attendance, setAttendance] = useState<AttendanceType[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('student_courses').select('*, course:courses(*)').eq('student_id', profile.id).eq('cycle', profile.cycle),
      supabase.from('attendance').select('*').eq('student_id', profile.id),
    ]).then(([{ data: c }, { data: a }]) => {
      setCourses(c ?? [])
      setAttendance(a ?? [])
      if (c && c.length > 0) setSelected(c[0].course_id)
    }).finally(() => setLoading(false))
  }, [profile])

  const courseAttendance = attendance.filter(a => a.course_id === selected)
  const absences = courseAttendance.filter(a => !a.present).length
  const absenceRate = WEEKS.length > 0 ? absences / 16 : 0
  const isAtRisk = absenceRate >= 0.3

  function getStatus(week: number) {
    const rec = courseAttendance.find(a => a.week === week)
    if (!rec) return 'pending'
    return rec.present ? 'present' : 'absent'
  }

  const currentCourse = courses.find(c => c.course_id === selected)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-orange-500" /> Asistencias
        </h1>
        <p className="text-gray-400 mt-1">Registro de asistencia por curso · 16 semanas</p>
      </div>

      {/* Course selector */}
      <div className="flex flex-wrap gap-2">
        {courses.map(c => (
          <button
            key={c.course_id}
            onClick={() => setSelected(c.course_id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selected === c.course_id
                ? 'bg-orange-500 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#333]'
            }`}
          >
            {c.course?.name}
          </button>
        ))}
      </div>

      {selected && (
        <>
          {/* Risk banner */}
          {isAtRisk && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-300">
                <strong>Riesgo académico:</strong> {absences} inasistencias ({Math.round(absenceRate * 100)}%).
                Si supera 4 inasistencias podría ser retirado del curso.
              </p>
            </motion.div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Asistencias', value: courseAttendance.filter(a => a.present).length, color: 'text-green-400' },
              { label: 'Inasistencias', value: absences, color: 'text-red-400' },
              { label: '% Asistencia', value: `${Math.round((1 - absenceRate) * 100)}%`, color: isAtRisk ? 'text-red-400' : 'text-orange-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass rounded-2xl p-4 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-gray-400 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Week grid */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-5">
              {currentCourse?.course?.name} — Asistencia por semana
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {WEEKS.map(week => {
                const status = getStatus(week)
                return (
                  <motion.div
                    key={week}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: week * 0.03 }}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center border transition-all ${
                      status === 'present' ? 'bg-green-500/20 border-green-500/40' :
                      status === 'absent' ? 'bg-red-500/20 border-red-500/40' :
                      'bg-[#1a1a1a] border-[#2a2a2a]'
                    }`}
                  >
                    <span className="text-xs text-gray-500 mb-1">S{week}</span>
                    {status === 'present' && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {status === 'absent' && <XCircle className="w-5 h-5 text-red-400" />}
                    {status === 'pending' && <span className="w-2 h-2 rounded-full bg-[#333]" />}
                  </motion.div>
                )
              })}
            </div>
            <div className="flex items-center gap-6 mt-5 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-400" /> Asistió</span>
              <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-red-400" /> Faltó</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-[#333]" /> Sin registro</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
