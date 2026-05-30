import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      navigate({ to: data.user ? "/home" : "/login", replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  return (
    <div className="app-shell flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-accent glow-ring animate-float flex items-center justify-center text-3xl">🥗</div>
        <h1 className="mt-6 text-3xl font-bold neon-text tracking-tight">MyNutriLens</h1>
        <p className="mt-2 text-sm text-muted-foreground">AI nutrition, decoded.</p>
      </div>
    </div>
  );
}
