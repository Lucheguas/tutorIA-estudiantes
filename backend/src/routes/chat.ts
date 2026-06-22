import { Router, Request, Response } from 'express'

const router = Router()

// ponytail: read lazily so dotenv has time to load
const getApiUrl = () => process.env.API_URL ?? 'https://llm.mystic-byte.com/api/v1'
const getApiKey = () => process.env.API_KEY ?? 'etutor-dev-key-2026'

// In-memory session store: studentId -> sessionId
const sessionMap = new Map<string, string>()

interface StudentProfile {
  name: string
  career: string
  cycle: number
  learning_style: string
  comfort_level: string
  level: number
}

function buildTopic(profile: StudentProfile, score: number, courseId: string | null): string {
  const difficulty = score < 30 ? 'básico' : score < 60 ? 'intermedio' : score < 85 ? 'avanzado' : 'experto'

  return `Tutor socrático para ${profile.name} (${profile.career}, ciclo ${profile.cycle}).
Estilo: ${profile.learning_style}. Comodidad: ${profile.comfort_level}. Nivel plataforma: ${profile.level}. Score: ${score}/100 → ${difficulty}.
${courseId ? 'Contexto: consulta sobre curso seleccionado.' : 'Contexto: consulta general.'}
INSTRUCCIONES: Nunca des la respuesta directamente. Guía con preguntas socráticas. Ajusta complejidad al nivel ${difficulty}. Máx 3-4 preguntas por respuesta. En español peruano natural. Sé cálido y motivador.`
}

async function getOrCreateSession(
  studentId: string,
  courseId: string | null,
  topic: string
): Promise<string> {
  const existing = sessionMap.get(studentId)
  if (existing) return existing

  const res = await fetch(`${getApiUrl()}/chat/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getApiKey(),
    },
    body: JSON.stringify({
      studentId,
      courseId: courseId ?? undefined,
      topic,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to create session: ${res.status} ${text}`)
  }

  // NestJS TransformInterceptor wraps: { success, data: { id }, timestamp }
  const raw = await res.json() as any
  const payload = raw?.data ?? raw
  const sessionId = payload?.id ?? payload?.sessionId
  if (!sessionId) throw new Error('No sessionId returned from API')

  sessionMap.set(studentId, sessionId)
  return sessionId
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, studentProfile, courseId, score, history } = req.body as {
      message: string
      studentProfile: StudentProfile
      courseId: string | null
      score: number
      history: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    if (!message || !studentProfile) {
      res.status(400).json({ error: 'message and studentProfile are required' })
      return
    }

    // Use student name as a stable key — in production use studentId from auth
    const studentId = studentProfile.name.replace(/\s+/g, '_').toLowerCase()
    const topic = buildTopic(studentProfile, score ?? 50, courseId)

    const sessionId = await getOrCreateSession(studentId, courseId, topic)

    const msgRes = await fetch(`${getApiUrl()}/chat/sessions/${sessionId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey(),
      },
      body: JSON.stringify({
        message,
        studentId,
        history: history?.slice(-10) ?? [],
      }),
    })

    if (!msgRes.ok) {
      // Session may be expired — clear cache and retry once
      sessionMap.delete(studentId)
      const newSessionId = await getOrCreateSession(studentId, courseId, topic)

      const retryRes = await fetch(`${getApiUrl()}/chat/sessions/${newSessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': getApiKey(),
        },
        body: JSON.stringify({ message, studentId, history: history?.slice(-10) ?? [] }),
      })

      if (!retryRes.ok) {
        const errText = await retryRes.text()
        throw new Error(`Message send failed after retry: ${retryRes.status} ${errText}`)
      }

      const retryRaw = await retryRes.json() as any
      const retryPayload = retryRaw?.data ?? retryRaw
      const reply = retryPayload?.content ?? retryPayload?.reply ?? retryPayload?.response ?? ''
      res.json({ reply })
      return
    }

    const msgRaw = await msgRes.json() as any
    const msgPayload = msgRaw?.data ?? msgRaw
    const reply = msgPayload?.content ?? msgPayload?.reply ?? msgPayload?.response ?? ''
    res.json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: 'Error al procesar el mensaje' })
  }
})

export { router as chatRouter }
