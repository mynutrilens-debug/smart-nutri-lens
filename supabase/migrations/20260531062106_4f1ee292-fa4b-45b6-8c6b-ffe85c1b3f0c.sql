-- Drop insecure demo anon policies
DROP POLICY IF EXISTS "demo anon profile all" ON public.profiles;
DROP POLICY IF EXISTS "demo anon food all" ON public.food_logs;
DROP POLICY IF EXISTS "demo anon workouts all" ON public.workouts;
DROP POLICY IF EXISTS "demo anon we all" ON public.weight_entries;
DROP POLICY IF EXISTS "demo anon ai select" ON public.ai_insights;
DROP POLICY IF EXISTS "demo anon ai insert" ON public.ai_insights;

-- Revoke anon access; only authenticated users (via RLS auth.uid() = user_id) may access
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.food_logs FROM anon;
REVOKE ALL ON public.workouts FROM anon;
REVOKE ALL ON public.weight_entries FROM anon;
REVOKE ALL ON public.ai_insights FROM anon;

-- Ensure authenticated role retains necessary grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_entries TO authenticated;
GRANT SELECT, INSERT ON public.ai_insights TO authenticated;