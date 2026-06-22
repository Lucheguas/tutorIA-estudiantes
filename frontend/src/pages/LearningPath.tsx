import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { apiGet } from '../lib/apiClient'
import { useAuth } from '../context/AuthContext'
import type { StudentCourse, SyllabusTopic } from '../types'
import {
  GitBranch, CheckCircle, Circle, Lock, Star, Zap, Trophy, Flame, Shield,
  Sparkles, Bot, User, Send, Loader2, ChevronDown, ChevronUp, BookOpen, Clock, Lightbulb
} from 'lucide-react'
import toast from 'react-hot-toast'

const BACKEND_URL    = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'
const CURRENT_WEEK   = 12

// ── Gamification card ─────────────────────────────────────────────────────────
interface GamificationProfile {
  xp?: number; total_xp?: number; level?: number; streak?: number; streaks?: number
  badges?: Array<{ id: string; name?: string; title?: string; icon?: string }>
  achievements?: Array<{ id: string; title?: string; badge?: string }>
}

function GamificationCard({ studentId }: { studentId: string }) {
  const [gamif, setGamif]   = useState<GamificationProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return
    apiGet<GamificationProfile>(`/gamification/profile/${studentId}`)
      .then(d => setGamif(d))
      .catch(() => setGamif(null))
      .finally(() => setLoading(false))
  }, [studentId])

  if (loading) return (
    <div className="glass rounded-2xl p-5 animate-pulse">
      <div className="h-4 bg-[#2a2a2a] rounded w-1/3 mb-3" />
      <div className="flex gap-4">
        {[1,2,3].map(i => <div key={i} className="h-10 bg-[#2a2a2a] rounded-xl w-20" />)}
      </div>
    </div>
  )
  if (!gamif) return null

  const xp     = gamif.xp ?? gamif.total_xp ?? 0
  const level  = gamif.level ?? 1
  const streak = gamif.streak ?? gamif.streaks ?? 0
  const badges = gamif.badges ?? gamif.achievements ?? []

  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      className="glass rounded-2xl p-5 border border-orange-500/10">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-orange-400" />
        <span className="text-white font-semibold text-sm">Tu perfil de gamificación</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />, val: xp.toLocaleString(), label: 'XP total' },
          { icon: <Shield className="w-4 h-4 text-orange-400 mx-auto mb-1" />, val: level, label: 'Nivel' },
          { icon: <Flame className="w-4 h-4 text-red-400 mx-auto mb-1" />, val: streak, label: 'Racha días' },
        ].map(({ icon, val, label }) => (
          <div key={label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 text-center">
            {icon}
            <div className="text-lg font-bold text-white">{val}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>
      {badges.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Logros obtenidos</p>
          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <span key={b.id} className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-300 px-2.5 py-1 rounded-lg">
                {b.icon ? `${b.icon} ` : ''}{b.name ?? b.title ?? b.id}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ── AI Plan card ──────────────────────────────────────────────────────────────
interface AIplan {
  prioridades:          { tema: string; razon: string; horas_semana: number; nivel: string }[]
  plan_semanal:         { semana: number; actividades: string[] }[]
  recursos_recomendados: { tipo: string; descripcion: string }[]
  mensaje_motivacional: string
}

function AIRecommendations({ profile }: { profile: ReturnType<typeof useAuth>['profile'] }) {
  const [plan, setPlan]       = useState<AIplan | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)

  async function generate() {
    if (!profile) return
    setLoading(true)
    setOpen(true)
    try {
      const studentData = {
        nombre:   profile.nombre,
        codigo:   profile.codigo,
        seccion:  profile.seccion,
        curso:    'Base de Datos II (ciclo V)',
        notas:    { parcial: profile.parcial, final: profile.final, practica: profile.practica, promedio: profile.promedio },
        faltas:   profile.faltas,
        presentes: profile.presentes,
        riesgo:   profile.riesgo,
      }
      const res  = await fetch(`${BACKEND_URL}/api/llm/learning-path`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentData, currentWeek: CURRENT_WEEK }),
      })
      const json = await res.json() as { data?: AIplan; raw?: string }
      if (json.data) setPlan(json.data)
      else toast.error('El modelo no pudo generar la ruta. Intenta de nuevo.')
    } catch {
      toast.error('Error al conectar con el servidor IA.')
    } finally {
      setLoading(false)
    }
  }

  const NIVEL_COLOR: Record<string, string> = {
    básico: 'text-blue-400', intermedio: 'text-yellow-400', avanzado: 'text-red-400',
  }

  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      className="glass rounded-2xl p-5 border border-orange-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-400" />
          <span className="text-white font-semibold">Ruta personalizada con IA</span>
        </div>
        <button
          onClick={plan ? () => setOpen(o => !o) : generate}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
            : plan
              ? <>{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} {open ? 'Ocultar' : 'Ver ruta'}</>
              : <><Sparkles className="w-4 h-4" /> Generar ruta IA</>
          }
        </button>
      </div>

      <AnimatePresence>
        {open && plan && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }} className="overflow-hidden">
            <div className="mt-5 space-y-5">

              {/* Mensaje motivacional */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <p className="text-orange-300 text-sm leading-relaxed italic">"{plan.mensaje_motivacional}"</p>
              </div>

              {/* Prioridades */}
              {plan.prioridades?.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" /> Temas prioritarios
                  </h3>
                  <div className="space-y-2">
                    {plan.prioridades.map((p, i) => (
                      <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium text-sm">{p.tema}</span>
                              <span className={`text-xs font-medium ${NIVEL_COLOR[p.nivel] ?? 'text-gray-400'}`}>{p.nivel}</span>
                            </div>
                            <p className="text-gray-400 text-xs">{p.razon}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 text-orange-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{p.horas_semana}h/sem</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan semanal */}
              {plan.plan_semanal?.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-orange-400" /> Plan semanal
                  </h3>
                  <div className="space-y-2">
                    {plan.plan_semanal.map((s, i) => (
                      <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3.5">
                        <div className="text-xs text-orange-400 font-semibold mb-2">Semana {s.semana}</div>
                        <ul className="space-y-1">
                          {s.actividades.map((a, j) => (
                            <li key={j} className="text-gray-300 text-xs flex items-start gap-1.5">
                              <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recursos */}
              {plan.recursos_recomendados?.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-green-400" /> Recursos recomendados
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {plan.recursos_recomendados.map((r, i) => (
                      <div key={i} className="bg-[#1a1a1a] border border-green-500/20 rounded-xl px-3 py-2">
                        <span className="text-xs text-green-400 font-medium capitalize">{r.tipo}</span>
                        <p className="text-gray-300 text-xs mt-0.5">{r.descripcion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Socratic chat inline ──────────────────────────────────────────────────────
interface Msg { role: 'user' | 'assistant'; content: string }

function SocraticChat({ topic, onClose }: { topic: SyllabusTopic; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const inputRef                = useRef<HTMLInputElement>(null)

  // Auto-send opening question
  useEffect(() => {
    send(`Quiero entender "${topic.title}". ¿Por dónde empezamos?`)
    setTimeout(() => inputRef.current?.focus(), 300)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || sending) return
    setInput('')
    setSending(true)

    const userMsg: Msg = { role: 'user', content: msg }
    const history      = [...messages, userMsg]
    setMessages(history)

    try {
      const res = await fetch(`${BACKEND_URL}/api/llm/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          message:  msg,
          history:  messages,
          mode:     'student',
          topic:    topic.title,
          context: `Semana ${topic.week}: ${topic.description}`,
        }),
      })
      const data = await res.json() as { reply?: string; error?: string }
      if (!res.ok || !data.reply) throw new Error(data.error ?? 'Sin respuesta')
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply! }])
    } catch (err: unknown) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error al conectar con el tutor IA. ${err instanceof Error ? err.message : ''}` }])
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
      exit={{ opacity:0, height:0 }} className="overflow-hidden">
      <div className="mt-3 border border-orange-500/30 rounded-2xl bg-[#111] overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-orange-400" />
            <span className="text-white text-sm font-medium">Tutor socrático · {topic.title}</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xs transition">✕ cerrar</button>
        </div>

        {/* messages */}
        <div className="p-3 space-y-3 max-h-72 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.role === 'user' ? 'bg-orange-500' : 'bg-[#2a2a2a] border border-orange-500/30'
              }`}>
                {m.role === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-orange-400" />}
              </div>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-orange-500 text-white rounded-tr-sm'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-200 rounded-tl-sm'
              }`}>{m.content}</div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-[#2a2a2a] border border-orange-500/30 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                <span className="text-gray-400 text-xs">Pensando...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* input */}
        <div className="flex gap-2 p-2 border-t border-[#2a2a2a]">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Escribe tu respuesta o pregunta..."
            className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-orange-500 transition"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || sending}
            className="w-9 h-9 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-lg flex items-center justify-center transition flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LearningPath() {
  const { profile, refreshProfile } = useAuth()
  const [courses, setCourses]       = useState<StudentCourse[]>([])
  const [topics, setTopics]         = useState<SyllabusTopic[]>([])
  const [selected, setSelected]     = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)
  const [socratiId, setSocratiId]   = useState<string | null>(null) // active socratic topic

  useEffect(() => {
    if (!profile) return
    supabase
      .from('student_courses').select('*, course:courses(*)').eq('student_id', profile.profile_id).eq('cycle', profile.seccion ?? 5)
      .then(({ data }) => {
        setCourses(data ?? [])
        if (data && data.length > 0) { setSelected(data[0].course_id); loadTopics(data[0].course_id) }
      })
  }, [profile])

  async function loadTopics(courseId: string) {
    const { data } = await supabase.from('syllabus_topics').select('*').eq('course_id', courseId).order('week')
    setTopics(data ?? [])
  }

  const isCompleted = (t: SyllabusTopic) => profile ? t.completed_by?.includes(profile.profile_id) : false
  const isUnlocked  = (t: SyllabusTopic) => t.week <= CURRENT_WEEK

  async function completeTopic(topic: SyllabusTopic) {
    if (!profile || completing || isCompleted(topic) || !isUnlocked(topic)) return
    setCompleting(topic.id)
    try {
      const newCompleted = [...(topic.completed_by ?? []), profile.profile_id]
      await supabase.from('syllabus_topics').update({ completed_by: newCompleted }).eq('id', topic.id)
      const xpGain = 30 + topic.week * 2
      await supabase.from('notifications').insert({
        user_id: profile.profile_id,
        title: '¡Tema completado!',
        message: `Completaste "${topic.title}" y ganaste ${xpGain} XP.`,
        type: 'success', read: false,
      })
      setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, completed_by: newCompleted } : t))
      await refreshProfile()
      toast.success(`+${xpGain} XP · ¡Tema completado!`)
    } finally {
      setCompleting(null)
    }
  }

  const selectedCourse = courses.find(c => c.course_id === selected)
  const completedCount = topics.filter(isCompleted).length
  const progressPct   = topics.length > 0 ? completedCount / topics.length * 100 : 0

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-orange-500" /> Ruta de Aprendizaje
        </h1>
        <p className="text-gray-400 mt-1">Avanza por los temas del sílabo, practica con el tutor IA y gana XP</p>
      </div>

      {/* Gamification */}
      {profile && <GamificationCard studentId={profile.profile_id} />}

      {/* AI Recommendations */}
      {profile && <AIRecommendations profile={profile} />}

      {/* Course selector */}
      <div className="flex flex-wrap gap-2">
        {courses.map(c => (
          <button key={c.course_id}
            onClick={() => { setSelected(c.course_id); loadTopics(c.course_id); setSocratiId(null) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selected === c.course_id
                ? 'bg-orange-500 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#333]'
            }`}
          >{c.course?.name}</button>
        ))}
      </div>

      {selected && (
        <>
          {/* Progress bar */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">{selectedCourse?.course?.name}</span>
              <span className="text-sm text-gray-400">{completedCount}/{topics.length} temas</span>
            </div>
            <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>

          {/* Topic tree */}
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 to-[#1a1a1a]" />
            <div className="space-y-4 pl-20 relative">
              {topics.map((topic, idx) => {
                const completed = isCompleted(topic)
                const unlocked  = isUnlocked(topic)
                const isCurrent = topic.week === CURRENT_WEEK
                const socratiActive = socratiId === topic.id

                return (
                  <motion.div key={topic.id}
                    initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: idx * 0.05 }} className="relative">

                    {/* Branch node */}
                    <div className={`absolute -left-[52px] top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      completed  ? 'bg-orange-500 border-orange-500' :
                      isCurrent  ? 'bg-orange-500/30 border-orange-500 pulse-orange' :
                      unlocked   ? 'bg-[#1a1a1a] border-orange-500/50' :
                                   'bg-[#1a1a1a] border-[#333]'
                    }`}>
                      {completed  && <CheckCircle className="w-3 h-3 text-white" />}
                      {isCurrent && !completed && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                    </div>
                    <div className="absolute -left-[44px] top-5 w-7 h-0.5 bg-[#2a2a2a]" />

                    <div className={`border rounded-2xl p-4 transition-all ${
                      completed  ? 'border-orange-500/40 bg-orange-500/10' :
                      unlocked   ? 'border-[#333] bg-[#1a1a1a] hover:border-orange-500/30' :
                                   'border-[#222] bg-[#111] opacity-50'
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                              isCurrent ? 'bg-orange-500/20 text-orange-400' : 'bg-[#252525] text-gray-500'
                            }`}>Semana {topic.week}</span>
                            {isCurrent && (
                              <span className="text-xs text-orange-400 flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Semana actual
                              </span>
                            )}
                          </div>
                          <h4 className={`font-medium ${completed ? 'text-orange-300' : unlocked ? 'text-white' : 'text-gray-600'}`}>
                            {topic.title}
                          </h4>
                          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{topic.description}</p>
                        </div>
                        <div className="flex-shrink-0 mt-1">
                          {completed ? <CheckCircle className="w-5 h-5 text-orange-400" /> :
                           unlocked  ? <Circle className="w-5 h-5 text-gray-600" /> :
                                       <Lock className="w-5 h-5 text-gray-700" />}
                        </div>
                      </div>

                      {unlocked && (
                        <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex items-center justify-between gap-2 flex-wrap">
                          {!completed && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Star className="w-3 h-3 text-orange-500" /> +{30 + topic.week * 2} XP al completar
                            </span>
                          )}

                          <div className="flex items-center gap-2 ml-auto">
                            {/* Socratic chat toggle */}
                            <button
                              onClick={() => setSocratiId(socratiActive ? null : topic.id)}
                              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                socratiActive
                                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                                  : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:border-orange-500/40 hover:text-orange-300'
                              }`}
                            >
                              <Bot className="w-3.5 h-3.5" />
                              {socratiActive ? 'Cerrar tutor' : 'Practicar con IA'}
                            </button>

                            {!completed && (
                              <button
                                onClick={() => completeTopic(topic)}
                                disabled={!!completing}
                                className="text-xs text-orange-400 hover:text-orange-300 transition disabled:opacity-50"
                              >
                                Marcar completado →
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Inline socratic chat */}
                    <AnimatePresence>
                      {socratiActive && (
                        <SocraticChat
                          key={topic.id}
                          topic={topic}
                          onClose={() => setSocratiId(null)}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}

              {topics.length === 0 && (
                <div className="glass rounded-2xl p-8 text-center">
                  <GitBranch className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No hay temas en el sílabo de este curso aún.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
