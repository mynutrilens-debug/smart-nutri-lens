CREATE POLICY "service role manages billing webhook events"
ON public.billing_webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);