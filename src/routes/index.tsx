import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Flame, Salad, Dumbbell, Target, ArrowRight, ShieldCheck, Star } from "lucide-react";
import welcomeHero from "@/assets/welcome-hero.jpg";

export const Route = createFileRoute("/")({ component: Welcome });

function Welcome() {
  const navigate = useNavigate();

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
      {/* HERO */}
      <div className="relative h-[68vh] min-h-[520px] w-full overflow-hidden">
        <img
          src={welcomeHero}
          alt="MyNutriLens — scan meals and get instant nutrition"
          width={1024}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover scale-110 animate-hero-pan"
        />
        {/* cinematic gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.10_0.03_245/0.15)] via-[oklch(0.10_0.03_245/0.45)] to-[oklch(0.08_0.03_245)]" />
        <div className="pointer-events-none absolute -top-24 -left-20 h-80 w-80 rounded-full bg-[oklch(0.72_0.22_240/0.55)] blur-3xl animate-orb-drift" />
        <div className="pointer-events-none absolute top-40 -right-16 h-72 w-72 rounded-full bg-[oklch(0.82_0.16_215/0.45)] blur-3xl animate-orb-drift" />

        {/* Brand badge */}
        <div className="absolute inset-x-0 top-8 px-6 flex items-center justify-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-strong border border-white/15">
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-[oklch(0.82_0.16_215)] to-[oklch(0.62_0.26_260)] flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/90">MyNutriLens</span>
          </div>
        </div>

        {/* Floating stat pills */}
        <StatPill className="left-3 top-[28%] animate-float" icon={<Salad className="h-3.5 w-3.5 text-[oklch(0.84_0.18_145)]" />} label="Protein tracked" value="128g" />
        <StatPill className="right-3 top-[22%] animate-float-b" icon={<Flame className="h-3.5 w-3.5 text-[oklch(0.78_0.18_45)]" />} label="Calories analyzed" value="1,840" />
        <StatPill className="left-4 top-[52%] animate-float-b" icon={<Dumbbell className="h-3.5 w-3.5 text-[oklch(0.72_0.22_240)]" />} label="Plan ready" value="Day 1" />
        <StatPill className="right-4 top-[58%] animate-float" icon={<Target className="h-3.5 w-3.5 text-[oklch(0.82_0.16_215)]" />} label="Goal progress" value="68%" />

        {/* Headline */}
        <div className="absolute inset-x-0 bottom-6 px-6 text-center animate-slide-up">
          <h1 className="text-[42px] leading-[1.02] font-bold tracking-tight">
            Your Pocket <span className="neon-text">Nutritionist</span>
          </h1>
          <p className="mt-3 text-[13.5px] text-foreground/80 max-w-[330px] mx-auto leading-relaxed">
            Track every calorie, follow AI diet plans, and crush workouts — all from one beautiful app.
          </p>
        </div>
      </div>

      {/* Trust strip */}
      <div className="px-6 pt-5 flex items-center justify-center gap-4 text-[11px] text-muted-foreground animate-slide-up">
        <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[oklch(0.84_0.18_145)]" /> Private & secure</div>
        <div className="h-3 w-px bg-white/15" />
        <div className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-[oklch(0.82_0.16_215)] fill-[oklch(0.82_0.16_215)]" /> 4.9 loved by 50k+</div>
      </div>

      {/* Feature cards */}
      <div className="relative px-6 pt-5 pb-8 space-y-3">
        <Feature delay="0ms" icon={<Flame className="h-4 w-4 text-[oklch(0.78_0.18_45)]" />} title="Calorie tracking that just works" text="Snap a photo. Get macros, calories and portion in seconds." />
        <Feature delay="80ms" icon={<Salad className="h-4 w-4 text-[oklch(0.84_0.18_145)]" />} title="AI diet plans, tuned to you" text="Daily meals around your body, goals, allergies and taste." />
        <Feature delay="160ms" icon={<Dumbbell className="h-4 w-4 text-[oklch(0.72_0.22_240)]" />} title="Smart workouts" text="Sessions that adapt as you get stronger every week." />
      </div>

      {/* CTAs */}
      <div className="px-6 pb-10 space-y-3">
        <Link
          to="/login"
          className="group relative w-full py-4 rounded-2xl bg-gradient-to-r from-[oklch(0.82_0.16_215)] via-[oklch(0.72_0.22_240)] to-[oklch(0.62_0.26_260)] text-white font-semibold shadow-[0_18px_50px_-12px_oklch(0.72_0.22_240/0.95)] flex items-center justify-center gap-2 active:scale-[.98] transition overflow-hidden animate-pulse-cta"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <Sparkles className="h-4 w-4" />
          Start My Journey
          <ArrowRight className="h-4 w-4 transition-transform group-active:translate-x-0.5" />
        </Link>
        <Link
          to="/login"
          className="w-full py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-foreground font-medium flex items-center justify-center gap-2 active:scale-[.98] transition"
        >
          I already have an account
        </Link>
        <p className="text-center text-[11px] text-muted-foreground pt-1">
          By continuing you agree to our Terms & Privacy.
        </p>
      </div>

      {/* Local styles for new animations */}
      <style>{`
        @keyframes pulse-cta {
          0%, 100% { box-shadow: 0 18px 50px -12px oklch(0.72 0.22 240 / 0.85), 0 0 0 0 oklch(0.72 0.22 240 / 0.55); }
          50%      { box-shadow: 0 18px 60px -10px oklch(0.72 0.22 240 / 0.95), 0 0 0 14px oklch(0.72 0.22 240 / 0); }
        }
        .animate-pulse-cta { animation: pulse-cta 2.6s ease-out infinite; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-up .55s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>
    </div>
  );
}

function StatPill({
  icon, label, value, className = "",
}: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className={`absolute z-10 ${className}`}>
      <div className="glass-strong rounded-2xl pl-2.5 pr-3 py-2 flex items-center gap-2 border border-white/15 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]">
        <div className="h-7 w-7 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
          {icon}
        </div>
        <div className="leading-tight">
          <div className="text-[10px] uppercase tracking-wider text-white/60">{label}</div>
          <div className="text-[13px] font-semibold text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon, title, text, delay = "0ms",
}: { icon: React.ReactNode; title: string; text: string; delay?: string }) {
  return (
    <div
      className="glass rounded-2xl p-4 flex items-start gap-3 border-white/10 fade-up hover:border-white/20 hover:bg-white/[0.04] transition"
      style={{ animationDelay: delay }}
    >
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
