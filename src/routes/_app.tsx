import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { TrialBanner } from "@/components/mobile/TrialBanner";
import { NutriBotFab } from "@/components/mobile/NutriBotFab";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

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
