# MyNutriLens — Native Mobile (Capacitor) Setup

This project is now Capacitor-ready for **iOS** (App Store) and **Android** (Play Store) with package ID `com.mynutrilens.app`.

> Lovable's cloud sandbox cannot run Xcode or Android Studio. You'll do the native build on your own Mac (iOS) or any machine with Android Studio (Android). The web app keeps working exactly as before.

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

## Hot reload during development

`capacitor.config.ts` points `server.url` at the Lovable preview URL, so the installed app live-loads your latest Lovable changes — no rebuild needed while iterating.

## Producing release builds

Before shipping to the stores, **remove the `server` block** in `capacitor.config.ts` so the app bundles `dist/` instead of loading from the web:

```ts
// delete this block for release:
server: { url: '...', cleartext: true },
```

Then:
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
- `src/routes/__root.tsx` — calls `initNative()` on mount
- `src/styles.css` — safe-area insets for notch/home-indicator, 16px input font (prevents iOS zoom), keyboard-open body class
- `src/components/mobile/BottomNav.tsx` — sits above iOS home indicator
- Camera scanning already uses `<input type="file" capture="environment">` which works natively on both platforms
