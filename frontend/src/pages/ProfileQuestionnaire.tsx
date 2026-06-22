import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { ChevronRight, ChevronLeft, BookOpen } from 'lucide-react'

const CAREERS = [
  'Ingeniería de Sistemas', 'Ingeniería Industrial', 'Administración de Empresas',
  'Contabilidad', 'Derecho', 'Medicina', 'Psicología', 'Arquitectura',
  'Ingeniería Civil', 'Marketing', 'Comunicaciones', 'Educación',
]

const CYCLES = Array.from({ length: 10 }, (_, i) => i + 1)

interface Answers {
  career: string
  cycle: string
  academic_performance: string
  weekly_study_hours: string
  work_situation: string
  learning_style: string
  comfort_level: string
  motivation: string
}

const OptionBox = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
      selected
        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
        : 'border-[#333] bg-[#1a1a1a] text-gray-300 hover:border-orange-500/50'
    }`}
  >
    {label}
  </button>
)

export default function ProfileQuestionnaire() {
  const { user, refreshProfile } = useAuth()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<Answers>>({})
  const [loading, setLoading] = useState(false)

  const steps = [
    {
      title: '¿Qué carrera estudias y en qué ciclo te encuentras?',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Carrera</label>
            <select
              value={answers.career || ''}
              onChange={e => setAnswers(p => ({ ...p, career: e.target.value }))}
              className="w-full bg-[#252525] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Selecciona tu carrera</option>
              {CAREERS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Ciclo</label>
            <select
              value={answers.cycle || ''}
              onChange={e => setAnswers(p => ({ ...p, cycle: e.target.value }))}
              className="w-full bg-[#252525] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
            >
              <option value="">Selecciona tu ciclo</option>
              {CYCLES.map(c => <option key={c} value={String(c)}>{c}° ciclo</option>)}
            </select>
          </div>
        </div>
      ),
      valid: () => !!answers.career && !!answers.cycle,
    },
    {
      title: '¿Cómo describirías tu rendimiento académico en el ciclo anterior?',
      content: (
        <div className="space-y-2">
          {['Muy bueno', 'Bueno', 'Regular', 'Bajo', 'Es mi primer ciclo'].map(opt => (
            <OptionBox key={opt} label={opt} selected={answers.academic_performance === opt}
              onClick={() => setAnswers(p => ({ ...p, academic_performance: opt }))} />
          ))}
        </div>
      ),
      valid: () => !!answers.academic_performance,
    },
    {
      title: 'Fuera de clases, ¿cuántas horas a la semana le dedicas a estudiar o repasar?',
      content: (
        <div className="space-y-2">
          {['Menos de 2 horas', '3 a 6 horas', 'Más de 6 horas'].map(opt => (
            <OptionBox key={opt} label={opt} selected={answers.weekly_study_hours === opt}
              onClick={() => setAnswers(p => ({ ...p, weekly_study_hours: opt }))} />
          ))}
        </div>
      ),
      valid: () => !!answers.weekly_study_hours,
    },
    {
      title: '¿Combinas tus estudios con trabajo o responsabilidades familiares?',
      content: (
        <div className="space-y-2">
          {['No', 'Sí, de forma parcial', 'Sí, a tiempo completo'].map(opt => (
            <OptionBox key={opt} label={opt} selected={answers.work_situation === opt}
              onClick={() => setAnswers(p => ({ ...p, work_situation: opt }))} />
          ))}
        </div>
      ),
      valid: () => !!answers.work_situation,
    },
    {
      title: '¿Cómo prefieres aprender un tema nuevo?',
      content: (
        <div className="space-y-2">
          {['Con ejemplos prácticos', 'Con teoría y conceptos', 'Resolviendo problemas por mi cuenta', 'Con guía paso a paso'].map(opt => (
            <OptionBox key={opt} label={opt} selected={answers.learning_style === opt}
              onClick={() => setAnswers(p => ({ ...p, learning_style: opt }))} />
          ))}
        </div>
      ),
      valid: () => !!answers.learning_style,
    },
    {
      title: 'En general, ¿qué tan cómodo te sientes con los cursos de tu carrera?',
      content: (
        <div className="space-y-2">
          {['Muy cómodo', 'Cómodo', 'Inseguro', 'Muy inseguro'].map(opt => (
            <OptionBox key={opt} label={opt} selected={answers.comfort_level === opt}
              onClick={() => setAnswers(p => ({ ...p, comfort_level: opt }))} />
          ))}
        </div>
      ),
      valid: () => !!answers.comfort_level,
    },
    {
      title: '¿Qué es lo que más te motiva a seguir tu carrera?',
      content: (
        <div className="space-y-4">
          <textarea
            value={answers.motivation || ''}
            onChange={e => setAnswers(p => ({ ...p, motivation: e.target.value }))}
            placeholder="Puedes escribir libremente o mencionar: Pasión por el tema / Oportunidades laborales / Presión familiar / Aún no estoy seguro..."
            rows={4}
            className="w-full bg-[#252525] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
          />
        </div>
      ),
      valid: () => !!answers.motivation?.trim(),
    },
  ]

  async function handleFinish() {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase.from('student_profiles').upsert({
        user_id: user.id,
        email: user.email,
        career: answers.career,
        cycle: parseInt(answers.cycle!),
        academic_performance: answers.academic_performance,
        weekly_study_hours: answers.weekly_study_hours,
        work_situation: answers.work_situation,
        learning_style: answers.learning_style,
        comfort_level: answers.comfort_level,
        motivation: answers.motivation,
        xp: 50,
        level: 1,
        streak: 1,
      }, { onConflict: 'user_id' })
      if (error) throw error

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: '¡Perfil completado!',
        message: 'Tu perfil fue configurado. ¡Ganaste 50 XP de bienvenida!',
        type: 'success',
        read: false,
      })

      await refreshProfile()
      toast.success('¡Perfil completado! +50 XP')
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const current = steps[step]
  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 mb-3">
            <BookOpen className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-gray-400 text-sm">Configuración de perfil · Pregunta {step + 1} de {steps.length}</p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-[#2a2a2a] rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="glass rounded-2xl p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6">{current.title}</h2>
            {current.content}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#333] text-gray-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
          )}
          <button
            onClick={step === steps.length - 1 ? handleFinish : () => setStep(s => s + 1)}
            disabled={!current.valid() || loading}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {loading ? 'Guardando...' : step === steps.length - 1 ? '¡Comenzar!' : 'Siguiente'}
            {step < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
