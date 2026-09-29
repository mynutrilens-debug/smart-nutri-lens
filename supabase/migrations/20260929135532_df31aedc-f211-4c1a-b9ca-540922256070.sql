ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'retrying';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'halted';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'completed';

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_plan_id text,
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS mandate_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS trial_authorized_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_charge_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_charge_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS grace_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_webhook_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_consumed boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_razorpay_subscription_unique
  ON public.subscriptions (razorpay_subscription_id)
  WHERE razorpay_subscription_id IS NOT NULL;

ALTER TABLE public.payments
  ALTER COLUMN razorpay_order_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id text,
  ADD COLUMN IF NOT EXISTS provider_event_id text,
  ADD COLUMN IF NOT EXISTS billing_reason text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS failure_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS payments_razorpay_payment_unique
  ON public.payments (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_event_unique
  ON public.payments (provider_event_id)
  WHERE provider_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_subscription_idx
  ON public.payments (razorpay_subscription_id);

CREATE TABLE public.billing_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  provider_subscription_id text,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.billing_webhook_events TO service_role;
ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "users update own subscription" ON public.subscriptions;
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;

CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (
    user_id, plan, status, trial_started_at, trial_expires_at,
    mandate_status, provider_status, trial_consumed
  ) VALUES (
    NEW.user_id, 'trial', 'pending', now(), now() + interval '7 days',
    'none', 'unselected', false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;