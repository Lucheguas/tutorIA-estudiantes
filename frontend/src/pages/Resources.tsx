import { useState } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, ExternalLink, Search, Play, BookOpen, Code2, Database } from 'lucide-react'

interface Resource {
  title:    string
  url:      string
  type:     'doc' | 'video' | 'practice' | 'tool'
  week:     string
  desc:     string
}

const RESOURCES: Resource[] = [
  { title: 'PostgreSQL Documentation',       url: 'https://www.postgresql.org/docs/',           type: 'doc',      week: '1–8',  desc: 'Documentación oficial de PostgreSQL. Referencia completa para SQL y funciones.' },
  { title: 'SQL Tutorial (W3Schools)',        url: 'https://www.w3schools.com/sql/',             type: 'doc',      week: '1–5',  desc: 'Guía interactiva de SQL con ejemplos. Ideal para repasar sintaxis rápidamente.' },
  { title: 'CS50 SQL · YouTube',             url: 'https://www.youtube.com/watch?v=wdzA1Z8tKek', type: 'video',   week: '1–4',  desc: 'Clase completa de SQL de Harvard. Desde cero hasta JOINs avanzados.' },
  { title: 'Indexing Explained (Gist)',       url: 'https://use-the-index-luke.com/',            type: 'doc',      week: '7',    desc: '"Use The Index, Luke" — guía gratuita de optimización de índices SQL.' },
  { title: 'MongoDB University',              url: 'https://learn.mongodb.com/',                 type: 'practice', week: '12',   desc: 'Cursos gratuitos de MongoDB. Incluye JavaScript y Python drivers.' },
  { title: 'Redis Documentation',             url: 'https://redis.io/docs/',                     type: 'doc',      week: '13',   desc: 'Docs oficiales de Redis. Comandos, estructuras de datos, patrones.' },
  { title: 'DB Fiddle — SQL Playground',      url: 'https://www.db-fiddle.com/',                 type: 'tool',     week: '1–16', desc: 'Ejecuta SQL en el navegador. Soporta PostgreSQL, MySQL y SQLite.' },
  { title: 'dbdiagram.io — Diseño E-R',       url: 'https://dbdiagram.io/',                      type: 'tool',     week: '6–8',  desc: 'Dibuja diagramas entidad-relación con texto. Exporta a SQL.' },
  { title: 'Supabase Docs',                   url: 'https://supabase.com/docs',                  type: 'doc',      week: '15',   desc: 'PostgreSQL en la nube con Auth, Storage y APIs automáticas.' },
  { title: 'Normalization Video (Decomplexity)',url:'https://www.youtube.com/watch?v=GFQaEYEc8_8',type: 'video',   week: '6–8',  desc: 'Explicación clara de 1FN, 2FN, 3FN y BCNF con ejemplos visuales.' },
  { title: 'Transactions ACID · Fireship',    url: 'https://www.youtube.com/watch?v=pomxJOFVcQs', type: 'video',  week: '6',    desc: 'Transacciones y ACID explicados en 5 minutos por Fireship.' },
  { title: 'SQLZoo — Práctica interactiva',   url: 'https://sqlzoo.net/',                        type: 'practice', week: '1–5',  desc: 'Ejercicios SQL en el navegador de nivel básico a avanzado.' },
  { title: 'LeetCode Database Problems',      url: 'https://leetcode.com/problemset/database/',  type: 'practice', week: '2–11', desc: 'Problemas SQL de entrevistas reales. Ideal para prepararse.' },
  { title: 'CAP Theorem Explained',           url: 'https://www.youtube.com/watch?v=kwCFHLbIhak', type: 'video',  week: '9',    desc: 'Video de 8 min que explica el teorema CAP con ejemplos de sistemas reales.' },
]

const typeConfig = {
  doc:      { icon: BookOpen, label: 'Documentación', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  video:    { icon: Play,     label: 'Video',          color: 'text-red-400  bg-red-500/10  border-red-500/30'  },
  practice: { icon: Code2,    label: 'Práctica',       color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  tool:     { icon: Database, label: 'Herramienta',    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
}

export default function Resources() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | Resource['type']>('all')

  const visible = RESOURCES.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.week.includes(q)
    const matchType   = filter === 'all' || r.type === filter
    return matchSearch && matchType
  })

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" /> Recursos
        </h1>
        <p className="text-stone-500 text-sm mt-1">Material de estudio · Base de Datos II</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar recurso o semana..."
            className="w-full bg-[#f5f3f0] border border-[#d6d0ca] rounded-xl pl-10 pr-4 py-2.5 text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:border-orange-500 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'doc', 'video', 'practice', 'tool'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                filter === t
                  ? 'bg-orange-500 text-stone-900 border-orange-500'
                  : 'bg-[#f5f3f0] text-stone-500 border-[#d6d0ca] hover:text-stone-900'
              }`}
            >
              {t === 'all' ? 'Todo' : typeConfig[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.length === 0 && (
          <div className="sm:col-span-2 glass rounded-2xl p-10 text-center">
            <FolderOpen className="w-10 h-10 text-stone-400 mx-auto mb-3" />
            <p className="text-stone-500 text-sm">No se encontraron recursos.</p>
          </div>
        )}

        {visible.map((r, idx) => {
          const { icon: Icon, label, color } = typeConfig[r.type]
          return (
            <motion.a
              key={r.title}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="glass rounded-2xl p-4 hover:border-orange-500/30 transition-all group block"
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-stone-900 text-sm font-medium group-hover:text-orange-300 transition leading-tight">
                      {r.title}
                    </h4>
                    <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-orange-400 flex-shrink-0 mt-0.5 transition" />
                  </div>
                  <p className="text-stone-400 text-xs mt-1 line-clamp-2">{r.desc}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-md border ${color}`}>{label}</span>
                    <span className="text-xs text-stone-400">Semana {r.week}</span>
                  </div>
                </div>
              </div>
            </motion.a>
          )
        })}
      </div>
    </div>
  )
}
