import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

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

    for (const sc of studentCourses) {
      const courseAttendance = (attendance ?? []).filter(a => a.course_id === sc.course_id)
      const absences = courseAttendance.filter(a => !a.present).length
      const absenceRate = absences / TOTAL_CLASSES

      if (absenceRate >= RISK_THRESHOLD) {
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
            title: '⚠️ Riesgo académico',
            message: `Tienes ${absences} inasistencias en ${sc.course?.name} (${Math.round(absenceRate * 100)}%). Riesgo de retiro automático.`,
            type: 'danger',
            read: false,
          })
        }
      }
    }

    res.json({ checked: true })
  } catch (err) {
    console.error('Risk check error:', err)
    res.status(500).json({ error: 'Error checking risk' })
  }
})

export { router as tutorRouter }
