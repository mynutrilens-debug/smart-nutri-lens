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
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user || data.user.is_anonymous) {
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
