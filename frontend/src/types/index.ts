export interface StudentProfile {
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

export interface Course {
  id: string
  name: string
  code: string
  credits: number
  cycle: number
  career: string
}

export interface StudentCourse {
  id: string
  student_id: string
  course_id: string
  grade: number | null
  cycle: number
  year: number
  course?: Course
}

export interface Attendance {
  id: string
  student_id: string
  course_id: string
  week: number
  present: boolean
  date: string
}

export interface SyllabusTopic {
  id: string
  course_id: string
  week: number
  title: string
  description: string
  resources: string[]
  completed_by: string[]
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'warning' | 'info' | 'success' | 'danger'
  read: boolean
  created_at: string
}

export interface Achievement {
  id: string
  student_id: string
  badge: string
  title: string
  description: string
  earned_at: string
}

export interface ChatMessage {
  id: string
  student_id: string
  course_id: string | null
  role: 'user' | 'assistant'
  content: string
  score_impact: number
  created_at: string
}
