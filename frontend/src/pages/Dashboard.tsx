import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { apiPost } from '../lib/apiClient'
import { useAuth } from '../context/AuthContext'
import {
  TrendingUp, Award, BookOpen, AlertTriangle,
  User, Calendar, ShieldAlert, Loader2, CheckCircle, XCircle
} from 'lucide-react'

const TOTAL_SESIONES = 16

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
interface RiskAnalysis {
  level?: RiskLevel
  risk_level?: RiskLevel
  message?: string
  recommendation?: string
  summary?: string
}

const riskColors: Record<RiskLevel, string> = {
  LOW:      'text-green-400  border-green-500/30  bg-green-500/10',
  MEDIUM:   'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  HIGH:     'text-orange-400 border-orange-500/30 bg-orange-500/10',
  CRITICAL: 'text-red-400    border-red-500/30    bg-red-500/10',
}
const riskLabels: Record<RiskLevel, string> = {
  LOW: 'Bajo', MEDIUM: 'Medio', HIGH: 'Alto', CRITICAL: 'Crítico',
}

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
      <div className="text-2xl font-bold text-stone-900">{value}</div>
      <div className="text-xs text-stone-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-stone-400 mt-0.5">{sub}</div>}
    </motion.div>
  )
}

const riesgoConfig = {
  ROJO:       { label: 'Riesgo alto',   color: 'text-red-300',    bg: 'bg-red-500/10 border-red-500/40' },
  ROJO_FALTAS:{ label: 'Riesgo faltas', color: 'text-red-300',    bg: 'bg-red-500/10 border-red-500/40' },
  AMBAR:      { label: 'Atención',      color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/40' },
  VERDE:      { label: 'Al día',        color: 'text-green-300',  bg: 'bg-green-500/10 border-green-500/40' },
  PENDIENTE:  { label: 'Sin calificar', color: 'text-stone-600',   bg: 'bg-gray-500/10 border-gray-500/40' },
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null)
  const [riskLoading, setRiskLoading] = useState(false)

  useEffect(() => {
    if (!profile) return
    setRiskLoading(true)
    apiPost<RiskAnalysis>('/ai/risk/analyze', {
      studentId:    profile.estudiante_id,
      career:       'Informática · Base de Datos II',
      cycle:        5,
      absences:     profile.faltas,
      present:      profile.presentes,
      promedio:     profile.promedio,
      riesgo:       profile.riesgo,
    })
      .then(data => setRiskAnalysis(data))
      .catch(() => setRiskAnalysis(null))
      .finally(() => setRiskLoading(false))
  }, [profile?.estudiante_id])

  if (!profile) return null

  const sesiones  = profile.sesiones ?? []
  const registradas = sesiones.length
  const pct = registradas > 0 ? Math.round(profile.presentes / registradas * 100) : 0
  const riesgo = riesgoConfig[profile.riesgo]
  const primerNombre = profile.nombre.split(' ').slice(2, 4).join(' ') || profile.nombre.split(' ')[0]

  const resolvedLevel: RiskLevel | null = riskAnalysis
    ? (riskAnalysis.level ?? riskAnalysis.risk_level ?? null)
    : null
  const riskMessage = riskAnalysis?.message ?? riskAnalysis?.recommendation ?? riskAnalysis?.summary ?? null

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Hola, {primerNombre}</h1>
          <p className="text-stone-500 text-sm mt-0.5">Base de Datos II · Sección {profile.seccion}</p>
        </div>
        <div className={`text-center px-3 py-2 rounded-xl border text-xs font-medium flex-shrink-0 ${riesgo.bg} ${riesgo.color}`}>
          {riesgo.label}
        </div>
      </div>

      {/* Alert riesgo */}
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
                ? `Tienes ${profile.faltas} falta(s). Límite: 5.`
                : `Promedio ${profile.promedio ?? '--'} · ${profile.faltas} falta(s). Habla con tu tutor.`}
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
        <StatCard icon={CheckCircle} label="Asistencias" value={profile.presentes} sub={`${pct}% del total`} color="green" />
        <StatCard
          icon={XCircle} label="Faltas" value={profile.faltas}
          sub={`de ${registradas} sesiones`}
          color={profile.faltas >= 5 ? 'red' : profile.faltas >= 3 ? 'yellow' : 'orange'}
        />
        <StatCard icon={BookOpen} label="Sesiones reg." value={`${registradas}/${TOTAL_SESIONES}`} color="blue" />
      </div>

      {/* AI Risk Card */}
      <div className="glass rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-5 h-5 text-orange-500" />
          <span className="text-stone-900 font-semibold text-sm">Evaluación de riesgo IA</span>
          <span className="text-xs text-stone-400 ml-auto">por Llama 3</span>
        </div>

        {riskLoading && (
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            Analizando tu perfil académico...
          </div>
        )}

        {!riskLoading && !resolvedLevel && (
          <p className="text-stone-400 text-sm">Análisis no disponible en este momento.</p>
        )}

        {!riskLoading && resolvedLevel && (
          <div className={`border rounded-xl p-3 sm:p-4 ${riskColors[resolvedLevel]}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">Nivel de riesgo: {riskLabels[resolvedLevel]}</span>
            </div>
            {riskMessage && <p className="text-sm opacity-80 leading-relaxed">{riskMessage}</p>}
          </div>
        )}
      </div>

      {/* Notas */}
      <div className="glass rounded-2xl p-4 sm:p-5">
        <h3 className="text-stone-900 font-semibold mb-4 flex items-center gap-2 text-sm">
          <Award className="w-4 h-4 text-orange-500" /> Notas · Base de Datos II
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Parcial',  val: profile.parcial  },
            { label: 'Final',    val: profile.final    },
            { label: 'Práctica', val: profile.practica },
            { label: 'Promedio', val: profile.promedio },
          ].map(({ label, val }) => {
            const color = val === null ? 'text-stone-400' : val >= 14 ? 'text-green-400' : val >= 11 ? 'text-yellow-400' : 'text-red-400'
            return (
              <div key={label} className="bg-[#f5f3f0] border border-[#e8e4df] rounded-xl p-3 text-center">
                <div className={`text-xl font-bold ${color}`}>{val !== null ? val : '—'}</div>
                <div className="text-xs text-stone-400 mt-0.5">{label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Attendance grid */}
      <div className="glass rounded-2xl p-4 sm:p-5">
        <h3 className="text-stone-900 font-semibold mb-4 flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-orange-500" /> Registro de sesiones
        </h3>
        <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 sm:gap-2">
          {Array.from({ length: TOTAL_SESIONES }, (_, i) => i + 1).map(s => {
            const reg   = sesiones.find(x => x.sesion === s)
            const state = !reg ? 'pending' : reg.presente ? 'present' : 'absent'
            return (
              <div
                key={s}
                title={`Sesión ${s}`}
                className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium border ${
                  state === 'present' ? 'bg-green-500/20 border-green-500/40 text-green-400' :
                  state === 'absent'  ? 'bg-red-500/20   border-red-500/40   text-red-400' :
                  'bg-[#f5f3f0] border-[#e8e4df] text-stone-400'
                }`}
              >
                {s}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-stone-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-500/50" /> Asistió</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500/50"   /> Faltó</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#e8e4df]"   /> Sin registro</span>
        </div>
      </div>

      {/* Datos personales */}
      <div className="glass rounded-2xl p-4 sm:p-5">
        <h3 className="text-stone-900 font-semibold mb-4 flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-orange-500" /> Datos personales
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {[
            { label: 'Nombre',  value: profile.nombre },
            { label: 'Código',  value: profile.codigo },
            { label: 'Sección', value: profile.seccion },
            { label: 'Grupo',   value: profile.grupo || '—' },
            { label: 'Correo',  value: `${profile.codigo}@unfv.edu.pe` },
            { label: 'Curso',   value: 'Base de Datos II' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-stone-400 text-xs">{label}</p>
              <p className="text-stone-900 mt-0.5 break-words">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
