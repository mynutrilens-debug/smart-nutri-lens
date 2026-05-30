import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/mobile/BottomNav";
import { supabase } from "@/integrations/supabase/client";

const DEMO_KEY = "mynutrilens.demo.creds.v1";

async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;

  // Try anonymous first (works if enabled in Supabase).
  const anon = await supabase.auth.signInAnonymously().catch(() => null);
  if (anon?.data.session) return;

  // Fallback: device-bound demo email/password account persisted in localStorage.
  if (typeof window === "undefined") return;
  let creds = (() => {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY) || "null") as { email: string; password: string } | null; }
    catch { return null; }
  })();

  if (!creds) {
    const id = crypto.randomUUID();
    creds = { email: `demo+${id}@mynutrilens.app`, password: `Demo!${id}` };
    localStorage.setItem(DEMO_KEY, JSON.stringify(creds));
    await supabase.auth.signUp({ email: creds.email, password: creds.password }).catch(() => {});
  }

  const signIn = await supabase.auth.signInWithPassword(creds);
  if (signIn.error) {
    // Account didn't exist — sign up then sign in.
    await supabase.auth.signUp(creds).catch(() => {});
    await supabase.auth.signInWithPassword(creds).catch(() => {});
  }
}

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    await ensureSession();
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
