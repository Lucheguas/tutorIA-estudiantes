import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Clock, Timer, Zap, BookOpen, Layers, ChevronDown, Play, Pause, RotateCcw, Sparkles, Loader2 } from 'lucide-react'
import { apiGet } from '../lib/apiClient'
import { useAuth } from '../context/AuthContext'

const methods = [
  {
    id: 'pomodoro',
    name: 'Técnica Pomodoro',
    icon: Timer,
    color: 'from-red-500/20 to-red-600/10 border-red-500/30',
    accent: 'text-red-400',
    tagline: 'Trabaja 25 min, descansa 5 min',
    description: 'Divide el trabajo en intervalos de 25 minutos (pomodoros) separados por descansos cortos. Después de 4 pomodoros, toma un descanso largo de 15-30 min.',
    steps: [
      'Elige una tarea a realizar',
      'Configura un temporizador en 25 minutos',
      'Trabaja en la tarea hasta que suene',
      'Toma un descanso de 5 minutos',
      'Repite. Cada 4 ciclos, descansa 15-30 min',
    ],
    benefits: ['Mejora la concentración', 'Reduce la fatiga mental', 'Aumenta la productividad', 'Control del tiempo real'],
    timer: { work: 25, break: 5, longBreak: 30 },
  },
  {
    id: 'feynman',
    name: 'Técnica Feynman',
    icon: BookOpen,
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    accent: 'text-blue-400',
    tagline: 'Aprende enseñando',
    description: 'Explica el concepto como si le enseñaras a un niño de 12 años. Los huecos en tu explicación revelan lo que aún no entiendes.',
    steps: [
      'Elige el concepto que quieres aprender',
      'Escríbelo como si le explicaras a un niño',
      'Identifica los huecos en tu explicación',
      'Regresa al material fuente para llenarlos',
      'Simplifica el lenguaje y usa analogías',
    ],
    benefits: ['Comprensión profunda', 'Detecta lagunas de conocimiento', 'Mejora la memoria a largo plazo', 'Aplica para cualquier tema'],
  },
  {
    id: 'flowntime',
    name: 'Método Flowntime',
    icon: Zap,
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    accent: 'text-purple-400',
    tagline: 'Trabaja en flujo, descansa cuando necesites',
    description: 'Similar al Pomodoro pero sin temporizador fijo. Trabajas hasta que sientes que necesitas un descanso, respetando tu estado de flujo natural.',
    steps: [
      'Comienza a trabajar y anota la hora de inicio',
      'Trabaja hasta que tu concentración baje',
      'Anota cuánto tiempo trabajaste',
      'Descansa la mitad del tiempo trabajado',
      'Repite el ciclo sin límite fijo',
    ],
    benefits: ['Respeta el estado de flujo', 'Más flexible que Pomodoro', 'Autoconocimiento del ritmo', 'Ideal para tareas creativas'],
  },
  {
    id: 'spaced',
    name: 'Repetición Espaciada',
    icon: Layers,
    color: 'from-green-500/20 to-green-600/10 border-green-500/30',
    accent: 'text-green-400',
    tagline: 'Repasa en intervalos crecientes',
    description: 'Revisa el material en intervalos cada vez más largos: hoy, mañana, en 3 días, en 7 días, en 21 días. Aprovecha la curva del olvido.',
    steps: [
      'Estudia un tema por primera vez',
      'Repasa mañana (1 día después)',
      'Repasa en 3 días',
      'Repasa en 7 días',
      'Repasa en 21 días y luego mensualmente',
    ],
    benefits: ['Retención a largo plazo', 'Aprovecha la neurociencia', 'Reduce el tiempo de estudio total', 'Ideal para vocabulario, fórmulas'],
  },
  {
    id: 'active',
    name: 'Recall Activo',
    icon: Brain,
    color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    accent: 'text-yellow-400',
    tagline: 'Recuerda sin mirar las notas',
    description: 'En lugar de releer pasivamente, cierra el libro e intenta recordar el contenido. El esfuerzo de recuperación fortalece la memoria.',
    steps: [
      'Lee o estudia el material una vez',
      'Cierra todo y escribe lo que recuerdas',
      'Compara con el original',
      'Estudia solo las partes que fallaron',
      'Repite el proceso',
    ],
    benefits: ['3x más efectivo que releer', 'Identifica exactamente qué no sabes', 'Prepara mejor para exámenes', 'Construye confianza real'],
  },
  {
    id: 'cornell',
    name: 'Sistema Cornell',
    icon: Clock,
    color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    accent: 'text-orange-400',
    tagline: 'Notas estructuradas en 3 secciones',
    description: 'Divide la hoja en: columna izquierda (preguntas clave), columna derecha (notas de clase), y sección inferior (resumen). Organiza el aprendizaje.',
    steps: [
      'Divide la hoja: 1/3 izquierda, 2/3 derecha, banda inferior',
      'Toma notas en la sección derecha durante clase',
      'Escribe preguntas clave en la sección izquierda',
      'Escribe un resumen de 2-3 oraciones abajo',
      'Usa las preguntas para repasar tapando las notas',
    ],
    benefits: ['Organización clara', 'Facilita el repaso activo', 'Mejora la comprensión en clase', 'Crea material de estudio propio'],
  },
]

