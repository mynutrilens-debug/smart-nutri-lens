# Architecture decisions

- Razorpay webhooks are the billing source of truth; verified checkout callbacks may only provision the initial trial for immediate UX.
- Paid AI server functions call the shared subscription entitlement helper because client-side feature gates are not a security boundary.
- Razorpay plans are created on demand and their provider IDs are stored with the user's subscription to avoid requiring additional configuration secrets.