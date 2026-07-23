import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useRouter, isRedirect, createRootRouteWithContext, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { s as supabase } from "./client-BMbiJotd.js";
import { Capacitor } from "@capacitor/core";
import { T as TSS_SERVER_FUNCTION, g as getServerFnById, c as createServerFn } from "./server-BadC42R4.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { Download, X } from "lucide-react";
function useServerFn(serverFn) {
  const router2 = useRouter();
  return React.useCallback(async (...args) => {
    try {
      const res = await serverFn(...args);
      if (isRedirect(res)) throw res;
      return res;
    } catch (err) {
      if (isRedirect(err)) {
        err.options._fromLocation = router2.stores.location.get();
        return router2.navigate(router2.resolveRedirect(err).options);
      }
      throw err;
    }
  }, [router2, serverFn]);
}
const NATIVE_AUTH_REDIRECT = "com.mynutrilens.app://auth-callback";
let nativeListenersReady = false;
let nativeHandlers = {};
let oauthDeepLinkHandled = false;
const isNative = () => typeof window !== "undefined" && Capacitor?.isNativePlatform?.() === true;
const REMOTE_API_BASE = "https://app.mynutrilens.com";
let fetchShimInstalled = false;
function installRemoteFetchShim() {
  if (fetchShimInstalled || typeof window === "undefined") return;
  fetchShimInstalled = true;
  const originalFetch = window.fetch.bind(window);
  const shouldProxy = (path) => path.startsWith("/_serverFn") || path.startsWith("/api/");
  window.fetch = (input, init) => {
    try {
      let urlStr;
      let req = null;
      if (typeof input === "string") urlStr = input;
      else if (input instanceof URL) urlStr = input.toString();
      else {
        req = input;
        urlStr = req.url;
      }
      if (urlStr.startsWith("/") && shouldProxy(urlStr)) {
        urlStr = REMOTE_API_BASE.replace(/\/$/, "") + urlStr;
      } else if (urlStr.startsWith("http")) {
        try {
          const u = new URL(urlStr);
          if ((u.hostname === "localhost" || u.protocol === "capacitor:") && shouldProxy(u.pathname)) {
            urlStr = REMOTE_API_BASE.replace(/\/$/, "") + u.pathname + u.search;
          }
        } catch {
        }
      } else {
        return originalFetch(input, init);
      }
      if (req) {
        const rewritten = new Request(urlStr, req);
        return originalFetch(rewritten, init);
      }
      return originalFetch(urlStr, init);
    } catch {
      return originalFetch(input, init);
    }
  };
}
function getAuthRedirectUrl(path = "/home") {
  if (isNative()) return NATIVE_AUTH_REDIRECT;
  return `${window.location.origin}${path}`;
}
function readAuthParams(url) {
  const parsed = new URL(url);
  const search = new URLSearchParams(parsed.search);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  return {
    code: search.get("code") ?? hash.get("code"),
    accessToken: search.get("access_token") ?? hash.get("access_token"),
    refreshToken: search.get("refresh_token") ?? hash.get("refresh_token")
  };
}
async function handleAuthCallback(url) {
  const { code, accessToken, refreshToken } = readAuthParams(url);
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    if (error) throw error;
    return true;
  }
  return false;
}
function deepLinkPath(url) {
  const parsed = new URL(url);
  if (parsed.protocol === "com.mynutrilens.app:") {
    if (parsed.hostname === "auth-callback") return "/home";
    return `/${parsed.hostname}${parsed.pathname}`.replace(/\/$/, "") || "/home";
  }
  if (parsed.protocol === "capacitor:" || parsed.hostname === "localhost") {
    return parsed.pathname || "/home";
  }
  return null;
}
async function handleIncomingUrl(url) {
  try {
    const isAuth = await handleAuthCallback(url);
    if (isAuth) {
      oauthDeepLinkHandled = true;
      const { Browser } = await import("@capacitor/browser");
      await Browser.close().catch(() => {
      });
      nativeHandlers.onAuthRedirect?.();
      return;
    }
    const path = deepLinkPath(url);
    if (path) nativeHandlers.onOpenPath?.(path);
  } catch (e) {
    console.warn("[native] deep link skipped", e);
  }
}
async function initNative(options = {}) {
  nativeHandlers = options;
  if (!isNative() || nativeListenersReady) return;
  nativeListenersReady = true;
  installRemoteFetchShim();
  try {
    const [{ StatusBar, Style }, { SplashScreen }, { Keyboard }, { App }] = await Promise.all([
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
      import("@capacitor/keyboard"),
      import("@capacitor/app")
    ]);
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {
    });
    await StatusBar.setBackgroundColor({ color: "#0b0b14" }).catch(() => {
    });
    await SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {
    });
    Keyboard.addListener("keyboardWillShow", () => {
      document.body.classList.add("kb-open");
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.body.classList.remove("kb-open");
    });
    App.addListener("appUrlOpen", ({ url }) => {
      void handleIncomingUrl(url);
    });
    const launch = await App.getLaunchUrl().catch(() => null);
    if (launch?.url) void handleIncomingUrl(launch.url);
    App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else App.exitApp();
    });
  } catch (e) {
    console.warn("[native] init skipped", e);
  }
}
async function signInWithNativeOAuth(provider) {
  if (!isNative()) return false;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: NATIVE_AUTH_REDIRECT,
      skipBrowserRedirect: true
    }
  });
  if (error) throw error;
  if (!data.url) throw new Error("No OAuth URL returned");
  const { Browser } = await import("@capacitor/browser");
  oauthDeepLinkHandled = false;
  const handle = await Browser.addListener("browserFinished", async () => {
    await handle.remove();
    if (oauthDeepLinkHandled) {
      oauthDeepLinkHandled = false;
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      nativeHandlers.onAuthRedirect?.();
    }
  });
  await Browser.open({ url: data.url, presentationStyle: "fullscreen" });
  return true;
}
async function pickNativeFoodImage(source) {
  if (!isNative()) return null;
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  const photo = await Camera.getPhoto({
    source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
    resultType: CameraResultType.DataUrl,
    quality: 86,
    correctOrientation: true,
    allowEditing: false
  });
  if (!photo.dataUrl) return null;
  const mime = `image/${photo.format === "png" ? "png" : "jpeg"}`;
  return {
    b64: photo.dataUrl.split(",")[1],
    preview: photo.dataUrl,
    mime
  };
}
async function hapticTap() {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
  }
}
async function registerNativePush() {
  if (!isNative()) return null;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return null;
    return await new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      PushNotifications.addListener("registration", (token) => {
        const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
        finish({ token: token.value, platform });
      });
      PushNotifications.addListener("registrationError", () => finish(null));
      PushNotifications.register().catch(() => finish(null));
      setTimeout(() => finish(null), 8e3);
    });
  } catch (e) {
    console.warn("[native] push registration skipped", e);
    return null;
  }
}
const APP_SW_PATH = "/sw.js";
const MSG_SW_PATH = "/firebase-messaging-sw.js";
function isLovablePreviewHost(hostname) {
  return hostname.startsWith("id-preview--") || hostname.startsWith("preview--") || hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com") || hostname === "lovableproject-dev.com" || hostname.endsWith(".lovableproject-dev.com") || hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev");
}
function isInsideIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
function workerPath(registration) {
  const worker = registration.active ?? registration.waiting ?? registration.installing;
  if (!worker?.scriptURL) return null;
  return new URL(worker.scriptURL).pathname;
}
function isAppShellWorker(registration) {
  return workerPath(registration) === APP_SW_PATH;
}
function canUseAppShellServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  return false;
}
async function unregisterAppShellWorkers() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(registrations.filter(isAppShellWorker).map((registration) => registration.unregister()));
}
async function registerPwaServiceWorker() {
  if (!canUseAppShellServiceWorker()) {
    await unregisterAppShellWorkers();
    return null;
  }
  return navigator.serviceWorker.register(APP_SW_PATH, { scope: "/" });
}
async function getMessagingServiceWorkerRegistration() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  if (isInsideIframe() || isLovablePreviewHost(window.location.hostname)) return null;
  return navigator.serviceWorker.register(MSG_SW_PATH, { scope: "/firebase-cloud-messaging-push-scope" });
}
let cached;
async function loadFirebaseConfig() {
  if (cached !== void 0) return cached;
  try {
    const res = await fetch("/api/public/firebase-config", { cache: "no-store" });
    if (!res.ok) {
      cached = null;
      return null;
    }
    const json = await res.json();
    cached = json?.configured ? json : null;
  } catch {
    cached = null;
  }
  return cached;
}
async function isWebPushSupported() {
  if (typeof window === "undefined") return false;
  if (isNative()) return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("Notification" in window)) return false;
  const { isSupported } = await import("firebase/messaging");
  return isSupported();
}
async function requestWebPushToken() {
  const cfg = await loadFirebaseConfig();
  if (!cfg?.configured || !cfg.config) return null;
  if (!await isWebPushSupported()) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  const swReg = await getMessagingServiceWorkerRegistration();
  if (!swReg) return null;
  const { initializeApp, getApps } = await import("firebase/app");
  const { getMessaging, getToken } = await import("firebase/messaging");
  const app = getApps()[0] ?? initializeApp(cfg.config);
  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    serviceWorkerRegistration: swReg,
    vapidKey: cfg.vapidKey || void 0
  }).catch(() => null);
  return token || null;
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const platformSchema = z.enum(["web", "android", "ios"]);
const savePushToken = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  token: z.string().min(20).max(4096),
  platform: platformSchema
}).parse(data)).handler(createSsrRpc("281f8d7a4a4a30294e6b39063c1a7ccc795c3c154f3ea64df4010cec4c7d0a07"));
const DISMISS_KEY = "mynutrilens.installDismissedAt";
const DISMISS_TTL_MS = 1e3 * 60 * 60 * 24 * 14;
function InstallPwaPrompt() {
  const [evt, setEvt] = useState(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || isNative()) return;
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || // @ts-expect-error iOS Safari standalone hint
    window.navigator.standalone === true;
    if (standalone) return;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;
    const handler = (e) => {
      e.preventDefault();
      setEvt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!visible || !evt) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed left-1/2 -translate-x-1/2 z-50 w-[min(420px,calc(100vw-32px))]", style: { bottom: "calc(96px + env(safe-area-inset-bottom))" }, children: /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl px-4 py-3 flex items-center gap-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]", children: [
    /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Download, { className: "h-4 w-4 text-primary-foreground" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold leading-tight", children: "Install MyNutriLens" }),
      /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground leading-tight mt-0.5", children: "Add to your home screen for an app-like experience." })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: async () => {
          await evt.prompt();
          await evt.userChoice.catch(() => null);
          localStorage.setItem(DISMISS_KEY, String(Date.now()));
          setVisible(false);
          setEvt(null);
        },
        className: "px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-black active:scale-95 transition",
        children: "Install"
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => {
          localStorage.setItem(DISMISS_KEY, String(Date.now()));
          setVisible(false);
          setEvt(null);
        },
        className: "h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/5",
        "aria-label": "Dismiss",
        children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" })
      }
    )
  ] }) });
}
const appCss = "/assets/styles-CbBqbQDa.css";
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center px-4", children: /* @__PURE__ */ jsxs("div", { className: "glass rounded-3xl p-8 max-w-sm text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-6xl font-bold neon-text", children: "404" }),
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground", children: "This screen wandered off." }),
    /* @__PURE__ */ jsx(Link, { to: "/", className: "mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-ring", children: "Back home" })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center px-4", children: /* @__PURE__ */ jsxs("div", { className: "glass rounded-3xl p-8 max-w-sm text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-lg font-semibold", children: "Something glitched" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Tap retry to reload this screen." }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => {
          router2.invalidate();
          reset();
        },
        className: "mt-5 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-ring",
        children: "Retry"
      }
    )
  ] }) });
}
const Route$g = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover" },
      { name: "theme-color", content: "#161624" },
      { title: "MyNutriLens — AI Nutrition & Fitness" },
      { name: "description", content: "Scan meals with AI, track calories and workouts, hit your goals." },
      { property: "og:title", content: "MyNutriLens — AI Nutrition & Fitness" },
      { name: "twitter:title", content: "MyNutriLens — AI Nutrition & Fitness" },
      { property: "og:description", content: "Scan meals with AI, track calories and workouts, hit your goals." },
      { name: "twitter:description", content: "Scan meals with AI, track calories and workouts, hit your goals." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/NvXmWflG9WSzgjbby16jDCyV6Nh1/social-images/social-1780470924083-Gemini_Generated_Image_975xdh975xdh975x_(2).webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/NvXmWflG9WSzgjbby16jDCyV6Nh1/social-images/social-1780470924083-Gemini_Generated_Image_975xdh975xdh975x_(2).webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "MyNutriLens" },
      { name: "application-name", content: "MyNutriLens" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", className: "dark", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$g.useRouteContext();
  const router2 = useRouter();
  const persistPushToken = useServerFn(savePushToken);
  useEffect(() => {
    initNative({
      onAuthRedirect: () => {
        router2.navigate({ to: "/home", replace: true });
        router2.invalidate();
        queryClient.invalidateQueries();
      },
      onOpenPath: (path) => {
        router2.navigate({ to: path, replace: true });
      }
    });
    void registerPwaServiceWorker().catch(() => {
    });
    const onSwMessage = (event) => {
      const data = event.data;
      if (data?.type === "mynutrilens:navigate" && data.url) {
        router2.navigate({ to: data.url, replace: true });
      }
    };
    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", onSwMessage);
    }
    const tryRegisterPush = async (userId) => {
      if (!userId) return;
      try {
        if (isNative()) {
          const native = await registerNativePush();
          if (native?.token) {
            await persistPushToken({ data: { token: native.token, platform: native.platform } });
          }
          return;
        }
        const webToken = await requestWebPushToken();
        if (webToken) {
          await persistPushToken({ data: { token: webToken, platform: "web" } });
        }
      } catch (err) {
        console.warn("[push] registration skipped", err);
      }
    };
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && !data.user.is_anonymous) void tryRegisterPush(data.user.id);
    }).catch(() => {
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router2.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      if (event === "SIGNED_IN" && session?.user && !session.user.is_anonymous) {
        void tryRegisterPush(session.user.id);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (typeof navigator !== "undefined" && navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", onSwMessage);
      }
    };
  }, [router2, queryClient, persistPushToken]);
  return /* @__PURE__ */ jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsx(Outlet, {}),
    /* @__PURE__ */ jsx(InstallPwaPrompt, {}),
    /* @__PURE__ */ jsx(Toaster, { theme: "dark", position: "top-center", richColors: true, closeButton: true })
  ] });
}
const $$splitComponentImporter$d = () => import("./login-Ct5X4ON9.js");
const Route$f = createFileRoute("/login")({
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./_app-CfBdTqQn.js");
const Route$e = createFileRoute("/_app")({
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./index-BQxu3Ksn.js");
const Route$d = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./workout-8yyjriP9.js");
const Route$c = createFileRoute("/_app/workout")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./squads-BQ8SzytR.js");
const Route$b = createFileRoute("/_app/squads")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./scan-B6kPVKj5.js");
const Route$a = createFileRoute("/_app/scan")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./profile-Bc4ngRYO.js");
const Route$9 = createFileRoute("/_app/profile")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./pricing-sIFJHUPm.js");
const Route$8 = createFileRoute("/_app/pricing")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./onboarding-BY271pZ2.js");
const Route$7 = createFileRoute("/_app/onboarding")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component"),
  validateSearch: (s) => ({
    edit: s.edit ? 1 : void 0
  })
});
const $$splitComponentImporter$4 = () => import("./home-44DjdqdB.js");
const Route$6 = createFileRoute("/_app/home")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./diet-DhwM-U88.js");
const Route$5 = createFileRoute("/_app/diet")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./chat-DSk16tfM.js");
const Route$4 = createFileRoute("/_app/chat")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const Route$3 = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return new Response("Misconfigured", { status: 500 });
        const sig = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();
        const expected = await hmacHex(secret, body);
        if (!timingSafeEqual(sig, expected)) {
          return new Response("Invalid signature", { status: 401 });
        }
        let event;
        try {
          event = JSON.parse(body);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }
        const { supabaseAdmin } = await import("./client.server-NyNCqZUk.js");
        const payment = event?.payload?.payment?.entity;
        if (payment?.order_id) {
          await supabaseAdmin.from("payments").update({
            status: event.event === "payment.captured" ? "paid" : event.event === "payment.failed" ? "failed" : payment.status,
            raw_event: event,
            razorpay_payment_id: payment.id
          }).eq("razorpay_order_id", payment.order_id);
        }
        return new Response("ok");
      }
    }
  }
});
const FIREBASE_WEB_CONFIG = {
  apiKey: "AIzaSyAQMIXajqStzW67HFJs6MJZbk0DyOfnE2c",
  authDomain: "mynutrilens-1c20f.firebaseapp.com",
  projectId: "mynutrilens-1c20f",
  storageBucket: "mynutrilens-1c20f.firebasestorage.app",
  messagingSenderId: "453869453373",
  appId: "1:453869453373:web:66596bd9736d466a9bea54",
  measurementId: "G-X5ZE56L8KE"
};
function publicFirebaseConfig() {
  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY || FIREBASE_WEB_CONFIG.apiKey,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_WEB_CONFIG.authDomain,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_WEB_CONFIG.projectId,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || FIREBASE_WEB_CONFIG.storageBucket,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_WEB_CONFIG.messagingSenderId,
    appId: process.env.VITE_FIREBASE_APP_ID || FIREBASE_WEB_CONFIG.appId,
    measurementId: FIREBASE_WEB_CONFIG.measurementId
  };
}
const Route$2 = createFileRoute("/api/public/firebase-config")({
  server: {
    handlers: {
      GET: async () => {
        const config = publicFirebaseConfig();
        const configured = Boolean(config.apiKey && config.projectId && config.messagingSenderId && config.appId);
        return new Response(JSON.stringify({ configured, config: configured ? config : null }), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=300"
          }
        });
      }
    }
  }
});
const $$splitComponentImporter$1 = () => import("./squads._squadId-BXF-WCsn.js");
const Route$1 = createFileRoute("/_app/squads/$squadId")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./squads.join._code-DbPcTH4n.js");
const Route = createFileRoute("/_app/squads/join/$code")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const LoginRoute = Route$f.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$g
});
const AppRoute = Route$e.update({
  id: "/_app",
  getParentRoute: () => Route$g
});
const IndexRoute = Route$d.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$g
});
const AppWorkoutRoute = Route$c.update({
  id: "/workout",
  path: "/workout",
  getParentRoute: () => AppRoute
});
const AppSquadsRoute = Route$b.update({
  id: "/squads",
  path: "/squads",
  getParentRoute: () => AppRoute
});
const AppScanRoute = Route$a.update({
  id: "/scan",
  path: "/scan",
  getParentRoute: () => AppRoute
});
const AppProfileRoute = Route$9.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => AppRoute
});
const AppPricingRoute = Route$8.update({
  id: "/pricing",
  path: "/pricing",
  getParentRoute: () => AppRoute
});
const AppOnboardingRoute = Route$7.update({
  id: "/onboarding",
  path: "/onboarding",
  getParentRoute: () => AppRoute
});
const AppHomeRoute = Route$6.update({
  id: "/home",
  path: "/home",
  getParentRoute: () => AppRoute
});
const AppDietRoute = Route$5.update({
  id: "/diet",
  path: "/diet",
  getParentRoute: () => AppRoute
});
const AppChatRoute = Route$4.update({
  id: "/chat",
  path: "/chat",
  getParentRoute: () => AppRoute
});
const ApiPublicRazorpayWebhookRoute = Route$3.update({
  id: "/api/public/razorpay-webhook",
  path: "/api/public/razorpay-webhook",
  getParentRoute: () => Route$g
});
const ApiPublicFirebaseConfigRoute = Route$2.update({
  id: "/api/public/firebase-config",
  path: "/api/public/firebase-config",
  getParentRoute: () => Route$g
});
const AppSquadsSquadIdRoute = Route$1.update({
  id: "/$squadId",
  path: "/$squadId",
  getParentRoute: () => AppSquadsRoute
});
const AppSquadsJoinCodeRoute = Route.update({
  id: "/join/$code",
  path: "/join/$code",
  getParentRoute: () => AppSquadsRoute
});
const AppSquadsRouteChildren = {
  AppSquadsSquadIdRoute,
  AppSquadsJoinCodeRoute
};
const AppSquadsRouteWithChildren = AppSquadsRoute._addFileChildren(
  AppSquadsRouteChildren
);
const AppRouteChildren = {
  AppChatRoute,
  AppDietRoute,
  AppHomeRoute,
  AppOnboardingRoute,
  AppPricingRoute,
  AppProfileRoute,
  AppScanRoute,
  AppSquadsRoute: AppSquadsRouteWithChildren,
  AppWorkoutRoute
};
const AppRouteWithChildren = AppRoute._addFileChildren(AppRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  AppRoute: AppRouteWithChildren,
  LoginRoute,
  ApiPublicFirebaseConfigRoute,
  ApiPublicRazorpayWebhookRoute
};
const routeTree = Route$g._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$7 as R,
  Route$1 as a,
  Route as b,
  createSsrRpc as c,
  getAuthRedirectUrl as g,
  hapticTap as h,
  pickNativeFoodImage as p,
  router as r,
  signInWithNativeOAuth as s,
  useServerFn as u
};
