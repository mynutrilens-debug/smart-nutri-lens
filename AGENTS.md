# Architecture decisions

- Razorpay webhooks reconcile billing; checkout callbacks may activate a bounded paid cycle only after signature, ownership, provider plan, and captured full-payment validation.
- Paid AI server functions call the shared subscription entitlement helper because client-side feature gates are not a security boundary.
- Razorpay plans are created on demand and their provider IDs are stored with the user's subscription to avoid requiring additional configuration secrets.
- Share monthly plan metadata and paid-cycle validation across checkout and webhook paths to prevent price drift and authorization-only access.