import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { StudentCourse, SyllabusTopic } from '../types'
import { GitBranch, CheckCircle, Circle, Lock, Star, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const CURRENT_WEEK = 12

export default function LearningPath() {
  const { profile, refreshProfile } = useAuth()
  const [courses, setCourses] = useState<StudentCourse[]>([])
  const [topics, setTopics] = useState<SyllabusTopic[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    supabase.from('student_courses').select('*, course:courses(*)').eq('student_id', profile.id).eq('cycle', profile.cycle)
      .then(({ data }) => {
        setCourses(data ?? [])
        if (data && data.length > 0) {
          setSelected(data[0].course_id)
          loadTopics(data[0].course_id)
        }
      })
  }, [profile])

  async function loadTopics(courseId: string) {
    const { data } = await supabase.from('syllabus_topics').select('*').eq('course_id', courseId).order('week')
    setTopics(data ?? [])
  }

  function isCompleted(topic: SyllabusTopic) {
    return profile ? topic.completed_by?.includes(profile.id) : false
  }

  function isUnlocked(topic: SyllabusTopic) {
    return topic.week <= CURRENT_WEEK
  }

  async function completeTopic(topic: SyllabusTopic) {
    if (!profile || completing) return
    if (isCompleted(topic)) return
    if (!isUnlocked(topic)) { toast.error('Todavía no es tiempo para este tema'); return }

    setCompleting(topic.id)
    try {
      const newCompleted = [...(topic.completed_by ?? []), profile.id]
      await supabase.from('syllabus_topics').update({ completed_by: newCompleted }).eq('id', topic.id)

      const xpGain = 30 + topic.week * 2
      await supabase.from('student_profiles').update({
        xp: (profile.xp ?? 0) + xpGain,
        level: Math.floor(((profile.xp ?? 0) + xpGain) / 500) + 1,
      }).eq('id', profile.id)

      await supabase.from('notifications').insert({
        user_id: profile.user_id,
        title: '¡Tema completado!',
        message: `Completaste "${topic.title}" y ganaste ${xpGain} XP.`,
        type: 'success',
        read: false,
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
  const progressPct = topics.length > 0 ? completedCount / topics.length * 100 : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-orange-500" /> Ruta de Aprendizaje
        </h1>
        <p className="text-gray-400 mt-1">Avanza por los temas del sílabo y gana XP</p>
      </div>

      {/* Course selector */}
      <div className="flex flex-wrap gap-2">
        {courses.map(c => (
          <button
            key={c.course_id}
            onClick={() => { setSelected(c.course_id); loadTopics(c.course_id) }}
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
          {/* Progress */}
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

          {/* Git-branch style tree */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 to-[#1a1a1a]" />

            <div className="space-y-4 pl-20 relative">
              {topics.map((topic, idx) => {
                const completed = isCompleted(topic)
                const unlocked = isUnlocked(topic)
                const isCurrent = topic.week === CURRENT_WEEK

                return (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative"
                  >
                    {/* Node on branch */}
                    <div className={`absolute -left-[52px] top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      completed ? 'bg-orange-500 border-orange-500' :
                      isCurrent ? 'bg-orange-500/30 border-orange-500 pulse-orange' :
                      unlocked ? 'bg-[#1a1a1a] border-orange-500/50' :
                      'bg-[#1a1a1a] border-[#333]'
                    }`}>
                      {completed && <CheckCircle className="w-3 h-3 text-white" />}
                      {isCurrent && !completed && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                    </div>

                    {/* Week connector line */}
                    <div className="absolute -left-[44px] top-5 w-7 h-0.5 bg-[#2a2a2a]" />

                    <div
                      onClick={() => unlocked && !completed && completeTopic(topic)}
                      className={`border rounded-2xl p-4 transition-all ${
                        completed ? 'border-orange-500/40 bg-orange-500/10 cursor-default' :
                        unlocked ? 'border-[#333] bg-[#1a1a1a] hover:border-orange-500/50 cursor-pointer' :
                        'border-[#222] bg-[#111] opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                              isCurrent ? 'bg-orange-500/20 text-orange-400' : 'bg-[#252525] text-gray-500'
                            }`}>
                              Semana {topic.week}
                            </span>
                            {isCurrent && <span className="text-xs text-orange-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Semana actual</span>}
                          </div>
                          <h4 className={`font-medium ${completed ? 'text-orange-300' : unlocked ? 'text-white' : 'text-gray-600'}`}>
                            {topic.title}
                          </h4>
                          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{topic.description}</p>
                        </div>
                        <div className="flex-shrink-0 mt-1">
                          {completed ? <CheckCircle className="w-5 h-5 text-orange-400" /> :
                           unlocked ? <Circle className="w-5 h-5 text-gray-600" /> :
                           <Lock className="w-5 h-5 text-gray-700" />}
                        </div>
                      </div>

                      {unlocked && !completed && (
                        <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex items-center justify-between">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Star className="w-3 h-3 text-orange-500" /> +{30 + topic.week * 2} XP al completar
                          </span>
                          <span className="text-xs text-orange-400">Toca para marcar completado →</span>
                        </div>
                      )}
                    </div>
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
