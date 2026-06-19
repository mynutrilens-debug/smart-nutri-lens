import type { CapacitorConfig } from '@capacitor/cli';

// MyNutriLens — Capacitor native config
// To run locally:
//   1. git pull this project into your machine
//   2. bun install
//   3. bunx cap add ios   (and/or)  bunx cap add android
//   4. bun run build && bunx cap sync
//   5. bunx cap open ios   /   bunx cap open android
//
// Native release builds load bundled assets from `dist/` directly.
// Do not add `server.url` for Play Store / App Store builds.
const config: CapacitorConfig = {
  appId: 'com.mynutrilens.app',
  appName: 'MyNutriLens',
  webDir: 'dist',
  bundledWebRuntime: false,
  // Native shell loads the published web app directly. This avoids needing
  // a static `dist/index.html` (TanStack Start is SSR) and keeps the app
  // always up-to-date without rebuilding the native binary for web changes.
  server: {
    url: 'https://app.mynutrilens.com',
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
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
