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
  server: {
    url: 'https://a8555e4f-4709-484f-bbe8-46b15a0bd553.lovableproject.com?forceHideBadge=true',
    cleartext: true,
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
      launchShowDuration: 600,
      launchAutoHide: false, // we hide manually after React mounts for a smooth crossfade
      backgroundColor: '#0b0b14',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      fadeOutDuration: 400,
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
