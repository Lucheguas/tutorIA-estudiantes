import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { GitBranch, CheckCircle, Circle, Lock, Zap, Database } from 'lucide-react'
import toast from 'react-hot-toast'

const CURRENT_WEEK = 12

const SYLLABUS = [
  { week: 1,  title: 'Repaso: Modelo Relacional y SQL',           desc: 'Tablas, llaves primarias/foráneas, consultas básicas SELECT, FROM, WHERE.' },
  { week: 2,  title: 'JOINs avanzados y subconsultas',            desc: 'INNER, LEFT, RIGHT, FULL JOIN. Subconsultas correlacionadas y en FROM/WHERE.' },
  { week: 3,  title: 'Funciones de agregación y GROUP BY',         desc: 'COUNT, SUM, AVG, MIN, MAX. HAVING vs WHERE. Particionado de resultados.' },
  { week: 4,  title: 'Vistas y procedimientos almacenados',        desc: 'CREATE VIEW, WITH CHECK OPTION. Stored procedures con parámetros IN/OUT.' },
  { week: 5,  title: 'Triggers y funciones de usuario',            desc: 'Triggers BEFORE/AFTER INSERT/UPDATE/DELETE. Funciones escalares y de tabla.' },
  { week: 6,  title: 'Transacciones y control de concurrencia',    desc: 'ACID. BEGIN, COMMIT, ROLLBACK. Niveles de aislamiento. Deadlocks.' },
  { week: 7,  title: 'Índices y optimización de consultas',        desc: 'B-Tree, Hash, índices compuestos. EXPLAIN ANALYZE. Tuning de consultas lentas.' },
  { week: 8,  title: 'Normalización: 1FN → BCNF',                 desc: 'Dependencias funcionales. Primera, segunda, tercera forma normal. BCNF.' },
  { week: 9,  title: 'Bases de datos distribuidas',                desc: 'Fragmentación horizontal/vertical. Replicación. Teorema CAP.' },
  { week: 10, title: 'Seguridad y control de acceso',              desc: 'GRANT, REVOKE. Roles. RLS (Row Level Security). Auditoría de accesos.' },
  { week: 11, title: 'Recuperación ante fallos',                   desc: 'WAL, checkpoints, redo/undo logging. Estrategias de backup y restore.' },
  { week: 12, title: 'NoSQL: MongoDB y documentos',                desc: 'Documentos JSON. Colecciones. CRUD con Mongo Shell. Agregaciones.' },
  { week: 13, title: 'NoSQL: Redis y bases clave-valor',           desc: 'Estructuras de datos en Redis. Caché, pub/sub, expiración de llaves.' },
  { week: 14, title: 'Data Warehousing y OLAP',                    desc: 'Modelado dimensional. Star schema. Cubos OLAP. ETL básico.' },
  { week: 15, title: 'Bases de datos en la nube',                  desc: 'Supabase, Firebase, PlanetScale. Serverless DB. Comparativa de servicios.' },
  { week: 16, title: 'Proyecto integrador y revisión final',       desc: 'Diseño completo: modelo E-R, normalización, SQL, seguridad y optimización.' },
]

function getStorageKey(id: string) { return `lp_done_${id}` }

function loadDone(id: string): Set<number> {
  try {
    const raw = localStorage.getItem(getStorageKey(id))
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function saveDone(id: string, done: Set<number>) {
  localStorage.setItem(getStorageKey(id), JSON.stringify([...done]))
}

export default function LearningPath() {
  const { profile } = useAuth()
  const [done, setDone] = useState<Set<number>>(() =>
    profile ? loadDone(profile.estudiante_id) : new Set()
  )

  if (!profile) return null

  const completedCount = done.size
  const pct = Math.round(completedCount / SYLLABUS.length * 100)

  function toggle(week: number) {
    if (week > CURRENT_WEEK) { toast.error('Este tema todavía no está disponible'); return }
    setDone(prev => {
      const next = new Set(prev)
      if (next.has(week)) next.delete(week)
      else { next.add(week); toast.success(`Semana ${week} marcada como completada`) }
      saveDone(profile.estudiante_id, next)
      return next
    })
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /> Ruta de Aprendizaje
        </h1>
        <p className="text-gray-400 text-sm mt-1">Base de Datos II · Toca cada tema para marcarlo completado</p>
      </div>

      {/* Progreso */}
      <div className="glass rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-500" />
            <span className="text-white text-sm font-medium">Base de Datos II</span>
          </div>
          <span className="text-gray-400 text-sm">{completedCount}/{SYLLABUS.length} temas · {pct}%</span>
        </div>
        <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {/* Árbol */}
      <div className="relative">
        <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-orange-500/30 to-transparent" />

        <div className="space-y-3 pl-16">
          {SYLLABUS.map((topic, idx) => {
            const completed = done.has(topic.week)
            const unlocked  = topic.week <= CURRENT_WEEK
            const isCurrent = topic.week === CURRENT_WEEK

            return (
              <motion.div
                key={topic.week}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="relative"
              >
                {/* Node */}
                <div className={`absolute -left-[42px] top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  completed   ? 'bg-orange-500 border-orange-500' :
                  isCurrent   ? 'bg-orange-500/30 border-orange-500' :
                  unlocked    ? 'bg-[#1a1a1a] border-orange-500/50' :
                  'bg-[#1a1a1a] border-[#333]'
                }`}>
                  {completed && <CheckCircle className="w-3 h-3 text-white" />}
                  {isCurrent && !completed && <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
                </div>

                <div
                  onClick={() => toggle(topic.week)}
                  className={`border rounded-2xl p-3 sm:p-4 transition-all ${
                    completed   ? 'border-orange-500/40 bg-orange-500/10 cursor-pointer' :
                    unlocked    ? 'border-[#333] bg-[#1a1a1a] hover:border-orange-500/50 cursor-pointer' :
                    'border-[#222] bg-[#111] opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                          isCurrent ? 'bg-orange-500/20 text-orange-400' : 'bg-[#252525] text-gray-500'
                        }`}>
                          Semana {topic.week}
                        </span>
                        {isCurrent && (
                          <span className="text-xs text-orange-400 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Semana actual
                          </span>
                        )}
                      </div>
                      <h4 className={`font-medium text-sm sm:text-base ${
                        completed ? 'text-orange-300' : unlocked ? 'text-white' : 'text-gray-600'
                      }`}>
                        {topic.title}
                      </h4>
                      <p className="text-gray-500 text-xs sm:text-sm mt-0.5 line-clamp-2">{topic.desc}</p>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {completed ? <CheckCircle className="w-5 h-5 text-orange-400" /> :
                       unlocked  ? <Circle       className="w-5 h-5 text-gray-600" /> :
                                   <Lock         className="w-5 h-5 text-gray-700" />}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
