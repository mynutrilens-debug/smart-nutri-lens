import { createFileRoute } from "@tanstack/react-router";

function publicFirebaseConfig() {
  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY ?? "",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.VITE_FIREBASE_APP_ID ?? "",
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