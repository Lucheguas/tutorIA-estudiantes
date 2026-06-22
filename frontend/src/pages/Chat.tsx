import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { MessageSquare, Send, Loader2, Bot, User, Sparkles, Cpu, Trash2 } from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://etutor-api.mystic-byte.com'

interface Msg {
  id:          string
  role:        'user' | 'assistant'
  content:     string
  score_impact?: number
}

export default function Chat() {
  const { profile } = useAuth()
  const [messages, setMessages]   = useState<Msg[]>([])
  const [input,    setInput]      = useState('')
  const [sending,  setSending]    = useState(false)
  const [score,    setScore]      = useState(50)
  const bottomRef                 = useRef<HTMLDivElement>(null)

  if (!profile) return null

  const primerNombre = profile.nombre.split(' ').slice(2, 4).join(' ') || profile.nombre.split(' ')[0]

  const nivelComfort = profile.riesgo === 'VERDE' ? 'alto' : profile.riesgo === 'AMBAR' ? 'medio' : 'bajo'
  const studentContext = `Nombre: ${profile.nombre} | Carrera: Informática · Base de Datos II | Ciclo: 5 | Nivel comodidad: ${nivelComfort} | Riesgo: ${profile.riesgo ?? 'PENDIENTE'}`

  async function sendMessage() {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    try {
      const startTime = Date.now()

      const res = await fetch(`${BACKEND_URL}/api/llm/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mode:    'student',
          context: studentContext,
          history: next.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) throw new Error(`Error del servidor [${res.status}]`)
      const data = await res.json() as { reply?: string }
      const reply = data.reply ?? ''

      const timeBonus = (Date.now() - startTime) / 1000 < 10 ? 5 : 2
      setScore(s => Math.min(100, s + timeBonus))
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant', content: reply, score_impact: timeBonus,
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: 'Error al conectarme. Verifica que el backend esté corriendo.',
      }])
    } finally {
      setSending(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const difficulty = score < 30 ? 'Básico' : score < 60 ? 'Intermedio' : score < 85 ? 'Avanzado' : 'Experto'
  const diffColor  = score < 30 ? 'text-blue-400' : score < 60 ? 'text-green-400' : score < 85 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] md:h-screen p-3 sm:p-6 gap-3">
      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" /> E-Tutor UNFV
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">Método socrático · Te guío con preguntas</p>
          <a
            href="https://llm.mystic-byte.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-1 px-2 py-1 rounded-lg bg-[#f5f3f0] border border-[#e8e4df] text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            <Cpu className="w-3 h-3 text-orange-500" />
            Powered by Llama 3 · mystic-byte.com
          </a>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`text-sm font-semibold ${diffColor}`}>{difficulty}</div>
          <div className="text-xs text-stone-400">Score: {score}/100</div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-400 transition mt-1"
            >
              <Trash2 className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 glass rounded-2xl p-3 sm:p-4 overflow-y-auto space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <p className="text-stone-900 font-medium">Hola, {primerNombre}!</p>
              <p className="text-stone-500 text-sm mt-1 max-w-xs">
                Soy tu tutor socrático de Base de Datos II. No te daré respuestas directas — te haré pensar.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm text-left">
              {[
                '¿Qué es un índice y para qué sirve?',
                '¿Cuándo uso LEFT JOIN vs INNER JOIN?',
                '¿Por qué normalizar una base de datos?',
                '¿Qué diferencia hay entre SQL y NoSQL?',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-left text-xs text-stone-500 bg-[#f5f3f0] border border-[#e8e4df] hover:border-orange-500/30 hover:text-orange-300 px-3 py-2.5 rounded-xl transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-orange-500' : 'bg-[#e8e4df] border border-orange-500/30'
              }`}>
                {msg.role === 'user'
                  ? <User className="w-3.5 h-3.5 text-stone-900" />
                  : <Bot  className="w-3.5 h-3.5 text-orange-400" />}
              </div>
              <div className={`max-w-[82%] px-3 sm:px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-tr-sm'
                  : 'bg-[#f5f3f0] border border-[#e8e4df] text-stone-800 rounded-tl-sm'
              }`}>
                {msg.content}
                {msg.score_impact && msg.score_impact > 0 && (
                  <span className="ml-2 text-xs text-orange-300 opacity-70">+{msg.score_impact}pts</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <div className="flex gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#e8e4df] border border-orange-500/30 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="bg-[#f5f3f0] border border-[#e8e4df] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
              <span className="text-stone-500 text-sm">Pensando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Escribe tu pregunta..."
          className="flex-1 bg-[#f5f3f0] border border-[#d6d0ca] rounded-xl px-4 py-3 text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:border-orange-500 transition"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-11 h-11 sm:w-12 sm:h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4 text-stone-900" />
        </button>
      </div>
    </div>
  )
}
