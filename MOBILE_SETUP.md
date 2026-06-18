# MyNutriLens — PWA + Native Mobile (Capacitor) Setup

The web app is now an installable Progressive Web App **and** ready to be packaged as a native iOS/Android binary via Capacitor (`com.mynutrilens.app`). The same `dist/` bundle powers both — no separate codebases.

## What's wired (PWA)

- **Installable** — `public/manifest.webmanifest`, maskable icons (`/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`), Apple `mobile-web-app-capable` meta, dark theme color, app shortcuts to **Scan** and **Today**.
- **Offline-ready app shell** — `vite-plugin-pwa` generates `/sw.js` (Workbox). Navigations use `NetworkFirst`, assets `CacheFirst`. Registration is guarded so the worker **never** runs in Lovable preview, iframes, dev, or with `?sw=off`.
- **Install prompt** — `<InstallPwaPrompt />` listens for `beforeinstallprompt` and shows an in-app "Install MyNutriLens" CTA (auto-dismissed for 14 days).
- **Push notifications (Web)** — Firebase Cloud Messaging via `public/firebase-messaging-sw.js`. On sign-in we request permission and persist the FCM token in `push_subscriptions` (RLS-scoped per user). Set `VITE_FIREBASE_*` build secrets to activate; without them push silently no-ops.
- **Push notifications (Native)** — `@capacitor/push-notifications` requests permission and stores the device token under the same `push_subscriptions` row (platform `android` / `ios`).
- **Server config endpoint** — `GET /api/public/firebase-config` returns the public Firebase config to the messaging worker.

## Required env vars for Web Push (optional)

Add as Lovable build secrets (Workspace Settings → Build Secrets), then publish:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Without these, web push is disabled cleanly. Native push works independently via `google-services.json` (Android) and APNs (iOS).

## Capacitor — native iOS + Android



## One-time local setup

1. Export the project from Lovable to GitHub (button → top right), then clone it locally.
2. `bun install`
3. Add the platforms you want:
   ```
   bunx cap add ios       # macOS only, requires Xcode
   bunx cap add android   # requires Android Studio
   ```
4. Build the web bundle and copy into native shells:
   ```
   bun run build
   bunx cap sync
   ```
5. Open in the native IDE:
   ```
   bunx cap open ios
   bunx cap open android
   ```

## Fully in-app (no browser redirect)

`capacitor.config.ts` no longer has a `server.url`, so the installed app
loads the bundled `dist/` assets and runs **entirely inside the native
shell** — no WebView redirect to lovable.app, no external browser.

Every time you change the web code, rebuild and re-sync:

```
bun run build && bunx cap sync
```

Then run in the simulator/device from Xcode or Android Studio.

### Optional: hot reload while developing

If you want live reload against the Lovable preview during development,
temporarily add this back into `capacitor.config.ts`:

```ts
server: {
  url: 'https://<your-preview>.lovable.app',
  cleartext: true,
  androidScheme: 'https',
  iosScheme: 'capacitor',
},
```

**Remove the `url`** before building any release artifact, or the store
build will load remote HTML instead of behaving like a native app.

## Producing release builds

```
bun run build && bunx cap sync
```

- **Android AAB/APK** → Android Studio → Build → Generate Signed Bundle / APK
- **iOS IPA** → Xcode → Product → Archive → Distribute App

## Supabase auth on native

Capacitor serves the app from `capacitor://localhost` (iOS) / `https://localhost` (Android). Add these to your Supabase Auth → URL Configuration → **Redirect URLs**:

```
capacitor://localhost
https://localhost
com.mynutrilens.app://
```

(Keep your existing web URLs too.)

## App icon & splash

Drop your assets at `resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732), then:
```
bunx @capacitor/assets generate
```

## What was wired up

- `capacitor.config.ts` — appId `com.mynutrilens.app`, name **MyNutriLens**, dark splash/status bar, keyboard resize, iOS safe-area handling
- `src/lib/native.ts` — initializes StatusBar, hides SplashScreen, listens to Keyboard + hardware Back button (no-op on web)
- Native Google auth now uses the Capacitor Browser plus `com.mynutrilens.app://auth-callback` deep links, then returns into `/home` inside the app
- Android/iOS native projects are generated under `android/` and `ios/`, with camera permissions and URL schemes registered
- `src/routes/__root.tsx` — calls `initNative()` on mount
- `src/styles.css` — safe-area insets for notch/home-indicator, 16px input font (prevents iOS zoom), keyboard-open body class
- `src/components/mobile/BottomNav.tsx` — sits above iOS home indicator
- Camera scanning uses Capacitor Camera on native builds and keeps the existing file-input fallback for web
