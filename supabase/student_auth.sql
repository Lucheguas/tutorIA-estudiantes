-- Tabla puente: Auth user → estudiante existente
-- Pegar en: https://supabase.com/dashboard/project/obtoeouejhukiywafdhy/sql/new

CREATE TABLE IF NOT EXISTS public.student_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_profiles_own" ON public.student_profiles;
CREATE POLICY "student_profiles_own" ON public.student_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid());
