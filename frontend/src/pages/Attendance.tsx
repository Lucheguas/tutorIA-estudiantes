import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, XCircle, AlertTriangle, Calendar } from 'lucide-react'

const TOTAL = 16

export default function AttendancePage() {
  const { profile } = useAuth()
  if (!profile) return null

  const sesiones = profile.sesiones ?? []
  const registradas = sesiones.length
  const pct = registradas > 0 ? Math.round(profile.presentes / registradas * 100) : 0
  const isAtRisk = profile.faltas >= 5 || (registradas > 0 && profile.faltas / registradas >= 0.33)

  function getStatus(s: number) {
    const rec = sesiones.find(x => x.sesion === s)
    if (!rec) return 'pending'
    return rec.presente ? 'present' : 'absent'
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /> Asistencias
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Base de Datos II · Sección {profile.seccion} · 16 sesiones
        </p>
      </div>

      {/* Risk banner */}
      {isAtRisk && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">
            <strong>Riesgo:</strong> tienes {profile.faltas} falta(s).
            {profile.faltas >= 5
              ? ' Ya superaste el límite — habla con tu tutor.'
              : ' Si llegas a 5, podrías ser retirado del curso.'}
          </p>
        </motion.div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Asistencias',  value: profile.presentes,         color: 'text-green-400' },
          { label: 'Faltas',       value: profile.faltas,            color: profile.faltas >= 5 ? 'text-red-400' : 'text-yellow-400' },
          { label: '% Asistencia', value: registradas > 0 ? `${pct}%` : '—', color: pct >= 80 ? 'text-green-400' : pct >= 67 ? 'text-yellow-400' : 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass rounded-2xl p-3 sm:p-4 text-center">
            <div className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-gray-400 text-xs sm:text-sm mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div className="glass rounded-2xl p-4 sm:p-6">
        <h3 className="text-white font-semibold mb-4 text-sm">
          Base de Datos II — Asistencia por sesión
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
          {Array.from({ length: TOTAL }, (_, i) => i + 1).map(s => {
            const status = getStatus(s)
            return (
              <motion.div
                key={s}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: s * 0.025 }}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center border transition-all ${
                  status === 'present' ? 'bg-green-500/20 border-green-500/40' :
                  status === 'absent'  ? 'bg-red-500/20   border-red-500/40' :
                  'bg-[#1a1a1a] border-[#2a2a2a]'
                }`}
              >
                <span className="text-[10px] text-gray-500 mb-0.5">S{s}</span>
                {status === 'present' && <CheckCircle className="w-4 h-4 text-green-400" />}
                {status === 'absent'  && <XCircle     className="w-4 h-4 text-red-400" />}
                {status === 'pending' && <span className="w-2 h-2 rounded-full bg-[#333]" />}
              </motion.div>
            )
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-400" /> Asistió</span>
          <span className="flex items-center gap-1.5"><XCircle     className="w-3.5 h-3.5 text-red-400"   /> Faltó</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-[#333]" /> Sin registro</span>
        </div>
      </div>

      {/* Detalle */}
      {sesiones.length > 0 && (
        <div className="glass rounded-2xl p-4 sm:p-5">
          <h3 className="text-white font-semibold mb-3 text-sm">Detalle de sesiones registradas</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sesiones.sort((a, b) => a.sesion - b.sesion).map(s => (
              <div key={s.sesion} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
                <span className="text-gray-400 text-sm">Sesión {s.sesion}</span>
                {s.presente
                  ? <span className="flex items-center gap-1.5 text-green-400 text-xs"><CheckCircle className="w-3.5 h-3.5" /> Asistió</span>
                  : <span className="flex items-center gap-1.5 text-red-400 text-xs"><XCircle className="w-3.5 h-3.5" /> No asistió</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
