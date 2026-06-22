import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      student_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string
          career: string
          cycle: number
          academic_performance: string
          weekly_study_hours: string
          work_situation: string
          learning_style: string
          comfort_level: string
          motivation: string
          xp: number
          level: number
          streak: number
          created_at: string
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          code: string
          credits: number
          cycle: number
          career: string
        }
      }
      student_courses: {
        Row: {
          id: string
          student_id: string
          course_id: string
          grade: number | null
          cycle: number
          year: number
        }
      }
      attendance: {
        Row: {
          id: string
          student_id: string
          course_id: string
          week: number
          present: boolean
          date: string
        }
      }
      syllabus_topics: {
        Row: {
          id: string
          course_id: string
          week: number
          title: string
          description: string
          resources: string[]
          completed_by: string[]
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'warning' | 'info' | 'success' | 'danger'
          read: boolean
          created_at: string
        }
      }
      achievements: {
        Row: {
          id: string
          student_id: string
          badge: string
          title: string
          description: string
          earned_at: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          student_id: string
          course_id: string | null
          role: 'user' | 'assistant'
          content: string
          score_impact: number
          created_at: string
        }
      }
    }
  }
}
