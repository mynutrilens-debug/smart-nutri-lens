importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

let messagingReady = fetch("/api/public/firebase-config")
  .then(response => (response.ok ? response.json() : null))
  .then(payload => {
    if (!payload?.configured || !payload.config || !self.firebase?.apps) return null;
    if (!firebase.apps.length) firebase.initializeApp(payload.config);
    return firebase.messaging();
  })
  .then(messaging => {
    if (!messaging) return null;
    messaging.onBackgroundMessage(payload => {
      const notification = payload.notification || {};
      const data = payload.data || {};
      self.registration.showNotification(notification.title || "MyNutriLens", {
        body: notification.body || "Your nutrition update is ready.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: { url: data.url || "/home" },
      });
    });
    return messaging;
  })
  .catch(() => null);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/home";
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = clients.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.focus();
      existing.postMessage({ type: "mynutrilens:navigate", url: targetUrl });
      return;
    }
    await self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener("push", event => {
  event.waitUntil(messagingReady);
});