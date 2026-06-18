import { createFileRoute } from "@tanstack/react-router";

// Firebase Web config is publishable (safe in client/source). Stored here as the
// single source of truth so both the web app and the messaging service worker
// load identical values. Secret material (FCM server key / VAPID private key)
// lives only in Supabase secrets and never ships to the client.
const FIREBASE_WEB_CONFIG = {
  apiKey: "AIzaSyAQMIXajqStzW67HFJs6MJZbk0DyOfnE2c",
  authDomain: "mynutrilens-1c20f.firebaseapp.com",
  projectId: "mynutrilens-1c20f",
  storageBucket: "mynutrilens-1c20f.firebasestorage.app",
  messagingSenderId: "453869453373",
  appId: "1:453869453373:web:66596bd9736d466a9bea54",
  measurementId: "G-X5ZE56L8KE",
};

function publicFirebaseConfig() {
  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY || FIREBASE_WEB_CONFIG.apiKey,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_WEB_CONFIG.authDomain,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_WEB_CONFIG.projectId,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || FIREBASE_WEB_CONFIG.storageBucket,
    messagingSenderId:
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_WEB_CONFIG.messagingSenderId,
    appId: process.env.VITE_FIREBASE_APP_ID || FIREBASE_WEB_CONFIG.appId,
    measurementId: FIREBASE_WEB_CONFIG.measurementId,
  };
}

export const Route = createFileRoute("/api/public/firebase-config")({
  server: {
    handlers: {
      GET: async () => {
        const config = publicFirebaseConfig();
        const configured = Boolean(config.apiKey && config.projectId && config.messagingSenderId && config.appId);
        return new Response(JSON.stringify({ configured, config: configured ? config : null }), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});