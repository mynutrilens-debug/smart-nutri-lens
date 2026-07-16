# Health Connect + HealthKit Integration Plan

Sync steps, calories, distance, active minutes, workouts, heart rate, sleep, weight, and height from Google Health Connect (Android) and Apple HealthKit (iOS) into MyNutriLens, then use those signals to power the dashboard and improve AI plans.

## 1. Native plugin

Use `@kiwi-health/capacitor-health-connect` for Android and `@perfood/capacitor-healthkit` for iOS (both actively maintained, cover the metrics needed). Wrap them behind a single `src/lib/health.ts` bridge:

- `isHealthAvailable()` — platform + install/permission check
- `requestHealthPermissions()` — request read scopes for the 9 metrics
- `readHealthSnapshot({ since })` — normalized shape: `{ steps, caloriesBurned, distanceM, activeMinutes, workouts[], heartRate{avg,resting}, sleep{minutes,stages}, weightKg, heightCm }`
- Web/unsupported → returns `{ available: false }` for graceful fallback

Native config:
- Android: add Health Connect permissions to `AndroidManifest.xml` + intent filter for the permissions rationale activity, min SDK stays 24 (Health Connect handles older via Play install).
- iOS: add HealthKit entitlement + `NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription` in `Info.plist`.

## 2. Storage

New table `health_snapshots` (Supabase migration) keyed by `user_id + captured_on (date)` with columns for each metric + `raw jsonb` + `source` (`healthkit` | `health_connect` | `manual`). RLS: user reads/writes own rows only, service_role full. Also add nullable `resting_hr`, `sleep_minutes`, `active_minutes` to `profiles` for the latest quick-access values used by AI prompts.

Weight readings additionally upsert into existing `weight_entries`; workouts additionally insert into existing `workouts` (dedup by `source_id`, add `source` + `source_id` columns via migration).

## 3. Sync flow

- `src/lib/health.functions.ts` server fn `ingestHealthSnapshot` — accepts normalized payload, upserts `health_snapshots`, mirrors into `weight_entries` / `workouts`, updates `profiles.resting_hr` etc.
- Client sync helper `syncHealth()` in `src/lib/health.ts`:
  - Foreground: called on app resume, on Home mount, and via a manual "Sync Health" button.
  - Background: register `App.addListener('appStateChange')` in `src/lib/native.ts` to trigger sync when app becomes active (true OS background sync requires a native background task — out of scope; documented as follow-up).
- After successful sync: `queryClient.invalidateQueries()` so dashboard/diet/workout reflect new data immediately.

## 4. UI surfaces

- **Onboarding**: new step "Connect Health" with Allow/Skip. Skip is always allowed.
- **Profile / Me**: "Health sources" card showing connection status, last sync time, resting HR, sleep last night, weekly steps sparkline; manual "Sync now" button.
- **Home dashboard**: today's steps, active minutes, and calories-burned-from-device merged into existing Quick Log/burn totals (device value takes precedence over manual when both present).
- **Workout**: imported HealthKit/Health Connect workouts appear in history with a small "Apple Health" / "Health Connect" badge.
- **Weight tracker**: automatically ingests HealthKit weight; user-entered still supported.
- **Graceful fallback**: on web or when permission denied, hide the Health card and keep manual entry paths intact.

## 5. AI enrichment

Extend the Gemini prompt builders in `src/lib/onboarding.functions.ts` and `src/lib/workout.functions.ts` with a `healthContext` block (avg daily steps, active minutes, resting HR, sleep, latest weight trend). Adjust calorie target and workout intensity recommendations:
- TDEE nudged by measured activity vs. sedentary baseline.
- Recovery-aware workouts: if resting HR trending up or sleep < 6h avg for 3 days → prefer a lighter/mobility session that day.
- Nutrition coach messages reference concrete numbers ("You averaged 8.4k steps and slept 6h12 — adding 15g protein at lunch").

## 6. Security

- Health data stays in Supabase behind RLS; never sent to third parties other than Gemini (only aggregated summary numbers, no raw samples).
- Bearer-authenticated server fn writes only; no service-role client from the browser.
- Explicit permission prompt with clear copy; user can revoke via OS settings and disconnect via in-app toggle (`profiles.health_sync_enabled`).

## Technical details

```text
Native:  @kiwi-health/capacitor-health-connect  (Android)
         @perfood/capacitor-healthkit           (iOS)
Bridge:  src/lib/health.ts       (platform-agnostic API + web no-op)
Server:  src/lib/health.functions.ts  (ingestHealthSnapshot, getHealthOverview)
Schema:  health_snapshots table + workouts.source/source_id + profiles.{resting_hr, sleep_minutes, active_minutes, health_sync_enabled}
UI:      HealthCard component, onboarding step, Home/Profile integrations
```

## Out of scope (follow-up)

- True OS background sync (WorkManager / BGTaskScheduler) — current plan syncs on foreground/app-resume only.
- Writing data back to Health Connect / HealthKit (read-only for now).
