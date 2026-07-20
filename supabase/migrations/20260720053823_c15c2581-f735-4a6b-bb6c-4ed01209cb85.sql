
-- Squad Challenges feature
CREATE TYPE public.squad_challenge_type AS ENUM (
  'weight_loss','muscle_gain','steps','healthy_eating','workout','hydration','sleep','custom'
);

CREATE TYPE public.squad_period AS ENUM ('weekly','monthly');

CREATE TABLE public.squads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL,
  challenge_type public.squad_challenge_type NOT NULL DEFAULT 'workout',
  custom_challenge TEXT,
  goal_description TEXT,
  goal_target NUMERIC,
  period public.squad_period NOT NULL DEFAULT 'weekly',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.squads TO authenticated;
GRANT ALL ON public.squads TO service_role;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.squad_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (squad_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_members TO authenticated;
GRANT ALL ON public.squad_members TO service_role;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.squad_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rank INT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  badge TEXT,
  coupon_code TEXT,
  platinum_days INT NOT NULL DEFAULT 0,
  xp_bonus INT NOT NULL DEFAULT 0,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (squad_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_rewards TO authenticated;
GRANT ALL ON public.squad_rewards TO service_role;
ALTER TABLE public.squad_rewards ENABLE ROW LEVEL SECURITY;

-- Security definer: is the user a member of this squad?
CREATE OR REPLACE FUNCTION public.is_squad_member(_squad_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.squad_members WHERE squad_id = _squad_id AND user_id = _user_id);
$$;

-- Policies: squads visible to members; anyone authenticated can look up by code via server fn (uses service or filter by code below)
CREATE POLICY "Members view their squads" ON public.squads FOR SELECT TO authenticated
  USING (public.is_squad_member(id, auth.uid()) OR owner_id = auth.uid());
CREATE POLICY "Users create squads they own" ON public.squads FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update squads" ON public.squads FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete squads" ON public.squads FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Members view roster" ON public.squad_members FOR SELECT TO authenticated
  USING (public.is_squad_member(squad_id, auth.uid()));
CREATE POLICY "Users join as themselves" ON public.squad_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users leave their membership" ON public.squad_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Members view rewards" ON public.squad_rewards FOR SELECT TO authenticated
  USING (public.is_squad_member(squad_id, auth.uid()) OR user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER squads_updated_at BEFORE UPDATE ON public.squads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX squad_members_squad_idx ON public.squad_members(squad_id);
CREATE INDEX squad_members_user_idx ON public.squad_members(user_id);
CREATE INDEX squads_code_idx ON public.squads(code);
