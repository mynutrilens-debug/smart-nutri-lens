## Goal

Stop the Android/iOS shell from loading `https://app.mynutrilens.com` in a WebView. Keep the SSR site live for SEO/marketing, and ship a separate client-only SPA bundle inside the Capacitor binary.

## Approach

Two build outputs from the same source tree:

- `bun run build` → SSR site (Cloudflare Worker, unchanged) — served at `app.mynutrilens.com`.
- `bun run build:mobile` → static SPA in `dist-mobile/` — bundled into the APK/IPA.

Capacitor loads `dist-mobile/index.html` locally. Server functions (`createServerFn`) keep running on the SSR host; the SPA calls them cross-origin over HTTPS.

```text
[SSR site] app.mynutrilens.com  ──── server fns / API ────┐
                                                          │
[Capacitor APK/IPA] file://…/dist-mobile/index.html ──────┘
```

## Steps

1. **New SPA entry** (`src/entry.mobile.tsx`, `index.mobile.html`)
   - Creates the same TanStack Router via `getRouter()` and mounts with `<RouterProvider>` on the client only — no SSR shell, no `Scripts`/`HeadContent` HTML output.
   - Wraps in `QueryClientProvider`, `Toaster`, calls `initNative()`.

2. **Server-fn base URL for mobile**
   - `createServerFn` uses relative paths; from `capacitor://localhost` they'd 404.
   - Add `VITE_SERVER_FN_BASE_URL=https://app.mynutrilens.com` in the mobile build and configure the TanStack Start client to prefix server-fn fetches with it (via `import.meta.env` read in a small fetch shim in `src/start.ts`).

3. **Mobile Vite config** (`vite.mobile.config.ts`)
   - Plain Vite + React + TanStack Router plugin (no `tanstackStart`, no Nitro, no PWA plugin).
   - `build.outDir = 'dist-mobile'`, `build.rollupOptions.input = 'index.mobile.html'`.
   - Same `@` alias, Tailwind plugin, tsconfig-paths.

4. **package.json**
   - Add `"build:mobile": "vite build --config vite.mobile.config.ts"`.

5. **capacitor.config.ts**
   - `webDir: 'dist-mobile'`.
   - Remove the `server.url` block entirely so the shell loads bundled assets.

6. **Root component adjustments**
   - `src/routes/__root.tsx` currently defines `shellComponent` (html/head/body). SPA mode ignores it — fine. The `head()` meta is applied by TanStack Router's head manager on the client.
   - Skip `<InstallPwaPrompt />` and PWA SW registration when running under Capacitor (already guarded via `isNative()` in most spots; add the guard around `registerPwaServiceWorker()`).

7. **Route safety pass**
   - Routes that rely on `useServerFn` already work SPA-side. Any route using a loader that hits a protected server fn already runs only under `_app` (authenticated) — fine.

8. **Docs**
   - Update `MOBILE_SETUP.md` with the new flow: `bun run build:mobile && bunx cap sync && bunx cap open android|ios`.

## Result

- Website: unchanged, SSR + PWA.
- APK/IPA: opens instantly from local assets, no external redirect, hits the SSR-hosted server functions over HTTPS for data.

## Out of scope

- Migrating server functions to a dedicated REST API.
- Offline-first mobile caching beyond what TanStack Query already provides.

Confirm and I'll implement.