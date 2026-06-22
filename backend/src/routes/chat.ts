import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface StudentProfile {
  name: string
  career: string
  cycle: number
  learning_style: string
  comfort_level: string
  level: number
}

function buildSystemPrompt(profile: StudentProfile, score: number, courseId: string | null): string {
  const difficulty = score < 30 ? 'básico' : score < 60 ? 'intermedio' : score < 85 ? 'avanzado' : 'experto'

  return `Eres un tutor socrático de la plataforma TutorIA para la universidad.

ESTUDIANTE:
- Nombre: ${profile.name}
- Carrera: ${profile.career}
- Ciclo: ${profile.cycle}°
- Estilo de aprendizaje: ${profile.learning_style}
- Comodidad con los cursos: ${profile.comfort_level}
- Nivel en la plataforma: ${profile.level}
- Score actual: ${score}/100 → Nivel de dificultad: ${difficulty}

${courseId ? `Contexto: El estudiante está preguntando sobre el curso seleccionado.` : 'Contexto: Consulta general.'}

INSTRUCCIONES SOCRÁTICAS OBLIGATORIAS:
1. NUNCA des la respuesta directamente. Guía al estudiante a descubrirla.
2. Responde SIEMPRE con preguntas que hagan reflexionar al estudiante.
3. Si el estudiante llegó a la respuesta correcta, valídalo con entusiasmo y propón profundizar.
4. Si está equivocado, no lo digas directamente — haz preguntas que lo lleven a reconsiderar.
5. Ajusta la complejidad al nivel ${difficulty}:
   - Básico: preguntas simples, analogías cotidianas, pasos muy pequeños
   - Intermedio: conecta conceptos, pide explicaciones propias
   - Avanzado: análisis crítico, casos borde, comparaciones
   - Experto: síntesis, aplicación a problemas reales, enseña a otros

6. Sé cálido, motivador y paciente. Celebra el progreso.
7. Máximo 3-4 preguntas por respuesta. No satures.
8. En español peruano natural.

Responde siempre en español. Sé conciso pero profundo.`
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

    const systemPrompt = buildSystemPrompt(studentProfile, score, courseId)

    const messages = [
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''
    res.json({ reply })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: 'Error al procesar el mensaje' })
  }
})

export { router as chatRouter }
