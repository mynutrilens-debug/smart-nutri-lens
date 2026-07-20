
-- Revoke EXECUTE on SECURITY DEFINER functions from PUBLIC and anon.
-- Keep authenticated EXECUTE only where genuinely needed (RPC calls, RLS helper).
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_trial_subscription() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_push_subscriptions_updated_at() FROM PUBLIC, anon, authenticated;

-- is_squad_member is used inside RLS policies; policies evaluate as the querying role,
-- so authenticated needs EXECUTE. anon does not.
REVOKE ALL ON FUNCTION public.is_squad_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_squad_member(uuid, uuid) TO authenticated;

-- find_squad_by_code is called via RPC by signed-in users only.
REVOKE ALL ON FUNCTION public.find_squad_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_squad_by_code(text) TO authenticated;

-- squad_members: allow a member to update their own row (e.g. display_name).
CREATE POLICY "Members can update own row"
ON public.squad_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- squad_rewards: explicitly deny client writes. Service role bypasses RLS,
-- so server-side finalization continues to work.
CREATE POLICY "Deny client inserts on squad_rewards"
ON public.squad_rewards
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny client updates on squad_rewards"
ON public.squad_rewards
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny client deletes on squad_rewards"
ON public.squad_rewards
FOR DELETE
TO authenticated, anon
USING (false);
