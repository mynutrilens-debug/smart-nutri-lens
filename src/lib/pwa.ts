const APP_SW_PATH = "/sw.js";
const MSG_SW_PATH = "/firebase-messaging-sw.js";

function isLovablePreviewHost(hostname: string) {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

function isInsideIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function workerPath(registration: ServiceWorkerRegistration) {
  const worker = registration.active ?? registration.waiting ?? registration.installing;
  if (!worker?.scriptURL) return null;
  return new URL(worker.scriptURL).pathname;
}

function isAppShellWorker(registration: ServiceWorkerRegistration) {
  return workerPath(registration) === APP_SW_PATH;
}

function canUseAppShellServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  if (!import.meta.env.PROD) return false;
  if (isInsideIframe()) return false;
  if (isLovablePreviewHost(window.location.hostname)) return false;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return false;
  return true;
}

async function unregisterAppShellWorkers() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(registrations.filter(isAppShellWorker).map(registration => registration.unregister()));
}

export async function registerPwaServiceWorker() {
  if (!canUseAppShellServiceWorker()) {
    await unregisterAppShellWorkers();
    return null;
  }

  return navigator.serviceWorker.register(APP_SW_PATH, { scope: "/" });
}

export async function getMessagingServiceWorkerRegistration() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  if (isInsideIframe() || isLovablePreviewHost(window.location.hostname)) return null;

  return navigator.serviceWorker.register(MSG_SW_PATH, { scope: "/firebase-cloud-messaging-push-scope" });
}