import type { CapacitorConfig } from '@capacitor/cli';

// MyNutriLens — Capacitor native config
//
// The native app now ships a bundled SPA (produced by `bun run build:mobile`)
// inside the binary — no external URL, no browser redirect. The website
// (SSR site at app.mynutrilens.com) stays separate for SEO/marketing.
//
// Workflow:
//   1. bun install
//   2. bunx cap add ios   (and/or)  bunx cap add android
//   3. bun run build:mobile && bunx cap sync
//   4. bunx cap open ios   /   bunx cap open android
const config: CapacitorConfig = {
  appId: 'com.mynutrilens.app',
  appName: 'MyNutriLens',
  // Static SPA output from vite.mobile.config.ts — bundled into the APK/IPA.
  webDir: 'dist-mobile',
  bundledWebRuntime: false,
  // No `server.url` — the shell loads dist-mobile/index.html from local disk.
  // (Add one temporarily during dev if you want live reload against a preview.)
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0b0b14',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0b0b14',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
