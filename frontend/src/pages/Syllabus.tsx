import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { StudentCourse, SyllabusTopic } from '../types'
import { BookOpen, ChevronDown, ChevronUp, FileText, Link } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SyllabusPage() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState<StudentCourse[]>([])
  const [topics, setTopics] = useState<SyllabusTopic[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase.from('student_courses').select('*, course:courses(*)').eq('student_id', profile.id).eq('cycle', profile.cycle)
      .then(({ data }) => {
        setCourses(data ?? [])
        if (data && data.length > 0) {
          setSelected(data[0].course_id)
          loadTopics(data[0].course_id)
        }
        setLoading(false)
      })
  }, [profile])

  async function loadTopics(courseId: string) {
    const { data } = await supabase
      .from('syllabus_topics')
      .select('*')
      .eq('course_id', courseId)
      .order('week')
    setTopics(data ?? [])
  }

  function selectCourse(courseId: string) {
    setSelected(courseId)
    setExpanded(null)
    loadTopics(courseId)
  }

  const selectedCourse = courses.find(c => c.course_id === selected)
  const weekGroups = Array.from({ length: 16 }, (_, i) => i + 1).map(week => ({
    week,
    topics: topics.filter(t => t.week === week),
  }))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-orange-500" /> Sílabo
        </h1>
        <p className="text-gray-400 mt-1">Contenido por semana de tus cursos del ciclo {profile?.cycle}°</p>
      </div>

      {/* Course tabs */}
      <div className="flex flex-wrap gap-2">
        {courses.map(c => (
          <button
            key={c.course_id}
            onClick={() => selectCourse(c.course_id)}
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
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-1">{selectedCourse?.course?.name}</h3>
          <p className="text-gray-400 text-sm mb-6">{selectedCourse?.course?.credits} créditos · {selectedCourse?.course?.code}</p>

          <div className="space-y-3">
            {weekGroups.map(({ week, topics: wt }) => (
              <div key={week} className="border border-[#2a2a2a] rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === String(week) ? null : String(week))}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a] transition"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      wt.length > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-[#222] text-gray-600'
                    }`}>
                      {week}
                    </span>
                    <div className="text-left">
                      <p className="text-white text-sm font-medium">Semana {week}</p>
                      {wt.length > 0 ? (
                        <p className="text-gray-500 text-xs">{wt[0].title}</p>
                      ) : (
                        <p className="text-gray-600 text-xs italic">Sin contenido registrado</p>
                      )}
                    </div>
                  </div>
                  {wt.length > 0 && (
                    expanded === String(week) ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                <AnimatePresence>
                  {expanded === String(week) && wt.length > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      {wt.map(topic => (
                        <div key={topic.id} className="px-4 pb-4 border-t border-[#1a1a1a]">
                          <div className="pt-3">
                            <h4 className="text-white font-medium mb-2">{topic.title}</h4>
                            <p className="text-gray-400 text-sm mb-3">{topic.description}</p>
                            {topic.resources?.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                  <Link className="w-3 h-3" /> Recursos
                                </p>
                                <div className="space-y-1">
                                  {topic.resources.map((r, i) => (
                                    <a key={i} href={r} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition">
                                      <FileText className="w-3 h-3" /> {r}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
