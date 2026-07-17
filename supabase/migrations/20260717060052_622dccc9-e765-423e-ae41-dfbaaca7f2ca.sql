
-- profiles: quick-access health signals + toggle
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS resting_hr integer,
  ADD COLUMN IF NOT EXISTS sleep_minutes integer,
  ADD COLUMN IF NOT EXISTS active_minutes_today integer,
  ADD COLUMN IF NOT EXISTS health_sync_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS health_last_synced_at timestamptz;

-- workouts: source tracking for imported sessions
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS source_id text;

CREATE UNIQUE INDEX IF NOT EXISTS workouts_source_dedup_idx
  ON public.workouts (user_id, source, source_id)
  WHERE source IS NOT NULL AND source_id IS NOT NULL;

-- health_snapshots: one row per user per day
CREATE TABLE IF NOT EXISTS public.health_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  captured_on date NOT NULL,
  source text NOT NULL,
  steps integer,
  calories_burned integer,
  distance_m integer,
  active_minutes integer,
  avg_heart_rate integer,
  resting_heart_rate integer,
  sleep_minutes integer,
  weight_kg numeric(6,2),
  height_cm numeric(6,2),
  workouts_count integer,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, captured_on)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_snapshots TO authenticated;
GRANT ALL ON public.health_snapshots TO service_role;

ALTER TABLE public.health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own health snapshots"
  ON public.health_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own health snapshots"
  ON public.health_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own health snapshots"
  ON public.health_snapshots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own health snapshots"
  ON public.health_snapshots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER health_snapshots_set_updated_at
  BEFORE UPDATE ON public.health_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
