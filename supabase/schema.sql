-- =============================================
-- TutorIA Database Schema
-- Run in Supabase SQL Editor
-- =============================================

-- Student profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  career TEXT NOT NULL DEFAULT '',
  cycle INTEGER NOT NULL DEFAULT 1 CHECK (cycle BETWEEN 1 AND 10),
  academic_performance TEXT,
  weekly_study_hours TEXT,
  work_situation TEXT,
  learning_style TEXT,
  comfort_level TEXT,
  motivation TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Courses catalog
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  cycle INTEGER NOT NULL CHECK (cycle BETWEEN 1 AND 10),
  career TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student-course enrollment
CREATE TABLE IF NOT EXISTS student_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  grade NUMERIC(4,1),
  cycle INTEGER NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  UNIQUE(student_id, course_id, cycle, year)
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 16),
  present BOOLEAN NOT NULL DEFAULT true,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(student_id, course_id, week)
);

-- Syllabus topics per course
CREATE TABLE IF NOT EXISTS syllabus_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 16),
  title TEXT NOT NULL,
  description TEXT,
  resources TEXT[] DEFAULT '{}',
  completed_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('warning', 'info', 'success', 'danger')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Achievements / badges
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  badge TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat history
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  score_impact INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Courses: anyone authenticated can read
CREATE POLICY "courses_select" ON courses FOR SELECT TO authenticated USING (true);

-- Student profiles: own profile only
CREATE POLICY "profiles_select" ON student_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "profiles_insert" ON student_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_update" ON student_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Student courses
CREATE POLICY "student_courses_select" ON student_courses FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "student_courses_all" ON student_courses FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- Attendance
CREATE POLICY "attendance_select" ON attendance FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "attendance_all" ON attendance FOR ALL TO authenticated
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- Syllabus topics: all authenticated can read
CREATE POLICY "syllabus_select" ON syllabus_topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "syllabus_update" ON syllabus_topics FOR UPDATE TO authenticated USING (true);

-- Notifications: own only
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Achievements
CREATE POLICY "achievements_select" ON achievements FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- Chat messages
CREATE POLICY "chat_select" ON chat_messages FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "chat_insert" ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- =============================================
-- Realtime
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =============================================
-- Sample data
-- =============================================

INSERT INTO courses (name, code, credits, cycle, career) VALUES
  ('Cálculo I', 'MAT101', 4, 1, 'Ingeniería de Sistemas'),
  ('Álgebra Lineal', 'MAT102', 4, 1, 'Ingeniería de Sistemas'),
  ('Introducción a la Programación', 'INF101', 4, 1, 'Ingeniería de Sistemas'),
  ('Química General', 'QUI101', 3, 1, 'Ingeniería de Sistemas'),
  ('Comunicación', 'HUM101', 2, 1, 'Ingeniería de Sistemas'),
  ('Cálculo II', 'MAT201', 4, 2, 'Ingeniería de Sistemas'),
  ('Estructuras de Datos', 'INF201', 4, 2, 'Ingeniería de Sistemas'),
  ('Física I', 'FIS101', 4, 2, 'Ingeniería de Sistemas')
ON CONFLICT DO NOTHING;
