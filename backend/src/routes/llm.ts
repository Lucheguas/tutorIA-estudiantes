/**
 * llm.ts — Endpoints que proxean a Ollama (llm.mystic-byte.com/api/chat)
 * con las cabeceras CF-Access correctas. Sin estado de sesión — el historial
 * viaja en cada petición (max 10 mensajes previos).
 *
 * Rutas:
 *   POST /api/llm/chat          — Chat socrático (estudiante) o de tutoría (tutor)
 *   POST /api/llm/learning-path — Ruta de aprendizaje personalizada (JSON)
 *   POST /api/llm/recommend     — Recomendaciones pedagógicas para el tutor (JSON)
 */

import { Router, Request, Response } from 'express'

const router = Router()

const LLM_URL   = process.env.LLM_BASE_URL  ?? 'https://llm.mystic-byte.com'
const LLM_MODEL = process.env.LLM_MODEL     ?? 'llama3:8b'
const CF_ID     = process.env.CF_ACCESS_CLIENT_ID  ?? ''
const CF_SEC    = process.env.CF_ACCESS_CLIENT_SECRET ?? ''

const CF_HEADERS: Record<string, string> = {
  'Content-Type':            'application/json',
  'CF-Access-Client-Id':     CF_ID,
  'CF-Access-Client-Secret': CF_SEC,
}

type OllamaMsg = { role: string; content: string }

async function ollamaChat(messages: OllamaMsg[]): Promise<string> {
  const res = await fetch(`${LLM_URL}/api/chat`, {
    method:  'POST',
    headers: CF_HEADERS,
    body:    JSON.stringify({ model: LLM_MODEL, messages, stream: false }),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Ollama ${res.status}: ${txt.slice(0, 200)}`)
  }
  const data = await res.json() as { message?: { content?: string } }
  return data.message?.content ?? ''
}

// ── POST /api/llm/chat ────────────────────────────────────────────────────────
// mode=student → socrático, nunca da respuesta directa
// mode=tutor   → profesional, ayuda al tutor a analizar y planear
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      mode = 'student',
      context = '',
      topic = '',
    } = req.body as {
      message:  string
      history?: OllamaMsg[]
      mode?:    'student' | 'tutor'
      context?: string
      topic?:   string
    }

    if (!message?.trim()) { res.status(400).json({ error: 'message requerido' }); return }

    const system = mode === 'tutor'
      ? `Eres E-Tutor, asistente de apoyo para tutores y psicólogos de la UNFV. \
Ayudas a analizar el perfil académico del estudiante, generar planes de intervención y estrategias de acompañamiento.\
${context ? `\n\nPERFIL DEL ESTUDIANTE:\n${context}` : ''}\
\nResponde en español profesional y estructurado. Sé conciso y directo.`

      : `Eres E-Tutor, tutor socrático de Base de Datos II en la UNFV. \
INSTRUCCIONES ESTRICTAS:\
\n1. NUNCA des la respuesta directa. Siempre guía con preguntas.\
\n2. Máximo 3 preguntas por respuesta. Una pregunta a la vez si el alumno está confundido.\
\n3. Cuando el alumno responda correctamente, valídalo con entusiasmo y profundiza con otra pregunta.\
\n4. Adapta la dificultad: si se equivoca, retrocede a algo más básico.\
\n5. Sé cálido, motivador y en español peruano natural.\
${topic ? `\n\nTEMA ACTUAL: ${topic}` : ''}\
${context ? `\n\nCONTEXTO DEL ESTUDIANTE: ${context}` : ''}`

    const messages: OllamaMsg[] = [
      { role: 'system', content: system },
      ...history.slice(-10),
      { role: 'user', content: message },
    ]

    const reply = await ollamaChat(messages)
    res.json({ reply })
  } catch (err: unknown) {
    console.error('LLM chat error:', err)
    res.status(502).json({ error: err instanceof Error ? err.message : 'Error LLM' })
  }
})

// ── POST /api/llm/learning-path ───────────────────────────────────────────────
// Genera una ruta de aprendizaje personalizada en JSON
router.post('/learning-path', async (req: Request, res: Response) => {
  try {
    const { studentData, completedTopics = [], currentWeek = 12 } = req.body as {
      studentData:      Record<string, unknown>
      completedTopics?: string[]
      currentWeek?:     number
    }

    const prompt = `Eres E-Tutor, asistente académico de la UNFV para Base de Datos II (ciclo V, 2026-I).

PERFIL DEL ESTUDIANTE:
${JSON.stringify(studentData, null, 2)}

TEMAS COMPLETADOS: ${completedTopics.length > 0 ? completedTopics.join(', ') : 'ninguno aún'}
SEMANA ACTUAL: ${currentWeek} de 16

Genera una RUTA DE APRENDIZAJE PERSONALIZADA. Responde SOLO con este JSON (sin markdown, sin texto extra):
{
  "prioridades": [
    { "tema": "nombre del tema BD2", "razon": "por qué es urgente para este estudiante", "horas_semana": 3, "nivel": "básico" }
  ],
  "plan_semanal": [
    { "semana": ${currentWeek + 1}, "actividades": ["actividad concreta 1", "actividad concreta 2"] },
    { "semana": ${currentWeek + 2}, "actividades": ["actividad concreta 1"] }
  ],
  "recursos_recomendados": [
    { "tipo": "ejercicio", "descripcion": "descripción concreta del recurso" }
  ],
  "mensaje_motivacional": "mensaje personalizado y empático para este estudiante específico"
}`

    const raw = await ollamaChat([{ role: 'user', content: prompt }])

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    try {
      const parsed = JSON.parse(jsonMatch?.[0] ?? raw)
      res.json({ data: parsed })
    } catch {
      res.json({ data: null, raw })
    }
  } catch (err: unknown) {
    console.error('LLM learning-path error:', err)
    res.status(502).json({ error: err instanceof Error ? err.message : 'Error LLM' })
  }
})

// ── POST /api/llm/recommend ───────────────────────────────────────────────────
// Recomendaciones pedagógicas para el tutor
router.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { studentContext, weakAreas = [] } = req.body as {
      studentContext: unknown
      weakAreas?:     string[]
    }

    const prompt = `Eres E-Tutor, asistente de tutoría universitaria UNFV. Genera recomendaciones pedagógicas basadas en el perfil.

PERFIL: ${typeof studentContext === 'string' ? studentContext : JSON.stringify(studentContext)}
ÁREAS DÉBILES: ${weakAreas.length > 0 ? weakAreas.join(', ') : 'no especificadas'}

Responde SOLO con este JSON:
{
  "recomendaciones": ["recomendación concreta 1", "recomendación concreta 2", "recomendación concreta 3"],
  "estrategias": ["estrategia de intervención 1", "estrategia de intervención 2"],
  "temas_urgentes": ["tema BD2 urgente 1", "tema BD2 urgente 2"],
  "prioridad": "ALTA",
  "resumen": "resumen ejecutivo en 1-2 oraciones para el tutor"
}`

    const raw = await ollamaChat([{ role: 'user', content: prompt }])
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    try {
      const parsed = JSON.parse(jsonMatch?.[0] ?? raw)
      res.json({ data: parsed })
    } catch {
      res.json({ data: null, raw })
    }
  } catch (err: unknown) {
    console.error('LLM recommend error:', err)
    res.status(502).json({ error: err instanceof Error ? err.message : 'Error LLM' })
  }
})

export { router as llmRouter }
