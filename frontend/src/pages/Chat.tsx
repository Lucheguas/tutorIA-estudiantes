import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { StudentCourse, ChatMessage } from '../types'
import { MessageSquare, Send, Loader2, Bot, User, Sparkles } from 'lucide-react'

export default function Chat() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState<StudentCourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [score, setScore] = useState(50)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profile) return
    supabase.from('student_courses').select('*, course:courses(*)').eq('student_id', profile.id).eq('cycle', profile.cycle)
      .then(({ data }) => setCourses(data ?? []))
  }, [profile])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadHistory(courseId: string | null) {
    if (!profile) return
    const q = supabase.from('chat_messages').select('*').eq('student_id', profile.id).order('created_at')
    if (courseId) q.eq('course_id', courseId)
    else q.is('course_id', null)
    const { data } = await q.limit(50)
    setMessages(data ?? [])
  }

  function selectCourse(courseId: string | null) {
    setSelectedCourse(courseId)
    loadHistory(courseId)
  }

  async function sendMessage() {
    if (!input.trim() || !profile || sending) return
    const userMsg = input.trim()
    setInput('')
    setSending(true)

    const userRecord: ChatMessage = {
      id: crypto.randomUUID(),
      student_id: profile.id,
      course_id: selectedCourse,
      role: 'user',
      content: userMsg,
      score_impact: 0,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userRecord])

    try {
      const startTime = Date.now()

      // Save user message
      await supabase.from('chat_messages').insert({
        student_id: profile.id,
        course_id: selectedCourse,
        role: 'user',
        content: userMsg,
        score_impact: 0,
      })

      // Call backend LLM
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          studentProfile: {
            name: profile.full_name,
            career: profile.career,
            cycle: profile.cycle,
            learning_style: profile.learning_style,
            comfort_level: profile.comfort_level,
            level: profile.level,
          },
          courseId: selectedCourse,
          score,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const responseTime = (Date.now() - startTime) / 1000
      const data = await res.json()

      // Score adjustment based on response time and quality
      const timeBonus = responseTime < 10 ? 5 : responseTime < 30 ? 2 : 0
      const newScore = Math.min(100, Math.max(0, score + timeBonus))
      setScore(newScore)

      const aiRecord: ChatMessage = {
        id: crypto.randomUUID(),
        student_id: profile.id,
        course_id: selectedCourse,
        role: 'assistant',
        content: data.reply,
        score_impact: timeBonus,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiRecord])

      await supabase.from('chat_messages').insert({
        student_id: profile.id,
        course_id: selectedCourse,
        role: 'assistant',
        content: data.reply,
        score_impact: timeBonus,
      })

      // XP for interaction
      await supabase.from('student_profiles').update({
        xp: (profile.xp ?? 0) + 5,
      }).eq('id', profile.id)

    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        student_id: profile.id,
        course_id: selectedCourse,
        role: 'assistant',
        content: 'Hubo un error al conectarme. Verifica la conexión con el servidor.',
        score_impact: 0,
        created_at: new Date().toISOString(),
      }])
    } finally {
      setSending(false)
    }
  }

  const difficulty = score < 30 ? 'Básico' : score < 60 ? 'Intermedio' : score < 85 ? 'Avanzado' : 'Experto'
  const diffColor = score < 30 ? 'text-blue-400' : score < 60 ? 'text-green-400' : score < 85 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] p-6 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-orange-500" /> Tutor IA
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Modelo socrático · Te guío con preguntas</p>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${diffColor}`}>{difficulty}</div>
          <div className="text-xs text-gray-500">Score: {score}/100</div>
        </div>
      </div>

      {/* Course filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => selectCourse(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedCourse === null ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-[#333]'
          }`}
        >
          General
        </button>
        {courses.map(c => (
          <button
            key={c.course_id}
            onClick={() => selectCourse(c.course_id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedCourse === c.course_id ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-[#333]'
            }`}
          >
            {c.course?.name}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 glass rounded-2xl p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center float">
              <Sparkles className="w-8 h-8 text-orange-500" />
            </div>
            <div>
              <p className="text-white font-medium">¡Hola, {profile?.full_name?.split(' ')[0]}!</p>
              <p className="text-gray-400 text-sm mt-1">Soy tu tutor socrático. No te daré respuestas directas, te haré pensar. ¿Qué quieres explorar hoy?</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-orange-500' : 'bg-[#2a2a2a] border border-orange-500/30'
              }`}>
                {msg.role === 'user'
                  ? <User className="w-4 h-4 text-white" />
                  : <Bot className="w-4 h-4 text-orange-400" />
                }
              </div>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-tr-sm'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-200 rounded-tl-sm'
              }`}>
                {msg.content}
                {msg.score_impact > 0 && (
                  <span className="ml-2 text-xs text-orange-300 opacity-70">+{msg.score_impact}pts</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-orange-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-orange-400" />
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
      <div className="flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Escribe tu pregunta..."
          className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-12 h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}
