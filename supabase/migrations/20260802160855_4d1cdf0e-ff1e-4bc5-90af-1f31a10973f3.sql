CREATE TABLE IF NOT EXISTS public.notification_prefs (
  user_id uuid PRIMARY KEY,
  tz_offset_minutes integer NOT NULL DEFAULT 330,
  meals_enabled boolean NOT NULL DEFAULT true,
  water_enabled boolean NOT NULL DEFAULT true,
  workout_enabled boolean NOT NULL DEFAULT true,
  squad_enabled boolean NOT NULL DEFAULT true,
  streak_enabled boolean NOT NULL DEFAULT true,
  breakfast_at time NOT NULL DEFAULT '08:30',
  lunch_at time NOT NULL DEFAULT '13:00',
  dinner_at time NOT NULL DEFAULT '20:00',
  workout_at time NOT NULL DEFAULT '18:00',
  quiet_start time NOT NULL DEFAULT '22:30',
  quiet_end time NOT NULL DEFAULT '07:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_prefs TO authenticated;
GRANT ALL ON public.notification_prefs TO service_role;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own prefs select" ON public.notification_prefs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own prefs insert" ON public.notification_prefs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs update" ON public.notification_prefs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own prefs delete" ON public.notification_prefs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER notification_prefs_updated_at BEFORE UPDATE ON public.notification_prefs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  dedupe_key text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  url text NOT NULL DEFAULT '/home',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_log_dedupe_idx ON public.notification_log (user_id, dedupe_key);
CREATE INDEX IF NOT EXISTS notification_log_user_created_idx ON public.notification_log (user_id, created_at DESC);

GRANT SELECT ON public.notification_log TO authenticated;
GRANT ALL ON public.notification_log TO service_role;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notification log select" ON public.notification_log FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.squad_members ADD COLUMN IF NOT EXISTS last_rank integer;
ALTER TABLE public.squad_members ADD COLUMN IF NOT EXISTS last_points integer NOT NULL DEFAULT 0;