ALTER TABLE public.notification_prefs
  ADD COLUMN IF NOT EXISTS sleep_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sleep_at time NOT NULL DEFAULT '22:30',
  ADD COLUMN IF NOT EXISTS local_reminders boolean NOT NULL DEFAULT true;