import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { s as supabase } from "./client-BMbiJotd.js";
import { Leaf, Flame, CheckCircle2, Dumbbell, Salad, ScanLine, Target, Zap, ShieldCheck, Star, Sparkles, ArrowRight } from "lucide-react";
import { h as heroBg } from "./fitness-hero-dark-Db3tEzAO.js";
import "@supabase/supabase-js";
function Welcome() {
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({
      data
    }) => {
      if (!active) return;
      const u = data.session?.user;
      if (u && !u.is_anonymous) {
        navigate({
          to: "/home",
          replace: true
        });
      }
    }).catch(() => {
    });
    return () => {
      active = false;
    };
  }, [navigate]);
  return /* @__PURE__ */ jsxs("div", { className: "app-shell relative overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative h-[78vh] min-h-[600px] w-full overflow-hidden", children: [
      /* @__PURE__ */ jsx("img", { src: heroBg, alt: "MyNutriLens — transform your body", width: 896, height: 1280, className: "absolute inset-0 h-full w-full object-cover scale-105 animate-hero-pan" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-[oklch(0.07_0.01_160)]" }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-[oklch(0.78_0.20_150/0.35)] blur-[80px] animate-orb-drift" }),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-x-0 top-6 px-5 flex items-center justify-between animate-slide-up", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "h-7 w-7 rounded-lg bg-[oklch(0.78_0.20_150/0.15)] border border-[oklch(0.78_0.20_150/0.4)] flex items-center justify-center", children: /* @__PURE__ */ jsx(Leaf, { className: "h-4 w-4 text-[oklch(0.85_0.20_140)]" }) }),
          /* @__PURE__ */ jsxs("span", { className: "text-[15px] font-bold tracking-tight", children: [
            /* @__PURE__ */ jsx("span", { className: "text-white", children: "my" }),
            /* @__PURE__ */ jsx("span", { className: "text-[oklch(0.85_0.20_140)]", children: "nutrilens" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "glass-strong rounded-2xl pl-2 pr-3 py-1.5 flex items-center gap-1.5 border border-white/10", children: [
          /* @__PURE__ */ jsx(Flame, { className: "h-3.5 w-3.5 text-[oklch(0.78_0.18_60)]" }),
          /* @__PURE__ */ jsxs("div", { className: "leading-none", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-[12px] font-bold text-white", children: [
              "2,751 ",
              /* @__PURE__ */ jsx("span", { className: "text-[9px] font-medium text-white/60", children: "kcal" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-[8px] uppercase tracking-wider text-white/50 mt-0.5", children: "Burned today" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(FloatChip, { className: "left-3 top-[18%] animate-float", icon: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5 text-[oklch(0.85_0.20_140)]" }), title: "+25g Protein", sub: "Goal hit!" }),
      /* @__PURE__ */ jsx(FloatChip, { className: "left-3 top-[46%] animate-float-b", icon: /* @__PURE__ */ jsx(Dumbbell, { className: "h-3.5 w-3.5 text-[oklch(0.85_0.20_140)]" }), title: "Workout Ready", sub: "Let's crush it", emoji: "💪" }),
      /* @__PURE__ */ jsx(FloatChip, { className: "right-3 top-[50%] animate-float", icon: /* @__PURE__ */ jsx(Salad, { className: "h-3.5 w-3.5 text-[oklch(0.85_0.20_140)]" }), title: "Personalized Plan", sub: "Made for you" }),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-x-0 bottom-6 px-6 text-center animate-slide-up", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[oklch(0.78_0.20_150/0.12)] border border-[oklch(0.78_0.20_150/0.4)] backdrop-blur-md mb-4", children: [
          /* @__PURE__ */ jsx(Leaf, { className: "h-3 w-3 text-[oklch(0.85_0.20_140)]" }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-medium text-[oklch(0.92_0.10_145)]", children: "Real Food. Real Results." })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-[40px] leading-[1.02] font-extrabold tracking-tight text-white", children: [
          "Transform Your Body",
          /* @__PURE__ */ jsx("br", {}),
          "with ",
          /* @__PURE__ */ jsx("span", { className: "text-[oklch(0.85_0.20_140)]", children: "mynutrilens" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "mt-3 text-[13px] text-white/65 max-w-[330px] mx-auto leading-relaxed", children: [
          "Real food tracking. Personalized nutrition.",
          /* @__PURE__ */ jsx("br", {}),
          "Workouts that fit you. Results that stay."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "px-5 pt-6 grid grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(ScanLine, { className: "h-4 w-4 text-[oklch(0.85_0.20_140)]" }), value: "10K+", label: "Meals Scanned" }),
      /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(Target, { className: "h-4 w-4 text-[oklch(0.85_0.20_140)]" }), value: "87%", label: "Hit Their Goals" }),
      /* @__PURE__ */ jsx(StatCard, { icon: /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4 text-[oklch(0.85_0.20_140)]" }), value: "Instant", label: "Insights" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "px-6 pt-5 flex items-center justify-center gap-4 text-[11px] text-muted-foreground", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "h-3.5 w-3.5 text-[oklch(0.85_0.20_140)]" }),
        " Private & secure"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-3 w-px bg-white/15" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(Star, { className: "h-3.5 w-3.5 text-[oklch(0.85_0.20_140)] fill-[oklch(0.85_0.20_140)]" }),
        " 4.9 · 50k+ users"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative px-5 pt-5 pb-6 space-y-3", children: [
      /* @__PURE__ */ jsx(Feature, { delay: "0ms", icon: /* @__PURE__ */ jsx(Flame, { className: "h-4 w-4 text-[oklch(0.78_0.18_60)]" }), title: "Calorie tracking that just works", text: "Snap a photo. Get macros, calories and portion in seconds." }),
      /* @__PURE__ */ jsx(Feature, { delay: "80ms", icon: /* @__PURE__ */ jsx(Salad, { className: "h-4 w-4 text-[oklch(0.85_0.20_140)]" }), title: "AI diet plans, tuned to you", text: "Daily meals around your body, goals, allergies and taste." }),
      /* @__PURE__ */ jsx(Feature, { delay: "160ms", icon: /* @__PURE__ */ jsx(Dumbbell, { className: "h-4 w-4 text-[oklch(0.78_0.20_150)]" }), title: "Smart workouts", text: "Sessions that adapt as you get stronger every week." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "px-5 pb-10 space-y-3", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/login", className: "group relative w-full py-4 rounded-2xl bg-gradient-to-r from-[oklch(0.85_0.20_140)] via-[oklch(0.78_0.20_150)] to-[oklch(0.62_0.18_160)] text-[oklch(0.10_0.02_160)] font-bold shadow-[0_18px_50px_-12px_oklch(0.78_0.20_150/0.9)] flex items-center justify-center gap-2 active:scale-[.98] transition overflow-hidden animate-pulse-cta", children: [
        /* @__PURE__ */ jsx("span", { className: "absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" }),
        /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
        "Start My Journey",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 transition-transform group-active:translate-x-0.5" })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/login", className: "w-full py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-foreground font-medium flex items-center justify-center gap-2 active:scale-[.98] transition", children: "I already have an account" }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-[11px] text-muted-foreground pt-1", children: "By continuing you agree to our Terms & Privacy." })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes pulse-cta {
          0%, 100% { box-shadow: 0 18px 50px -12px oklch(0.78 0.20 150 / 0.85), 0 0 0 0 oklch(0.78 0.20 150 / 0.55); }
          50%      { box-shadow: 0 18px 60px -10px oklch(0.78 0.20 150 / 0.95), 0 0 0 14px oklch(0.78 0.20 150 / 0); }
        }
        .animate-pulse-cta { animation: pulse-cta 2.6s ease-out infinite; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-up .55s cubic-bezier(.2,.8,.2,1) both; }
      ` })
  ] });
}
function FloatChip({
  className = "",
  icon,
  title,
  sub,
  emoji
}) {
  return /* @__PURE__ */ jsx("div", { className: `absolute z-10 ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "glass-strong rounded-2xl pl-2.5 pr-3.5 py-2 flex items-center gap-2.5 border border-[oklch(0.78_0.20_150/0.35)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)]", children: [
    /* @__PURE__ */ jsx("div", { className: "h-7 w-7 rounded-full bg-[oklch(0.78_0.20_150/0.15)] border border-[oklch(0.78_0.20_150/0.4)] flex items-center justify-center shrink-0", children: icon }),
    /* @__PURE__ */ jsxs("div", { className: "leading-tight", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-[12px] font-semibold text-white flex items-center gap-1", children: [
        title,
        emoji && /* @__PURE__ */ jsx("span", { children: emoji })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-[10px] text-[oklch(0.85_0.20_140)]", children: sub })
    ] })
  ] }) });
}
function StatCard({
  icon,
  value,
  label
}) {
  return /* @__PURE__ */ jsxs("div", { className: "glass rounded-2xl p-3 flex flex-col items-start gap-1.5 border-white/10", children: [
    /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-full bg-[oklch(0.78_0.20_150/0.12)] border border-[oklch(0.78_0.20_150/0.35)] flex items-center justify-center", children: icon }),
    /* @__PURE__ */ jsx("div", { className: "text-base font-bold text-white leading-none", children: value }),
    /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground leading-tight", children: label })
  ] });
}
function Feature({
  icon,
  title,
  text,
  delay = "0ms"
}) {
  return /* @__PURE__ */ jsxs("div", { className: "glass rounded-2xl p-4 flex items-start gap-3 border-white/10 fade-up hover:border-[oklch(0.78_0.20_150/0.3)] hover:bg-white/[0.04] transition", style: {
    animationDelay: delay
  }, children: [
    /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0", children: icon }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold", children: title }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: text })
    ] })
  ] });
}
export {
  Welcome as component
};
