import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { initNative, isNative, registerNativePush } from "@/lib/native";
import { registerPwaServiceWorker } from "@/lib/pwa";
import { requestWebPushToken } from "@/lib/firebase";
import { savePushToken } from "@/lib/push.functions";
import { useServerFn } from "@tanstack/react-start";
import { InstallPwaPrompt } from "@/components/InstallPwaPrompt";
import appCss from "../styles.css?url";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-3xl p-8 max-w-sm text-center">
        <h1 className="text-6xl font-bold neon-text">404</h1>
        <p className="mt-3 text-muted-foreground">This screen wandered off.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-ring">
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-3xl p-8 max-w-sm text-center">
        <h1 className="text-lg font-semibold">Something glitched</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tap retry to reload this screen.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-5 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-ring"
        >Retry</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover" },
      { name: "theme-color", content: "#0b0b14" },
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
      { name: "application-name", content: "MyNutriLens" },
    ],

    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const persistPushToken = useServerFn(savePushToken);

  useEffect(() => {
    // Initialize Capacitor native plugins (no-op on web)
    initNative({
      onAuthRedirect: () => {
        router.navigate({ to: "/home", replace: true });
        router.invalidate();
        queryClient.invalidateQueries();
      },
      onOpenPath: path => {
        router.navigate({ to: path as never, replace: true });
      },
    });

    // Register the PWA service worker (guards against Lovable preview & dev).
    void registerPwaServiceWorker().catch(() => {});

    // Listen for in-app navigation from the messaging service worker.
    const onSwMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string } | undefined;
      if (data?.type === "mynutrilens:navigate" && data.url) {
        router.navigate({ to: data.url as never, replace: true });
      }
    };
    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", onSwMessage);
    }

    // Note: we intentionally do NOT auto sign-in anonymously here — the
    // welcome page (/) and /login own the unauthenticated experience, and
    // the /_app shell gates everything behind a real user session.

    // Register push tokens (native + web) once we have a real user.
    const tryRegisterPush = async (userId: string | undefined) => {
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
    }).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
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
  }, [router, queryClient, persistPushToken]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <InstallPwaPrompt />
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}


