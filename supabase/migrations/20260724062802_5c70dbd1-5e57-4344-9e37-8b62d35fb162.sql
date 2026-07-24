
ALTER TABLE public.squads REPLICA IDENTITY FULL;
ALTER TABLE public.squad_members REPLICA IDENTITY FULL;
ALTER TABLE public.squad_rewards REPLICA IDENTITY FULL;
ALTER TABLE public.food_logs REPLICA IDENTITY FULL;
ALTER TABLE public.workouts REPLICA IDENTITY FULL;
ALTER TABLE public.weight_entries REPLICA IDENTITY FULL;
ALTER TABLE public.health_snapshots REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.squads; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_members; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_rewards; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.food_logs; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.workouts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.weight_entries; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.health_snapshots; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
