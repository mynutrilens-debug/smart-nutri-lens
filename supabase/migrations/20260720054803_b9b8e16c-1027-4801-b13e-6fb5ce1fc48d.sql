
CREATE OR REPLACE FUNCTION public.find_squad_by_code(_code TEXT)
RETURNS TABLE (id UUID, ends_at TIMESTAMPTZ, finalized_at TIMESTAMPTZ, name TEXT)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, ends_at, finalized_at, name FROM public.squads WHERE code = upper(_code) LIMIT 1;
$$;
