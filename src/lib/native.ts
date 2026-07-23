// Native bridge helpers — safe to import from anywhere. All calls are no-ops
// in the browser and only do real work when running inside Capacitor.
import { Capacitor } from '@capacitor/core';
import type { Provider } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const NATIVE_AUTH_REDIRECT = 'com.mynutrilens.app://auth-callback';

type NativeInitOptions = {
  onAuthRedirect?: () => void;
  onOpenPath?: (path: string) => void;
};

let nativeListenersReady = false;
let nativeHandlers: NativeInitOptions = {};
// Set to true when a deep-link auth callback is handled so the browserFinished
// fallback knows not to double-navigate.
let oauthDeepLinkHandled = false;

export const isNative = () =>
  typeof window !== 'undefined' && Capacitor?.isNativePlatform?.() === true;

// Base URL used by the bundled mobile SPA to reach the SSR host for server
// functions (`/_serverFn/*`) and API routes (`/api/*`). The Capacitor shell
// serves the app from `capacitor://localhost` / `https://localhost`, so
// relative-path fetches would 404 without this rewrite.
const REMOTE_API_BASE =
  (import.meta.env.VITE_SERVER_FN_BASE_URL as string | undefined) ||
  'https://app.mynutrilens.com';

let fetchShimInstalled = false;
function installRemoteFetchShim() {
  if (fetchShimInstalled || typeof window === 'undefined') return;
  fetchShimInstalled = true;
  const originalFetch = window.fetch.bind(window);
  const shouldProxy = (path: string) =>
    path.startsWith('/_serverFn') || path.startsWith('/api/');
  window.fetch = (input, init) => {
    try {
      let urlStr: string;
      let req: Request | null = null;
      if (typeof input === 'string') urlStr = input;
      else if (input instanceof URL) urlStr = input.toString();
      else {
        req = input as Request;
        urlStr = req.url;
      }
      if (urlStr.startsWith('/') && shouldProxy(urlStr)) {
        urlStr = REMOTE_API_BASE.replace(/\/$/, '') + urlStr;
      } else if (urlStr.startsWith('http')) {
        try {
          const u = new URL(urlStr);
          // Requests aimed at the Capacitor webview host must be redirected
          // to the SSR host (server fns / api routes are not bundled locally).
          if (
            (u.hostname === 'localhost' || u.protocol === 'capacitor:') &&
            shouldProxy(u.pathname)
          ) {
            urlStr = REMOTE_API_BASE.replace(/\/$/, '') + u.pathname + u.search;
          }
        } catch {}
      } else {
        return originalFetch(input as RequestInfo, init);
      }
      if (req) {
        const rewritten = new Request(urlStr, req);
        return originalFetch(rewritten, init);
      }
      return originalFetch(urlStr, init);
    } catch {
      return originalFetch(input as RequestInfo, init);
    }
  };
}

export function getAuthRedirectUrl(path = '/home') {
  if (isNative()) return NATIVE_AUTH_REDIRECT;
  return `${window.location.origin}${path}`;
}

function readAuthParams(url: string) {
  const parsed = new URL(url);
  const search = new URLSearchParams(parsed.search);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  return {
    code: search.get('code') ?? hash.get('code'),
    accessToken: search.get('access_token') ?? hash.get('access_token'),
    refreshToken: search.get('refresh_token') ?? hash.get('refresh_token'),
  };
}

async function handleAuthCallback(url: string) {
  const { code, accessToken, refreshToken } = readAuthParams(url);
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return true;
  }
  return false;
}

function deepLinkPath(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol === 'com.mynutrilens.app:') {
    if (parsed.hostname === 'auth-callback') return '/home';
    return `/${parsed.hostname}${parsed.pathname}`.replace(/\/$/, '') || '/home';
  }
  if (parsed.protocol === 'capacitor:' || parsed.hostname === 'localhost') {
    return parsed.pathname || '/home';
  }
  return null;
}

