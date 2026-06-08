import type { CapacitorConfig } from '@capacitor/cli';

// MyNutriLens — Capacitor native config
// To run locally:
//   1. git pull this project into your machine
//   2. bun install
//   3. bunx cap add ios   (and/or)  bunx cap add android
//   4. bun run build && bunx cap sync
//   5. bunx cap open ios   /   bunx cap open android
//
// The `server.url` below points to the Lovable sandbox preview so the native
// shell hot-loads the latest web build during development. REMOVE the entire
// `server` block before producing a Play Store / App Store release build so
// the app ships with bundled assets from `dist/`.
const config: CapacitorConfig = {
  appId: 'com.mynutrilens.app',
  appName: 'MyNutriLens',
  webDir: 'dist',
  bundledWebRuntime: false,
  // NOTE: No `server.url` here on purpose. The native shell loads the
  // bundled `dist/` web assets directly so the app runs fully in-app
  // (no external browser, no WebView redirect to lovable.app).
  // For hot-reload during dev only, you can temporarily add:
  //   server: { url: 'https://<your-preview>.lovable.app', cleartext: true }
  // but REMOVE it before building a release APK/AAB/IPA.
  server: {
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
