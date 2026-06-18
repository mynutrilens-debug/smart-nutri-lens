// Lazy Firebase Web Push client. All calls are no-ops unless the server
// returns a configured Firebase project from /api/public/firebase-config.
import { isNative } from "@/lib/native";
import { getMessagingServiceWorkerRegistration } from "@/lib/pwa";

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

type ConfigResponse = { configured: boolean; config: FirebaseConfig | null; vapidKey?: string | null };

let cached: ConfigResponse | null | undefined;

async function loadFirebaseConfig(): Promise<ConfigResponse | null> {
  if (cached !== undefined) return cached;
  try {
    const res = await fetch("/api/public/firebase-config", { cache: "no-store" });
    if (!res.ok) { cached = null; return null; }
    const json = (await res.json()) as ConfigResponse;
    cached = json?.configured ? json : null;
  } catch {
    cached = null;
  }
  return cached;
}

export async function isWebPushSupported() {
  if (typeof window === "undefined") return false;
  if (isNative()) return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("Notification" in window)) return false;
  const { isSupported } = await import("firebase/messaging");
  return isSupported();
}

export async function isWebPushConfigured() {
  const cfg = await loadFirebaseConfig();
  return Boolean(cfg?.configured);
}

export async function requestWebPushToken(): Promise<string | null> {
  const cfg = await loadFirebaseConfig();
  if (!cfg?.configured || !cfg.config) return null;
  if (!(await isWebPushSupported())) return null;

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
    vapidKey: cfg.vapidKey || undefined,
  }).catch(() => null);
  return token || null;
}
