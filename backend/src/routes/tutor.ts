import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// ponytail: placeholder so the server boots without Supabase creds; tutor routes will return empty data
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder-key'
)

const getApiUrl = () => process.env.API_URL ?? 'https://llm.mystic-byte.com/api/v1'
const getApiKey = () => process.env.API_KEY ?? 'etutor-dev-key-2026'

async function callRiskAssess(studentId: string): Promise<void> {
  try {
    const res = await fetch(`${getApiUrl()}/risk/${studentId}/assess`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey(),
      },
    })
    if (!res.ok) {
      console.warn(`Risk assess API returned ${res.status} for student ${studentId}`)
    } else {
      const data = await res.json()
      console.log(`Risk assess result for ${studentId}:`, data)
    }
  } catch (err) {
    // Non-fatal: log and continue â€” the Supabase notification was already created
    console.warn('Risk assess call failed (non-fatal):', err)
  }
}

// Called periodically or on demand to check attendance risk and notify tutors
router.post('/check-risk', async (req: Request, res: Response) => {
  try {
    const { studentId } = req.body as { studentId: string }

    // Get student profile
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('id', studentId)
      .single()

    if (!profile) { res.status(404).json({ error: 'Student not found' }); return }

    // Get courses for current cycle
    const { data: studentCourses } = await supabase
      .from('student_courses')
      .select('*, course:courses(*)')
      .eq('student_id', studentId)
      .eq('cycle', profile.cycle)

    if (!studentCourses) { res.json({ checked: true }); return }

    // Get attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)

    const TOTAL_CLASSES = 16
    const RISK_THRESHOLD = 0.33

    let hasRisk = false

    for (const sc of studentCourses) {
      const courseAttendance = (attendance ?? []).filter(a => a.course_id === sc.course_id)
      const absences = courseAttendance.filter(a => !a.present).length
      const absenceRate = absences / TOTAL_CLASSES

      if (absenceRate >= RISK_THRESHOLD) {
        hasRisk = true

        // Check if notification already exists
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', profile.user_id)
          .ilike('message', `%${sc.course?.name}%riesgo%`)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

        if (!existing || existing.length === 0) {
          await supabase.from('notifications').insert({
            user_id: profile.user_id,
            title: 'âš ï¸ Riesgo acadÃ©mico',
            message: `Tienes ${absences} inasistencias en ${sc.course?.name} (${Math.round(absenceRate * 100)}%). Riesgo de retiro automÃ¡tico.`,
            type: 'danger',
            read: false,
          })
        }
      }
    }

    // If there is academic risk, notify our AI backend for deeper analysis
    if (hasRisk) {
      await callRiskAssess(studentId)
    }

    res.json({ checked: true, hasRisk })
  } catch (err) {
    console.error('Risk check error:', err)
    res.status(500).json({ error: 'Error checking risk' })
  }
})

export { router as tutorRouter }

