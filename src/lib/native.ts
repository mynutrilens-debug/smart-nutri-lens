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

export const isNative = () =>
  typeof window !== 'undefined' && Capacitor?.isNativePlatform?.() === true;

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
  await Browser.open({ url: data.url, presentationStyle: 'fullscreen' });
  return true;
}

export async function hapticTap() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}
