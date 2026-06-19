import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Flame, Salad, Dumbbell, ArrowRight, ShieldCheck, Star,
  ScanLine, Target, Zap, CheckCircle2, Leaf,
} from "lucide-react";
import heroBg from "@/assets/fitness-hero-dark.jpg";

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
      <div className="relative h-[78vh] min-h-[600px] w-full overflow-hidden">
        <img
          src={heroBg}
          alt="MyNutriLens — transform your body"
          width={896}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover scale-105 animate-hero-pan"
        />
        {/* dark wash for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-[oklch(0.07_0.01_160)]" />
        {/* emerald glow accents */}
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-[oklch(0.78_0.20_150/0.35)] blur-[80px] animate-orb-drift" />

        {/* Brand */}
        <div className="absolute inset-x-0 top-6 px-5 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[oklch(0.78_0.20_150/0.15)] border border-[oklch(0.78_0.20_150/0.4)] flex items-center justify-center">
              <Leaf className="h-4 w-4 text-[oklch(0.85_0.20_140)]" />
            </div>
            <span className="text-[15px] font-bold tracking-tight">
              <span className="text-white">my</span>
              <span className="text-[oklch(0.85_0.20_140)]">nutrilens</span>
            </span>
          </div>
          <div className="glass-strong rounded-2xl pl-2 pr-3 py-1.5 flex items-center gap-1.5 border border-white/10">
            <Flame className="h-3.5 w-3.5 text-[oklch(0.78_0.18_60)]" />
            <div className="leading-none">
              <div className="text-[12px] font-bold text-white">2,751 <span className="text-[9px] font-medium text-white/60">kcal</span></div>
              <div className="text-[8px] uppercase tracking-wider text-white/50 mt-0.5">Burned today</div>
            </div>
          </div>
        </div>

        {/* Floating stat pills */}
        <FloatChip
          className="left-3 top-[18%] animate-float"
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-[oklch(0.85_0.20_140)]" />}
          title="+25g Protein"
          sub="Goal hit!"
        />
        <FloatChip
          className="left-3 top-[46%] animate-float-b"
          icon={<Dumbbell className="h-3.5 w-3.5 text-[oklch(0.85_0.20_140)]" />}
          title="Workout Ready"
          sub="Let's crush it"
          emoji="💪"
        />
        <FloatChip
          className="right-3 top-[50%] animate-float"
          icon={<Salad className="h-3.5 w-3.5 text-[oklch(0.85_0.20_140)]" />}
          title="Personalized Plan"
          sub="Made for you"
        />

        {/* Headline */}
        <div className="absolute inset-x-0 bottom-6 px-6 text-center animate-slide-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[oklch(0.78_0.20_150/0.12)] border border-[oklch(0.78_0.20_150/0.4)] backdrop-blur-md mb-4">
            <Leaf className="h-3 w-3 text-[oklch(0.85_0.20_140)]" />
            <span className="text-[11px] font-medium text-[oklch(0.92_0.10_145)]">Real Food. Real Results.</span>
          </div>
          <h1 className="text-[40px] leading-[1.02] font-extrabold tracking-tight text-white">
            Transform Your Body
            <br />
            with <span className="text-[oklch(0.85_0.20_140)]">mynutrilens</span>
          </h1>
          <p className="mt-3 text-[13px] text-white/65 max-w-[330px] mx-auto leading-relaxed">
            Real food tracking. Personalized nutrition.
            <br />Workouts that fit you. Results that stay.
          </p>
        </div>
      </div>

      {/* Stat strip */}
      <div className="px-5 pt-6 grid grid-cols-3 gap-3">
        <StatCard icon={<ScanLine className="h-4 w-4 text-[oklch(0.85_0.20_140)]" />} value="10K+" label="Meals Scanned" />
        <StatCard icon={<Target className="h-4 w-4 text-[oklch(0.85_0.20_140)]" />} value="87%" label="Hit Their Goals" />
        <StatCard icon={<Zap className="h-4 w-4 text-[oklch(0.85_0.20_140)]" />} value="Instant" label="Insights" />
      </div>

      {/* Trust strip */}
      <div className="px-6 pt-5 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[oklch(0.85_0.20_140)]" /> Private & secure</div>
        <div className="h-3 w-px bg-white/15" />
        <div className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-[oklch(0.85_0.20_140)] fill-[oklch(0.85_0.20_140)]" /> 4.9 · 50k+ users</div>
      </div>

      {/* Feature cards */}
      <div className="relative px-5 pt-5 pb-6 space-y-3">
        <Feature delay="0ms" icon={<Flame className="h-4 w-4 text-[oklch(0.78_0.18_60)]" />} title="Calorie tracking that just works" text="Snap a photo. Get macros, calories and portion in seconds." />
        <Feature delay="80ms" icon={<Salad className="h-4 w-4 text-[oklch(0.85_0.20_140)]" />} title="AI diet plans, tuned to you" text="Daily meals around your body, goals, allergies and taste." />
        <Feature delay="160ms" icon={<Dumbbell className="h-4 w-4 text-[oklch(0.78_0.20_150)]" />} title="Smart workouts" text="Sessions that adapt as you get stronger every week." />
      </div>

      {/* CTAs */}
      <div className="px-5 pb-10 space-y-3">
        <Link
          to="/login"
          className="group relative w-full py-4 rounded-2xl bg-gradient-to-r from-[oklch(0.85_0.20_140)] via-[oklch(0.78_0.20_150)] to-[oklch(0.62_0.18_160)] text-[oklch(0.10_0.02_160)] font-bold shadow-[0_18px_50px_-12px_oklch(0.78_0.20_150/0.9)] flex items-center justify-center gap-2 active:scale-[.98] transition overflow-hidden animate-pulse-cta"
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
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

      <style>{`
        @keyframes pulse-cta {
          0%, 100% { box-shadow: 0 18px 50px -12px oklch(0.78 0.20 150 / 0.85), 0 0 0 0 oklch(0.78 0.20 150 / 0.55); }
          50%      { box-shadow: 0 18px 60px -10px oklch(0.78 0.20 150 / 0.95), 0 0 0 14px oklch(0.78 0.20 150 / 0); }
        }
        .animate-pulse-cta { animation: pulse-cta 2.6s ease-out infinite; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-up .55s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>
    </div>
  );
}

function FloatChip({
  className = "", icon, title, sub, emoji,
}: { className?: string; icon: React.ReactNode; title: string; sub: string; emoji?: string }) {
  return (
    <div className={`absolute z-10 ${className}`}>
      <div className="glass-strong rounded-2xl pl-2.5 pr-3.5 py-2 flex items-center gap-2.5 border border-[oklch(0.78_0.20_150/0.35)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]">
        <div className="h-7 w-7 rounded-full bg-[oklch(0.78_0.20_150/0.15)] border border-[oklch(0.78_0.20_150/0.4)] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="leading-tight">
          <div className="text-[12px] font-semibold text-white flex items-center gap-1">{title}{emoji && <span>{emoji}</span>}</div>
          <div className="text-[10px] text-[oklch(0.85_0.20_140)]">{sub}</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="glass rounded-2xl p-3 flex flex-col items-start gap-1.5 border-white/10">
      <div className="h-9 w-9 rounded-full bg-[oklch(0.78_0.20_150/0.12)] border border-[oklch(0.78_0.20_150/0.35)] flex items-center justify-center">
        {icon}
      </div>
      <div className="text-base font-bold text-white leading-none">{value}</div>
      <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
    </div>
  );
}

function Feature({
  icon, title, text, delay = "0ms",
}: { icon: React.ReactNode; title: string; text: string; delay?: string }) {
  return (
    <div
      className="glass rounded-2xl p-4 flex items-start gap-3 border-white/10 fade-up hover:border-[oklch(0.78_0.20_150/0.3)] hover:bg-white/[0.04] transition"
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
