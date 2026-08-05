import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BottomNav } from "@/components/mobile/BottomNav";
import { TrialBanner } from "@/components/mobile/TrialBanner";
import { NutriBotFab } from "@/components/mobile/NutriBotFab";
import { supabase } from "@/integrations/supabase/client";
import { isNative } from "@/lib/native";
import { getNotificationSettings } from "@/lib/notifications.functions";
import { initLocalReminderLifecycle } from "@/lib/local-notifications";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const fetchSettings = useServerFn(getNotificationSettings);

  // Re-arm on-device recurring reminders on every app start/resume so they
  // survive reboots, force-quits and timezone changes without any backend.
  useEffect(() => {
    if (!ready || !isNative()) return;
    void initLocalReminderLifecycle(async () => {
      try {
        const res = (await fetchSettings()) as any;
        return res?.prefs ?? null;
      } catch {
        return null;
      }
    });
  }, [ready, fetchSettings]);


  useEffect(() => {
    let active = true;
    const check = async () => {
      // Prefer cached session (instant, offline-safe) so returning users
      // aren't bounced to the welcome screen while the network call spins up.
      const { data: sessionData } = await supabase.auth.getSession();
      let user = sessionData.session?.user ?? null;
      if (!user) {
        const { data } = await supabase.auth.getUser();
        user = data.user ?? null;
      }
      if (!active) return;
      if (!user || user.is_anonymous) {
        navigate({ to: "/", replace: true });
        return;
      }
      setReady(true);
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (session?.user?.is_anonymous ?? false)) {
        navigate({ to: "/", replace: true });
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <TrialBanner />
      <Outlet />
      <NutriBotFab />
      <BottomNav />
    </div>
  );
}