async function handleIncomingUrl(url: string) {
  try {
    const isAuth = await handleAuthCallback(url);
    if (isAuth) {
      oauthDeepLinkHandled = true;
      const { Browser } = await import('@capacitor/browser');
      await Browser.close().catch(() => {});
      nativeHandlers.onAuthRedirect?.();
      return;
    }
    const path = deepLinkPath(url);
    if (path) nativeHandlers.onOpenPath?.(path);
  } catch (e) {
    console.warn('[native] deep link skipped', e);
  }
}

export async function initNative(options: NativeInitOptions = {}) {
  nativeHandlers = options;
  if (!isNative() || nativeListenersReady) return;
  nativeListenersReady = true;
  try {
    const [{ StatusBar, Style }, { SplashScreen }, { Keyboard }, { App }] = await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
      import('@capacitor/keyboard'),
      import('@capacitor/app'),
    ]);

    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    await StatusBar.setBackgroundColor({ color: '#0b0b14' }).catch(() => {});
    await SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});

    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('kb-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('kb-open');
    });

    App.addListener('appUrlOpen', ({ url }) => {
      void handleIncomingUrl(url);
    });
    const launch = await App.getLaunchUrl().catch(() => null);
    if (launch?.url) void handleIncomingUrl(launch.url);

    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else App.exitApp();
    });
  } catch (e) {
    console.warn('[native] init skipped', e);
  }
}

export async function signInWithNativeOAuth(provider: Provider) {
  if (!isNative()) return false;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: NATIVE_AUTH_REDIRECT,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned');
  const { Browser } = await import('@capacitor/browser');

  // Fallback: if the custom-scheme deep link never fires appUrlOpen (e.g. Chrome
  // Custom Tab doesn't dispatch the intent on some Android versions), we catch
  // the session via the browserFinished event instead.
  oauthDeepLinkHandled = false;
  const handle = await Browser.addListener('browserFinished', async () => {
    await handle.remove();
    if (oauthDeepLinkHandled) {
      // Already handled by appUrlOpen — nothing to do.
      oauthDeepLinkHandled = false;
      return;
    }
    // Check whether Supabase already established a session (e.g. the redirect
    // went to the web app URL and Supabase processed it there).
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      nativeHandlers.onAuthRedirect?.();
    }
  });

  await Browser.open({ url: data.url, presentationStyle: 'fullscreen' });
  return true;
}

export async function pickNativeFoodImage(source: 'camera' | 'photos') {
  if (!isNative()) return null;
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  const photo = await Camera.getPhoto({
    source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
    resultType: CameraResultType.DataUrl,
    quality: 86,
    correctOrientation: true,
    allowEditing: false,
  });
  if (!photo.dataUrl) return null;
  const mime = `image/${photo.format === 'png' ? 'png' : 'jpeg'}`;
  return {
    b64: photo.dataUrl.split(',')[1],
    preview: photo.dataUrl,
    mime,
  };
}

export async function hapticTap() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}

/**
 * Register the device for Capacitor native push (FCM on Android, APNs on iOS).
 * Returns the device token once received, or null if push isn't available.
 */
export async function registerNativePush(): Promise<{ token: string; platform: 'android' | 'ios' } | null> {
  if (!isNative()) return null;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return null;
    return await new Promise(resolve => {
      let settled = false;
      const finish = (value: { token: string; platform: 'android' | 'ios' } | null) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      PushNotifications.addListener('registration', token => {
        const platform = (Capacitor.getPlatform() === 'ios' ? 'ios' : 'android') as 'android' | 'ios';
        finish({ token: token.value, platform });
      });
      PushNotifications.addListener('registrationError', () => finish(null));
      PushNotifications.register().catch(() => finish(null));
      setTimeout(() => finish(null), 8000);
    });
  } catch (e) {
    console.warn('[native] push registration skipped', e);
    return null;
  }
}

