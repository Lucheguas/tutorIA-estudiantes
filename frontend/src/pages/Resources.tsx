import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { StudentCourse, SyllabusTopic } from '../types'
import { FolderOpen, FileText, Link, Search, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Resources() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState<StudentCourse[]>([])
  const [topics, setTopics] = useState<SyllabusTopic[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!profile) return
    supabase.from('student_courses').select('*, course:courses(*)').eq('student_id', profile.id).eq('cycle', profile.cycle)
      .then(({ data }) => {
        setCourses(data ?? [])
        if (data && data[0]) {
          setSelected(data[0].course_id)
          loadTopics(data[0].course_id)
        }
      })
  }, [profile])

  async function loadTopics(courseId: string) {
    const { data } = await supabase.from('syllabus_topics').select('*').eq('course_id', courseId).order('week')
    setTopics(data ?? [])
  }

  const filtered = topics.filter(t =>
    t.resources?.length > 0 &&
    (search === '' || t.title.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-orange-500" /> Recursos
        </h1>
        <p className="text-gray-400 mt-1">Material de estudio de tus cursos del ciclo {profile?.cycle}°</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {courses.map(c => (
          <button
            key={c.course_id}
            onClick={() => { setSelected(c.course_id); loadTopics(c.course_id) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selected === c.course_id ? 'bg-orange-500 text-white' : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#333]'
            }`}
          >
            {c.course?.name}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar recurso..."
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <div className="md:col-span-2 glass rounded-2xl p-8 text-center">
            <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No hay recursos registrados para este curso.</p>
          </div>
        )}
        {filtered.map((topic, idx) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-sm font-bold text-orange-400 flex-shrink-0">
                {topic.week}
              </span>
              <div>
                <h4 className="text-white font-medium">{topic.title}</h4>
                <p className="text-gray-500 text-xs mt-0.5">Semana {topic.week}</p>
              </div>
            </div>
            <div className="space-y-2">
              {topic.resources.map((r, i) => (
                <a
                  key={i}
                  href={r}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-[#111] hover:bg-orange-500/10 border border-[#2a2a2a] hover:border-orange-500/30 transition-all group"
                >
                  {r.startsWith('http') ? (
                    <Link className="w-4 h-4 text-gray-500 group-hover:text-orange-400 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-gray-500 group-hover:text-orange-400 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-400 group-hover:text-orange-300 truncate transition">{r}</span>
                </a>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
