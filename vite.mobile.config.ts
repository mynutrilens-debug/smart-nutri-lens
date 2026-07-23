// Capacitor SPA build — bundled into the Android/iOS binary.
// Produces a static client-only build in `dist-mobile/` that Capacitor loads
// from disk. Server functions still call the SSR host over HTTPS (see the
// fetch shim in src/lib/native.ts).
//
// Build: `bun run build:mobile`
// Then:  `bunx cap sync` and open in Android Studio / Xcode.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // No Nitro — pure static SPA output, no SSR server bundle.
  nitro: false,
  tanstackStart: {
    // Enable SPA mode: TanStack Start prerenders a static shell that hydrates
    // client-side, without any server render at runtime.
    spa: {
      enabled: true,
      prerender: {
        enabled: true,
        outputPath: "/",
        crawlLinks: false,
        retryCount: 0,
      },
    },
  },
  vite: {
    define: {
      // Marks the bundle as running inside Capacitor so runtime code can
      // rewrite server-fn fetches to the SSR host.
      "import.meta.env.VITE_MOBILE_BUILD": JSON.stringify("1"),
      "import.meta.env.VITE_SERVER_FN_BASE_URL": JSON.stringify(
        process.env.VITE_SERVER_FN_BASE_URL || "https://app.mynutrilens.com",
      ),
    },
    build: {
      outDir: "dist-mobile",
      emptyOutDir: true,
      sourcemap: false,
    },
  },
});
