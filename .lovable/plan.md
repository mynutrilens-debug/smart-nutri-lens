# Mandate-backed subscriptions

## Outcome
- Make Silver (₹99/month), Gold (₹199/month), and Platinum (₹399/month) recurring plans.
- Let new and currently unpaid users select a plan, authorize UPI AutoPay or Card, receive that plan’s access for seven days, then charge the monthly price on Day 8.
- Keep access synchronized with Razorpay for renewals, retries, failures, cancellation, and expiry.

## Implementation
1. **Harden subscription records**
   - Add provider lifecycle fields for mandate state, trial dates, billing period, next charge, cancellation, retry state, and webhook reconciliation.
   - Add an idempotent webhook-event ledger and uniqueness rules for provider subscription/payment IDs.
   - Remove direct browser permission to alter plan, status, or billing dates; payment state changes will only happen through authenticated server actions and verified Razorpay webhooks.

2. **Create real Razorpay subscriptions**
   - Replace one-time order checkout with Razorpay monthly subscriptions for all three plans.
   - Create/reuse the matching Razorpay monthly plan server-side, then create a subscription whose first charge starts after the seven-day trial.
   - Open Razorpay Checkout with the subscription ID so the user explicitly authorizes a UPI AutoPay or Card mandate.
   - Verify the returned signature against the server-stored subscription and selected plan rather than trusting values sent by the browser.
   - Allow one trial per eligible unpaid user and prevent duplicate active mandates.

3. **Make webhooks the billing source of truth**
   - Process authenticated/activated, charged, pending, failed, paused/halted, cancelled, and completed subscription events.
   - Deduplicate webhook retries, log each charge, update retry/next-charge details, and grant or revoke access from verified provider state.
   - Keep access during Razorpay’s active retry window, then restrict paid features when retries are exhausted, the subscription expires, or cancellation reaches its effective date.

4. **Add subscription controls and clear states**
   - Update the plan screen with the selected payment authorization flow, seven-day trial terms, next charge date, active/retrying/cancelled state, and a cancel-renewal action.
   - Show clear success, pending, failure, retry, and cancellation messages; refresh access after checkout and webhook updates.
   - Update the trial banner so it reflects the selected plan and upcoming first charge.

5. **Enforce access securely**
   - Centralize entitlement evaluation for trial, active billing, retry grace, cancellation-at-period-end, and expired/failed states.
   - Apply the same check to paid AI operations on the server, not only to visible buttons, so direct requests cannot bypass a plan.

6. **Verify the complete lifecycle**
   - Validate new-user and unpaid-user trial enrollment, mandate success/failure, Day-8 activation, renewal, retry recovery, exhausted failure, and cancellation.
   - Confirm duplicate callbacks/webhooks do not double-charge or extend access twice, and verify mobile and desktop plan screens.

## Technical details
- Existing Razorpay credentials and the public webhook route will be reused; no new key entry is required.
- Razorpay webhook signatures will continue to be checked against the raw request body before any state change.
- Provider timestamps, IDs, and event payloads remain server-only; the app receives only safe subscription status details.
- Database changes will be delivered as a managed migration with explicit authenticated/service-role grants and row-level access rules.
