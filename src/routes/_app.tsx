import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/mobile/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    // Auth disabled for now — sign the visitor in anonymously so RLS-protected
    // tables still work without showing a login screen.
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      await supabase.auth.signInAnonymously().catch(() => {});
    }
  },
  component: AppShell,
});

function AppShell() {
  return (
    <div className="app-shell">
      <Outlet />
      <BottomNav />
    </div>
  );
}
