import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Camera, Dumbbell, Bot, ArrowRight, Zap } from "lucide-react";
import welcomeHero from "@/assets/welcome-hero.jpg";

export const Route = createFileRoute("/")({ component: Welcome });

function Welcome() {
  const navigate = useNavigate();

  // If a real user is already signed in, jump straight into the app.
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user && !data.user.is_anonymous) {
        navigate({ to: "/home", replace: true });
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [navigate]);

  return (
    <div className="app-shell relative overflow-hidden">
      <div className="relative h-[62vh] min-h-[480px] w-full overflow-hidden">
        <img
          src={welcomeHero}
          alt="MyNutriLens — AI nutrition and fitness"
          className="absolute inset-0 h-full w-full object-cover scale-110 animate-hero-pan"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.10_0.03_245/0.30)] via-[oklch(0.10_0.03_245/0.55)] to-[oklch(0.08_0.03_245)]" />
        <div className="pointer-events-none absolute -top-24 -left-20 h-80 w-80 rounded-full bg-[oklch(0.72_0.22_240/0.55)] blur-3xl" />
        <div className="pointer-events-none absolute -top-10 -right-16 h-72 w-72 rounded-full bg-[oklch(0.82_0.16_215/0.45)] blur-3xl" />

        <div className="absolute inset-x-0 top-10 px-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[oklch(0.72_0.22_240/0.18)] border border-[oklch(0.72_0.22_240/0.5)] backdrop-blur-md text-[10px] uppercase tracking-[0.2em] text-[oklch(0.92_0.08_215)]">
            <Zap className="h-3 w-3" /> AI Powered Nutrition
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-8 px-6 text-center animate-slide-up">
          <h1 className="text-[40px] leading-[1.05] font-bold tracking-tight">
            Meet your <span className="neon-text">AI Coach</span>
          </h1>
          <p className="mt-3 text-sm text-foreground/75 max-w-[320px] mx-auto">
            Scan meals, plan diets and train smarter — all inside one electric app.
          </p>
        </div>
      </div>

      <div className="relative px-6 pb-10 -mt-4 space-y-4">
        <Feature icon={<Camera className="h-4 w-4 text-[oklch(0.82_0.16_215)]" />} title="Scan any meal" text="Instant calories, protein and macros from a single photo." />
        <Feature icon={<Bot className="h-4 w-4 text-[oklch(0.62_0.26_260)]" />} title="Personal AI diet plan" text="Daily meals tuned to your body, goals and cuisine." />
        <Feature icon={<Dumbbell className="h-4 w-4 text-[oklch(0.72_0.22_240)]" />} title="Smart workouts" text="Plans that adapt as you train and progress." />

        <div className="pt-4 space-y-3">
          <Link
            to="/login"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[oklch(0.82_0.16_215)] via-[oklch(0.72_0.22_240)] to-[oklch(0.62_0.26_260)] text-white font-semibold shadow-[0_14px_40px_-12px_oklch(0.72_0.22_240/0.95)] flex items-center justify-center gap-2 active:scale-[.98] transition"
          >
            <Sparkles className="h-4 w-4" />
            Get started — it's free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="w-full py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-foreground font-medium flex items-center justify-center gap-2 active:scale-[.98] transition"
          >
            I already have an account
          </Link>
          <p className="text-center text-[11px] text-muted-foreground">
            By continuing you agree to our Terms & Privacy.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="glass rounded-2xl p-4 flex items-start gap-3 border-white/10">
      <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{text}</div>
      </div>
    </div>
  );
}
