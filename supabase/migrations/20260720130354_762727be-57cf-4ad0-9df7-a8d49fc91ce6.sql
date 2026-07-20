-- Revert previous security hardening migration that broke the app
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_trial_subscription() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_push_subscriptions_updated_at() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_squad_member(uuid, uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_squad_by_code(text) TO PUBLIC;

DROP POLICY IF EXISTS "Members can update own row" ON public.squad_members;
DROP POLICY IF EXISTS "Deny client inserts on squad_rewards" ON public.squad_rewards;
DROP POLICY IF EXISTS "Deny client updates on squad_rewards" ON public.squad_rewards;
DROP POLICY IF EXISTS "Deny client deletes on squad_rewards" ON public.squad_rewards;