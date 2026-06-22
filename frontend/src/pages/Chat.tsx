import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { MessageSquare, Send, Loader2, Bot, User, Sparkles, Trash2 } from 'lucide-react'

interface Msg {
  id:      string
  role:    'user' | 'assistant'
  content: string
}

export default function Chat() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input,    setInput]    = useState('')
  const [sending,  setSending]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  if (!profile) return null

  const primerNombre = profile.nombre.split(' ').slice(2, 4).join(' ') || profile.nombre.split(' ')[0]

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          studentProfile: {
            name:          profile.nombre,
            career:        'Informática · Base de Datos II',
            cycle:         5,
            learning_style:'visual',
            comfort_level: profile.riesgo === 'VERDE' ? 'alto' : profile.riesgo === 'AMBAR' ? 'medio' : 'bajo',
            level:         1,
          },
          courseId: null,
          score:    50,
          history:  next.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()
      const reply = data.reply ?? 'No pude procesar tu consulta en este momento.'

      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: 'No pude conectarme con el servidor. Verifica que el backend esté corriendo.',
      }])
    } finally {
      setSending(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] md:h-screen p-3 sm:p-6 gap-3">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" /> Tutor IA
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Método socrático · Te guío con preguntas</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-[#333] transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpiar
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 glass rounded-2xl p-3 sm:p-4 overflow-y-auto space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <p className="text-white font-medium">Hola, {primerNombre}!</p>
              <p className="text-gray-400 text-sm mt-1 max-w-xs">
                Soy tu tutor socrático de Base de Datos II. No te daré respuestas directas — te haré pensar.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm text-left">
              {[
                '¿Qué es un índice B-Tree y cuándo usarlo?',
                '¿Cuál es la diferencia entre HAVING y WHERE?',
                '¿Por qué usar transacciones en SQL?',
                '¿Cuándo usar NoSQL en lugar de SQL?',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q) }}
                  className="text-left text-xs text-gray-400 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-orange-500/30 hover:text-orange-300 px-3 py-2.5 rounded-xl transition"
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
                msg.role === 'user' ? 'bg-orange-500' : 'bg-[#2a2a2a] border border-orange-500/30'
              }`}>
                {msg.role === 'user'
                  ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  : <Bot  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />}
              </div>
              <div className={`max-w-[82%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-tr-sm'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-200 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <div className="flex gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2a2a2a] border border-orange-500/30 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
              <span className="text-gray-400 text-sm">Pensando...</span>
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
          className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500 transition"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-11 h-11 sm:w-12 sm:h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}
