import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  TrendingUp, AlertTriangle, User, Calendar,
  BookOpen, CheckCircle, XCircle, Award
} from 'lucide-react'

const TOTAL_SESIONES = 16

function StatCard({ icon: Icon, label, value, sub, color = 'orange' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
  const palette: Record<string, string> = {
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    green:  'from-green-500/20  to-green-600/10  border-green-500/30  text-green-400',
    red:    'from-red-500/20    to-red-600/10    border-red-500/30    text-red-400',
    blue:   'from-blue-500/20   to-blue-600/10   border-blue-500/30   text-blue-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
  }
  const cls = palette[color] ?? palette.orange
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${cls} border rounded-2xl p-4`}
    >
      <Icon className={`w-4 h-4 mb-2 ${cls.split(' ').pop()}`} />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </motion.div>
  )
}

const riesgoConfig = {
  ROJO:       { label: 'Riesgo alto',   color: 'text-red-300',    bg: 'bg-red-500/10 border-red-500/40' },
  ROJO_FALTAS:{ label: 'Riesgo faltas', color: 'text-red-300',    bg: 'bg-red-500/10 border-red-500/40' },
  AMBAR:      { label: 'Atención',      color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/40' },
  VERDE:      { label: 'Al día',        color: 'text-green-300',  bg: 'bg-green-500/10 border-green-500/40' },
  PENDIENTE:  { label: 'Sin calificar', color: 'text-gray-300',   bg: 'bg-gray-500/10 border-gray-500/40' },
}

export default function Dashboard() {
  const { profile } = useAuth()
  if (!profile) return null

  const sesiones = profile.sesiones ?? []
  const registradas = sesiones.length
  const pct = registradas > 0 ? Math.round(profile.presentes / registradas * 100) : 0
  const riesgo = riesgoConfig[profile.riesgo]
  const primerNombre = profile.nombre.split(' ').slice(2, 4).join(' ') ||
                       profile.nombre.split(' ')[0]

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Hola, {primerNombre}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Base de Datos II · Sección {profile.seccion}
          </p>
        </div>
        <div className={`text-center px-3 py-2 rounded-xl border text-xs font-medium ${riesgo.bg} ${riesgo.color}`}>
          {riesgo.label}
        </div>
      </div>

      {/* Alert si riesgo */}
      {(profile.riesgo === 'ROJO' || profile.riesgo === 'ROJO_FALTAS') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium text-sm">Riesgo académico detectado</p>
            <p className="text-red-400/70 text-xs mt-0.5">
              {profile.riesgo === 'ROJO_FALTAS'
                ? `Tienes ${profile.faltas} falta(s). Si superas 5 puedes ser retirado del curso.`
                : `Promedio ${profile.promedio ?? '--'} con ${profile.faltas} falta(s). Contacta a tu tutor.`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Promedio"
          value={profile.promedio !== null ? profile.promedio.toFixed(1) : '--'}
          color={profile.promedio === null ? 'blue' : profile.promedio >= 13 ? 'green' : profile.promedio >= 11 ? 'yellow' : 'red'}
        />
        <StatCard
          icon={CheckCircle}
          label="Asistencias"
          value={profile.presentes}
          sub={`${pct}% del total`}
          color="green"
        />
        <StatCard
          icon={XCircle}
          label="Faltas"
          value={profile.faltas}
          sub={`de ${registradas} sesiones`}
          color={profile.faltas >= 5 ? 'red' : profile.faltas >= 3 ? 'yellow' : 'orange'}
        />
        <StatCard
          icon={BookOpen}
          label="Sesiones reg."
          value={`${registradas}/${TOTAL_SESIONES}`}
          color="blue"
        />
      </div>

      {/* Notas breakdown */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
          <Award className="w-4 h-4 text-orange-500" /> Notas · Base de Datos II
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Parcial',  val: profile.parcial  },
            { label: 'Final',    val: profile.final    },
            { label: 'Práctica', val: profile.practica },
            { label: 'Promedio', val: profile.promedio },
          ].map(({ label, val }) => {
            const num = val ?? null
            const color = num === null ? 'text-gray-500' : num >= 14 ? 'text-green-400' : num >= 11 ? 'text-yellow-400' : 'text-red-400'
            return (
              <div key={label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 text-center">
                <div className={`text-xl font-bold ${color}`}>{num !== null ? num : '—'}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Attendance mini grid */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-orange-500" /> Registro de sesiones
        </h3>
        <div className="grid grid-cols-8 sm:grid-cols-16 gap-2">
          {Array.from({ length: TOTAL_SESIONES }, (_, i) => i + 1).map(s => {
            const reg = sesiones.find(x => x.sesion === s)
            const state = !reg ? 'pending' : reg.presente ? 'present' : 'absent'
            return (
              <div
                key={s}
                title={`Sesión ${s}: ${state === 'present' ? 'Asistió' : state === 'absent' ? 'Faltó' : 'Sin registro'}`}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-medium border transition-all ${
                  state === 'present' ? 'bg-green-500/20 border-green-500/40 text-green-400' :
                  state === 'absent'  ? 'bg-red-500/20   border-red-500/40   text-red-400' :
                  'bg-[#1a1a1a] border-[#2a2a2a] text-gray-600'
                }`}
              >
                {s}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-green-500/50" /> Asistió
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-500/50" /> Faltó
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#2a2a2a]" /> Sin registro
          </span>
        </div>
      </div>

      {/* Datos personales */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-orange-500" /> Datos personales
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {[
            { label: 'Nombre',   value: profile.nombre },
            { label: 'Código',   value: profile.codigo },
            { label: 'Sección',  value: profile.seccion },
            { label: 'Grupo',    value: profile.grupo || '—' },
            { label: 'Correo',   value: `${profile.codigo}@unfv.edu.pe` },
            { label: 'Curso',    value: 'Base de Datos II' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-gray-500 text-xs">{label}</p>
              <p className="text-white mt-0.5 text-sm break-words">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
