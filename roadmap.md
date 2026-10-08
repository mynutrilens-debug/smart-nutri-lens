# Subscription rollout

- [x] Audit existing trial, payment, and entitlement paths
- [x] Add secure recurring-billing schema and access rules
- [x] Implement Razorpay subscription creation, verification, cancellation, and webhook reconciliation
- [x] Update plan selection, mandate choice, status, and cancellation UI
- [x] Enforce paid AI entitlements server-side
- [x] Verify build and core subscription screens

# Paid monthly memberships
- [x] Update monthly prices and remove new-purchase trial messaging
- [x] Activate selected-tier access only after verified full payment, for a bounded monthly period
- [x] Verify pricing and payment/access rules (five automated tests pass; build OK; signed-out pricing redirects as expected)
- [ ] Live payment check (requires signed-in Razorpay checkout on the externally managed account)