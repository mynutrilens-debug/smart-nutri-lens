// Native bridge helpers — safe to import from anywhere. All calls are no-ops
// in the browser and only do real work when running inside Capacitor.
import { Capacitor } from '@capacitor/core';

export const isNative = () =>
  typeof window !== 'undefined' && Capacitor?.isNativePlatform?.() === true;

export async function initNative() {
  if (!isNative()) return;
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

    // Keep inputs visible above the keyboard
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('kb-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('kb-open');
    });

    // Hardware back button → browser back (TanStack Router handles it)
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else App.exitApp();
    });
  } catch (e) {
    // Plugin missing in this build — ignore silently
    console.warn('[native] init skipped', e);
  }
}

export async function hapticTap() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}
