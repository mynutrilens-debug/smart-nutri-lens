-- Allow anonymous (demo) access for the fixed DEMO_USER_ID so the app works without auth.
-- DEMO_USER_ID = 00000000-0000-4000-8000-000000000001

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_entries TO anon;
GRANT SELECT, INSERT ON public.ai_insights TO anon;

DO $$
DECLARE
  demo_id uuid := '00000000-0000-4000-8000-000000000001';
BEGIN
  -- profiles
  EXECUTE 'CREATE POLICY "demo anon profile all" ON public.profiles FOR ALL TO anon USING (user_id = ''' || demo_id || ''') WITH CHECK (user_id = ''' || demo_id || ''')';
  -- food_logs
  EXECUTE 'CREATE POLICY "demo anon food all" ON public.food_logs FOR ALL TO anon USING (user_id = ''' || demo_id || ''') WITH CHECK (user_id = ''' || demo_id || ''')';
  -- workouts
  EXECUTE 'CREATE POLICY "demo anon workouts all" ON public.workouts FOR ALL TO anon USING (user_id = ''' || demo_id || ''') WITH CHECK (user_id = ''' || demo_id || ''')';
  -- weight_entries
  EXECUTE 'CREATE POLICY "demo anon we all" ON public.weight_entries FOR ALL TO anon USING (user_id = ''' || demo_id || ''') WITH CHECK (user_id = ''' || demo_id || ''')';
  -- ai_insights
  EXECUTE 'CREATE POLICY "demo anon ai select" ON public.ai_insights FOR SELECT TO anon USING (user_id = ''' || demo_id || ''')';
  EXECUTE 'CREATE POLICY "demo anon ai insert" ON public.ai_insights FOR INSERT TO anon WITH CHECK (user_id = ''' || demo_id || ''')';
END $$;