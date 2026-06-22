import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { GitBranch, CheckCircle, Circle, Lock, Star, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const CURRENT_WEEK = 12

const CURRICULUM = [
  { week: 1,  title: 'Introducción a Bases de Datos', description: 'Conceptos fundamentales, tipos de BD, historia y evolución de los SGBD.' },
  { week: 2,  title: 'Modelo Entidad-Relación', description: 'Entidades, atributos, relaciones, cardinalidad y diseño conceptual.' },
  { week: 3,  title: 'Modelo Relacional', description: 'Tablas, tuplas, dominios, claves primarias y foráneas.' },
  { week: 4,  title: 'Álgebra Relacional', description: 'Selección, proyección, unión, intersección, diferencia y producto cartesiano.' },
  { week: 5,  title: 'SQL Básico', description: 'SELECT, FROM, WHERE, ORDER BY, GROUP BY, HAVING. Funciones de agregado.' },
  { week: 6,  title: 'SQL Avanzado — JOINs', description: 'INNER JOIN, LEFT/RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN y subconsultas.' },
  { week: 7,  title: 'Normalización', description: '1FN, 2FN, 3FN y BCNF. Dependencias funcionales y descomposición sin pérdida.' },
  { week: 8,  title: 'Integridad y Restricciones', description: 'Integridad referencial, constraints, triggers y reglas de negocio.' },
  { week: 9,  title: 'Índices y Optimización', description: 'B-Trees, índices compuestos, EXPLAIN ANALYZE y optimización de consultas.' },
  { week: 10, title: 'Transacciones y ACID', description: 'Atomicidad, consistencia, aislamiento, durabilidad. COMMIT, ROLLBACK, SAVEPOINT.' },
  { week: 11, title: 'Concurrencia y Bloqueos', description: 'Problemas de concurrencia, niveles de aislamiento, deadlocks y su resolución.' },
  { week: 12, title: 'Bases de Datos Distribuidas', description: 'Fragmentación, replicación, teorema CAP y sistemas distribuidos.' },
  { week: 13, title: 'NoSQL — Documentos y Clave-Valor', description: 'MongoDB, Redis. Casos de uso, ventajas y comparación con SQL.' },
  { week: 14, title: 'NoSQL — Columnar y Grafos', description: 'Cassandra, Neo4j. Modelos de datos y aplicaciones reales.' },
  { week: 15, title: 'Seguridad en BD', description: 'Autenticación, autorización, roles, cifrado y auditoría.' },
  { week: 16, title: 'Proyecto Final', description: 'Diseño, implementación y presentación del proyecto integrador.' },
]

export default function LearningPath() {
  const { profile } = useAuth()
  const storageKey = `lp_done_${profile?.estudiante_id ?? 'guest'}`

  const [done, setDone] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]') } catch { return [] }
  })

  if (!profile) return null

  function isCompleted(week: number) { return done.includes(week) }
  function isUnlocked(week: number)  { return week <= CURRENT_WEEK }

  function completeTopic(week: number) {
    if (isCompleted(week)) return
    if (!isUnlocked(week)) { toast.error('Todavía no es tiempo para este tema'); return }
    const next = [...done, week]
    setDone(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    const xp = 30 + week * 2
    toast.success(`+${xp} XP · ¡Tema completado!`)
  }

  const completedCount = done.length
  const progressPct = (completedCount / CURRICULUM.length) * 100

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /> Ruta de Aprendizaje
        </h1>
        <p className="text-stone-500 text-sm mt-1">Base de Datos II · Avanza por los temas y gana XP</p>
      </div>

      {/* Progress */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-stone-900 font-medium text-sm">Progreso del curso</span>
          <span className="text-sm text-stone-500">{completedCount}/{CURRICULUM.length} temas</span>
        </div>
        <div className="h-2 bg-[#e8e4df] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Git-branch style tree */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 to-[#e8e4df]" />

        <div className="space-y-4 pl-20 relative">
          {CURRICULUM.map((topic, idx) => {
            const completed = isCompleted(topic.week)
            const unlocked  = isUnlocked(topic.week)
            const isCurrent = topic.week === CURRENT_WEEK
            const xp = 30 + topic.week * 2

            return (
              <motion.div
                key={topic.week}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="relative"
              >
                {/* Node */}
                <div className={`absolute -left-[52px] top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  completed ? 'bg-orange-500 border-orange-500' :
                  isCurrent ? 'bg-orange-500/30 border-orange-500 pulse-orange' :
                  unlocked  ? 'bg-[#f5f3f0] border-orange-500/50' :
                              'bg-[#f5f3f0] border-[#d6d0ca]'
                }`}>
                  {completed && <CheckCircle className="w-3 h-3 text-white" />}
                  {isCurrent && !completed && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                </div>

                {/* Connector */}
                <div className="absolute -left-[44px] top-5 w-7 h-0.5 bg-[#e8e4df]" />

                <div
                  onClick={() => unlocked && !completed && completeTopic(topic.week)}
                  className={`border rounded-2xl p-4 transition-all ${
                    completed ? 'border-orange-500/40 bg-orange-500/10 cursor-default' :
                    unlocked  ? 'border-[#d6d0ca] bg-[#f5f3f0] hover:border-orange-500/50 cursor-pointer' :
                                'border-[#e8e4df] bg-white opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                          isCurrent ? 'bg-orange-500/20 text-orange-400' : 'bg-[#ede9e4] text-stone-400'
                        }`}>
                          Semana {topic.week}
                        </span>
                        {isCurrent && (
                          <span className="text-xs text-orange-400 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Semana actual
                          </span>
                        )}
                      </div>
                      <h4 className={`font-medium text-sm ${completed ? 'text-orange-400' : unlocked ? 'text-stone-900' : 'text-stone-400'}`}>
                        {topic.title}
                      </h4>
                      <p className="text-stone-400 text-xs mt-1 line-clamp-2">{topic.description}</p>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {completed ? <CheckCircle className="w-5 h-5 text-orange-400" /> :
                       unlocked  ? <Circle className="w-5 h-5 text-stone-400" /> :
                                   <Lock className="w-5 h-5 text-stone-300" />}
                    </div>
                  </div>

                  {unlocked && !completed && (
                    <div className="mt-3 pt-3 border-t border-[#e8e4df] flex items-center justify-between">
                      <span className="text-xs text-stone-400 flex items-center gap-1">
                        <Star className="w-3 h-3 text-orange-500" /> +{xp} XP al completar
                      </span>
                      <span className="text-xs text-orange-400">Toca para marcar →</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
