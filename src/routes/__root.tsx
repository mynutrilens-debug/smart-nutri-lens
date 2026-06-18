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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
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
    ],
    links: [{ rel: "stylesheet", href: appCss }],
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
    // Ensure every visitor has a Supabase session (anonymous if not signed in)
    // so RLS-protected server functions can authenticate the request.
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) console.error("Anonymous sign-in failed", error);
      }
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}

