
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS lifestyle text,
  ADD COLUMN IF NOT EXISTS meal_frequency integer,
  ADD COLUMN IF NOT EXISTS sleep_hours numeric,
  ADD COLUMN IF NOT EXISTS water_intake_l numeric,
  ADD COLUMN IF NOT EXISTS workout_habit text,
  ADD COLUMN IF NOT EXISTS deficiencies text[] NOT NULL DEFAULT '{}'::text[];