function PomodoroTimer() {
  const [phase, setPhase] = useState<'work' | 'break'>('work')
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function toggle() {
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setRunning(false)
    } else {
      setRunning(true)
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setRunning(false)
            setPhase(p => {
              const next = p === 'work' ? 'break' : 'work'
              setTimeout(() => setSeconds(next === 'work' ? 25 * 60 : 5 * 60), 0)
              return next
            })
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    setPhase('work')
    setSeconds(25 * 60)
  }

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')

  return (
    <div className="bg-[#111] border border-red-500/20 rounded-2xl p-6 mt-4">
      <p className="text-sm text-gray-500 text-center mb-4">{phase === 'work' ? '🍅 Tiempo de trabajo' : '☕ Tiempo de descanso'}</p>
      <div className="text-5xl font-mono font-bold text-center text-white mb-6">
        {mins}:{secs}
      </div>
      <div className="flex justify-center gap-3">
        <button onClick={toggle} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-white text-sm font-medium transition">
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {running ? 'Pausar' : 'Iniciar'}
        </button>
        <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-xl text-gray-400 text-sm transition">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface AiRecommendation {
  method?: string
  reason?: string
  recommendation?: string
  technique?: string
}

function AiRecommendationCard() {
  const { profile } = useAuth()
  const [rec, setRec] = useState<AiRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!profile) return
    setLoading(true)
    setError(false)

    const params = new URLSearchParams({
      learning_style: profile.learning_style ?? '',
      career: profile.career ?? '',
      cycle: String(profile.cycle ?? 1),
      academic_performance: profile.academic_performance ?? '',
      weekly_study_hours: profile.weekly_study_hours ?? '',
    })

    apiGet<AiRecommendation>(`/ai/recommend?${params.toString()}`)
      .then(data => setRec(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [profile])

  if (loading) {
    return (
      <div className="glass rounded-2xl p-5 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-orange-400 animate-spin flex-shrink-0" />
        <span className="text-gray-400 text-sm">Llama 3 analizando tu perfil...</span>
      </div>
    )
  }

  if (error || !rec) return null

  const methodName = rec.method ?? rec.technique ?? 'Técnica personalizada'
  const reason = rec.reason ?? rec.recommendation ?? ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 border border-orange-500/20"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-orange-400" />
        <span className="text-white font-semibold text-sm">Recomendación de Llama 3 para ti</span>
      </div>
      <p className="text-orange-300 font-medium">{methodName}</p>
      {reason && <p className="text-gray-400 text-sm mt-1">{reason}</p>}
      <p className="text-xs text-gray-600 mt-2">Basado en tu estilo de aprendizaje: {profile?.learning_style}</p>
    </motion.div>
  )
}

export default function StudyMethods() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-orange-500" /> Métodos de Estudio
        </h1>
        <p className="text-gray-400 mt-1">Técnicas probadas para aprender de forma eficiente</p>
      </div>

      {/* AI Recommendation from Llama */}
      <AiRecommendationCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {methods.map((method, idx) => {
          const Icon = method.icon
          const isOpen = expanded === method.id

          return (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
              className={`bg-gradient-to-br ${method.color} border rounded-2xl overflow-hidden`}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : method.id)}
                className="w-full text-left p-5 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${method.accent}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{method.name}</h3>
                    <p className={`text-sm ${method.accent} opacity-80 mt-0.5`}>{method.tagline}</p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-4 border-t border-white/5">
                      <p className="text-gray-300 text-sm pt-4">{method.description}</p>

                      <div>
                        <h4 className={`text-xs font-semibold uppercase tracking-wider ${method.accent} mb-2`}>Pasos</h4>
                        <ol className="space-y-1.5">
                          {method.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                              <span className={`w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-xs font-bold flex-shrink-0 ${method.accent}`}>
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div>
                        <h4 className={`text-xs font-semibold uppercase tracking-wider ${method.accent} mb-2`}>Beneficios</h4>
                        <div className="flex flex-wrap gap-2">
                          {method.benefits.map(b => (
                            <span key={b} className="text-xs bg-black/20 text-gray-300 px-2.5 py-1 rounded-lg">{b}</span>
                          ))}
                        </div>
                      </div>

                      {method.id === 'pomodoro' && <PomodoroTimer />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
