import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useQuery, useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { u as useServerFn } from "./router-D-2d6VGp.js";
import { d as dashboardQuery } from "./queries-DQC1c2F_.js";
import { Sparkles, ChevronRight, Trophy, Users, Flame, Zap, Crown, Gift, UserPlus, Copy, Share2, Camera, Dumbbell, Scale, Plus, Target, CheckCircle2, Circle, Loader2, TrendingUp } from "lucide-react";
import { g as getSquadLeaderboard, l as listMySquads } from "./squad.functions-BwqOTUym.js";
import { toast } from "sonner";
import { g as generateInsight } from "./scan.functions-Dup3n4S4.js";
import "./client-BMbiJotd.js";
import "@supabase/supabase-js";
import "@capacitor/core";
import "./server-BadC42R4.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "zod";
import "./auth-middleware-B4NMxYBh.js";
import "./createMiddleware-BvN2ghIY.js";
import "./food.functions-C13l6RKQ.js";
const RINGS = [
  { key: "calories", label: "Calories", unit: "kcal", from: "#FF7A18", to: "#FFB347", glow: "#FF8A3C" },
  { key: "protein", label: "Protein", unit: "g", from: "#FF2E63", to: "#FF6FA1", glow: "#FF4E84" },
  { key: "carbs", label: "Carbs", unit: "g", from: "#8B5CF6", to: "#D946EF", glow: "#A855F7" },
  { key: "fat", label: "Fat", unit: "g", from: "#10B981", to: "#5EEAD4", glow: "#34D399" }
];
function MacroRings({
  totals,
  goals,
  insight
}) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 16;
  const gap = 6;
  const radii = [
    size / 2 - stroke / 2 - 4,
    size / 2 - stroke / 2 - 4 - (stroke + gap),
    size / 2 - stroke / 2 - 4 - (stroke + gap) * 2,
    size / 2 - stroke / 2 - 4 - (stroke + gap) * 3
  ];
  const pcts = RINGS.map((r) => {
    const consumed = Number(totals[r.key] ?? 0);
    const goal = Math.max(1, Number(goals[r.key] ?? 1));
    return { ...r, consumed: Math.round(consumed), goal: Math.round(goal), pct: Math.min(150, consumed / goal * 100) };
  });
  const score = Math.round(
    pcts.reduce((a, r) => a + Math.min(100, r.pct), 0) / 4
  );
  return /* @__PURE__ */ jsxs("section", { className: "rounded-[28px] border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-5 overflow-hidden relative animate-slide-up", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute -top-24 -right-20 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" }),
    /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground", children: "AI Nutrition" }),
        /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold mt-0.5", children: "Today's macros" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3 text-primary" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "Live" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative mx-auto", style: { width: size, height: size }, children: [
      /* @__PURE__ */ jsxs("svg", { viewBox: `0 0 ${size} ${size}`, className: "w-full h-full -rotate-90", children: [
        /* @__PURE__ */ jsxs("defs", { children: [
          pcts.map((r) => /* @__PURE__ */ jsxs("linearGradient", { id: `g-${r.key}`, x1: "0", y1: "0", x2: "1", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: r.from }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: r.to })
          ] }, r.key)),
          /* @__PURE__ */ jsxs("filter", { id: "ringGlow", x: "-30%", y: "-30%", width: "160%", height: "160%", children: [
            /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: "3", result: "blur" }),
            /* @__PURE__ */ jsxs("feMerge", { children: [
              /* @__PURE__ */ jsx("feMergeNode", { in: "blur" }),
              /* @__PURE__ */ jsx("feMergeNode", { in: "SourceGraphic" })
            ] })
          ] })
        ] }),
        pcts.map((r, i) => {
          const radius = radii[i];
          const c = 2 * Math.PI * radius;
          const off = c - Math.min(100, r.pct) / 100 * c;
          return /* @__PURE__ */ jsxs("g", { children: [
            /* @__PURE__ */ jsx("circle", { cx, cy, r: radius, fill: "none", stroke: "rgba(255,255,255,0.05)", strokeWidth: stroke }),
            /* @__PURE__ */ jsx(
              "circle",
              {
                cx,
                cy,
                r: radius,
                fill: "none",
                stroke: `url(#g-${r.key})`,
                strokeWidth: stroke,
                strokeLinecap: "round",
                strokeDasharray: c,
                strokeDashoffset: off,
                filter: "url(#ringGlow)",
                style: { transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }
              }
            )
          ] }, r.key);
        })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-center px-8", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase tracking-[0.22em] text-muted-foreground", children: "AI Score" }),
        /* @__PURE__ */ jsx("p", { className: "text-4xl font-bold tabular-nums bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent leading-none mt-1", children: score }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground mt-1", children: "/ 100" }),
        insight && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-foreground/70 leading-snug mt-2 line-clamp-3", children: insight })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "relative grid grid-cols-2 gap-2 mt-5", children: pcts.map((r) => {
      const remaining = Math.max(0, r.goal - r.consumed);
      return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "h-2.5 w-2.5 rounded-full",
              style: { background: `linear-gradient(135deg, ${r.from}, ${r.to})`, boxShadow: `0 0 10px ${r.glow}99` }
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: r.label }),
          /* @__PURE__ */ jsxs("span", { className: "ml-auto text-[10px] tabular-nums text-muted-foreground", children: [
            Math.round(Math.min(100, r.pct)),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1 mt-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-lg font-bold tabular-nums", children: r.consumed }),
          /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground", children: [
            "/ ",
            r.goal,
            " ",
            r.unit
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-1.5", children: remaining > 0 ? /* @__PURE__ */ jsxs(
          "span",
          {
            className: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
            style: {
              background: `linear-gradient(135deg, ${r.from}22, ${r.to}22)`,
              color: r.glow,
              border: `1px solid ${r.glow}55`,
              boxShadow: `0 0 12px ${r.glow}55, inset 0 0 6px ${r.glow}33`
            },
            children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: "h-1.5 w-1.5 rounded-full",
                  style: { background: r.glow, boxShadow: `0 0 6px ${r.glow}` }
                }
              ),
              remaining,
              " ",
              r.unit,
              " left"
            ]
          }
        ) : /* @__PURE__ */ jsx(
          "span",
          {
            className: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            style: {
              background: "linear-gradient(135deg, #10b98122, #5eead422)",
              color: "#5eead4",
              border: "1px solid #34d39955",
              boxShadow: "0 0 12px #34d39955"
            },
            children: "✓ Goal reached"
          }
        ) })
      ] }, r.key);
    }) })
  ] });
}
const CHALLENGE_EMOJI = {
  weight_loss: "⚖️",
  muscle_gain: "💪",
  steps: "🏃",
  healthy_eating: "🥗",
  workout: "🏋️",
  hydration: "💧",
  sleep: "😴",
  custom: "✨"
};
function initials(name) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "A";
}
function avatarTone(i) {
  const tones = [
    "from-emerald-400 to-cyan-400",
    "from-fuchsia-400 to-pink-400",
    "from-amber-400 to-orange-400",
    "from-sky-400 to-indigo-400",
    "from-lime-400 to-emerald-400"
  ];
  return tones[i % tones.length];
}
function SquadHeroCard({ squad }) {
  const lbFn = useServerFn(getSquadLeaderboard);
  const { data } = useQuery({
    queryKey: ["squad", squad.id, "leaderboard"],
    queryFn: () => lbFn({ data: { squad_id: squad.id } }),
    staleTime: 6e4
  });
  const leaderboard = data?.leaderboard ?? [];
  const me = data?.me;
  const leader = leaderboard[0];
  const myRank = me ? leaderboard.findIndex((l) => l.user_id === me.user_id) + 1 : 0;
  const memberCount = leaderboard.length || 1;
  const streak = me?.streak_days ?? 0;
  const weeklyXP = me?.points ?? 0;
  const daysLeft = Math.max(0, Math.ceil((new Date(squad.ends_at).getTime() - Date.now()) / 864e5));
  const totalDays = squad.period === "monthly" ? 30 : 7;
  const elapsed = Math.min(totalDays, totalDays - daysLeft);
  const progress = Math.round(elapsed / totalDays * 100);
  const goalPts = squad.period === "monthly" ? 1500 : 400;
  const rewardProgress = Math.min(100, Math.round((me?.points ?? 0) / goalPts * 100));
  const inviteCode = `FIT-${squad.code}`;
  const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/squads/join/${squad.code}` : `/squads/join/${squad.code}`;
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success("Code copied");
    } catch {
      toast.error("Copy failed");
    }
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed");
    }
  };
  const shareInvite = async () => {
    const payload = { title: `Join ${squad.name} on MyNutriLens`, text: `Squad code: ${inviteCode}`, url: inviteLink };
    try {
      if (navigator.share) await navigator.share(payload);
      else await copyLink();
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.10] via-white/[0.02] to-cyan-500/[0.06] backdrop-blur-2xl p-5 shadow-[0_20px_60px_-30px_rgba(52,211,153,0.6)]", children: [
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" }),
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" }),
    /* @__PURE__ */ jsxs("div", { className: "relative flex items-start gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-2xl shadow-[0_0_24px_rgba(52,211,153,0.45)]", children: CHALLENGE_EMOJI[squad.challenge_type] ?? "🏆" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.22em] text-emerald-300 font-semibold", children: "Your Squad" }),
          /* @__PURE__ */ jsx("span", { className: "text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-400/15 border border-emerald-400/25 text-emerald-200 uppercase tracking-wider", children: "Live" })
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold tracking-tight truncate", children: squad.name }),
        /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground capitalize", children: [
          String(squad.challenge_type).replace("_", " "),
          " · ",
          squad.period
        ] })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/squads/$squadId", params: { squadId: squad.id }, className: "h-8 w-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center", children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "relative mt-4 grid grid-cols-4 gap-2", children: [
      { icon: /* @__PURE__ */ jsx(Trophy, { className: "h-3.5 w-3.5 text-amber-300" }), label: "Rank", val: myRank ? `#${myRank}` : "—" },
      { icon: /* @__PURE__ */ jsx(Users, { className: "h-3.5 w-3.5 text-cyan-300" }), label: "Members", val: memberCount },
      { icon: /* @__PURE__ */ jsx(Flame, { className: "h-3.5 w-3.5 text-orange-300" }), label: "Streak", val: `${streak}d` },
      { icon: /* @__PURE__ */ jsx(Zap, { className: "h-3.5 w-3.5 text-emerald-300" }), label: "XP", val: weeklyXP }
    ].map((s) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-black/30 border border-white/[0.06] px-2 py-2.5 text-center backdrop-blur-xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
        s.icon,
        /* @__PURE__ */ jsx("span", { className: "text-[9px] uppercase tracking-widest text-muted-foreground", children: s.label })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-bold tabular-nums mt-0.5", children: s.val })
    ] }, s.label)) }),
    /* @__PURE__ */ jsxs("div", { className: "relative mt-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex -space-x-2", children: [
        leaderboard.slice(0, 5).map((m, i) => /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("div", { className: `h-8 w-8 rounded-full bg-gradient-to-br ${avatarTone(i)} border-2 border-[#0a0f0d] flex items-center justify-center text-[10px] font-bold text-black shadow-[0_0_10px_rgba(52,211,153,0.35)]`, children: initials(m.display_name || "A") }),
          i === 0 && leader && /* @__PURE__ */ jsx(Crown, { className: "absolute -top-2.5 left-1/2 -translate-x-1/2 h-3.5 w-3.5 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" })
        ] }, m.user_id)),
        memberCount > 5 && /* @__PURE__ */ jsxs("div", { className: "h-8 w-8 rounded-full bg-white/[0.06] border-2 border-[#0a0f0d] flex items-center justify-center text-[10px] font-semibold", children: [
          "+",
          memberCount - 5
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase tracking-widest text-muted-foreground", children: "Days left" }),
        /* @__PURE__ */ jsxs("p", { className: "text-base font-bold text-emerald-300 tabular-nums", children: [
          daysLeft,
          /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground", children: [
            "/",
            totalDays
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative mt-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[10px] mb-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground uppercase tracking-widest", children: "Challenge progress" }),
        /* @__PURE__ */ jsxs("span", { className: "text-emerald-300 tabular-nums font-semibold", children: [
          progress,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-2 rounded-full bg-white/[0.05] overflow-hidden", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: "h-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-300 shadow-[0_0_12px_rgba(52,211,153,0.6)] transition-all duration-700",
          style: { width: `${progress}%` }
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative mt-3 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2.5", children: [
      /* @__PURE__ */ jsx("div", { className: "h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-[0_0_16px_rgba(251,191,36,0.45)]", children: /* @__PURE__ */ jsx(Gift, { className: "h-4 w-4 text-black" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold", children: "Coupon + 3 Platinum days" }),
        /* @__PURE__ */ jsx("div", { className: "mt-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-gradient-to-r from-amber-300 to-orange-300", style: { width: `${rewardProgress}%` } }) })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-mono text-amber-200", children: [
        rewardProgress,
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative mt-3 flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-black/30 px-3 py-2.5 backdrop-blur-xl", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5 text-emerald-300" }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-widest text-muted-foreground", children: "Invite" }),
      /* @__PURE__ */ jsx("span", { className: "flex-1 font-mono text-sm font-bold tracking-widest text-emerald-200", children: inviteCode }),
      /* @__PURE__ */ jsx("button", { onClick: copyCode, className: "text-[10px] px-2 py-1 rounded-lg bg-emerald-400/15 border border-emerald-400/25 text-emerald-200 font-medium", children: "Copy" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative mt-3 grid grid-cols-3 gap-2", children: [
      /* @__PURE__ */ jsxs("button", { onClick: shareInvite, className: "flex flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-emerald-400/15 to-emerald-400/5 py-2.5 backdrop-blur-xl active:scale-95 transition-transform", children: [
        /* @__PURE__ */ jsx(UserPlus, { className: "h-4 w-4 text-emerald-300" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold", children: "Invite" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: copyCode, className: "flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] py-2.5 backdrop-blur-xl active:scale-95 transition-transform", children: [
        /* @__PURE__ */ jsx(Copy, { className: "h-4 w-4 text-cyan-300" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold", children: "Copy Code" })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: copyLink, className: "flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] py-2.5 backdrop-blur-xl active:scale-95 transition-transform", children: [
        /* @__PURE__ */ jsx(Share2, { className: "h-4 w-4 text-fuchsia-300" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold", children: "Share Link" })
      ] })
    ] }),
    leaderboard.length > 0 && /* @__PURE__ */ jsxs("div", { className: "relative mt-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Trophy, { className: "h-3 w-3 text-amber-300" }),
          " Leaderboard"
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/squads/$squadId", params: { squadId: squad.id }, className: "text-[10px] text-emerald-300 font-medium", children: "View all" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: leaderboard.slice(0, 3).map((m, i) => {
        const isMe = me && m.user_id === me.user_id;
        return /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2.5 rounded-xl px-2.5 py-2 border ${isMe ? "border-emerald-400/30 bg-emerald-400/[0.08]" : "border-white/[0.05] bg-white/[0.02]"}`, children: [
          /* @__PURE__ */ jsx("div", { className: `h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold tabular-nums ${i === 0 ? "bg-amber-400/20 text-amber-300 border border-amber-400/30" : i === 1 ? "bg-slate-400/20 text-slate-200 border border-slate-400/30" : i === 2 ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "bg-white/[0.04] text-muted-foreground"}`, children: i + 1 }),
          /* @__PURE__ */ jsx("div", { className: `h-6 w-6 rounded-full bg-gradient-to-br ${avatarTone(i)} flex items-center justify-center text-[9px] font-bold text-black`, children: initials(m.display_name || "A") }),
          /* @__PURE__ */ jsxs("p", { className: "flex-1 text-xs font-medium truncate", children: [
            m.display_name,
            isMe && /* @__PURE__ */ jsx("span", { className: "ml-1 text-[9px] text-emerald-300", children: "(you)" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold tabular-nums text-emerald-200", children: [
            m.points,
            /* @__PURE__ */ jsx("span", { className: "text-[9px] text-muted-foreground ml-0.5", children: "XP" })
          ] })
        ] }, m.user_id);
      }) })
    ] })
  ] });
}
function Home() {
  const navigate = useNavigate();
  const {
    data
  } = useSuspenseQuery(dashboardQuery);
  const qc = useQueryClient();
  const profile = data.profile;
  const squadsFn = useServerFn(listMySquads);
  const {
    data: squads = []
  } = useQuery({
    queryKey: ["squads"],
    queryFn: () => squadsFn(),
    staleTime: 6e4
  });
  useEffect(() => {
    if (profile && !profile.onboarded_at) navigate({
      to: "/onboarding",
      replace: true
    });
  }, [profile, navigate]);
  const greet = (() => {
    const h = (/* @__PURE__ */ new Date()).getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const goal = profile?.daily_calorie_goal ?? 2200;
  const totals = data.totals;
  const burned = data.burned;
  const streak = profile?.streak_count ?? 0;
  const goals = {
    calories: goal,
    protein: profile?.protein_goal_g ?? 140,
    carbs: profile?.carbs_goal_g ?? 250,
    fat: profile?.fat_goal_g ?? 70
  };
  const mealsLogged = data.recentFoods.length;
  const xp = streak * 50 + mealsLogged * 25 + (burned > 0 ? 100 : 0);
  const level = Math.floor(xp / 500) + 1;
  const xpInto = xp % 500;
  const xpPct = xpInto / 500 * 100;
  const startDate = profile?.onboarded_at ? new Date(profile.onboarded_at) : null;
  const targetDate = startDate ? new Date(startDate.getTime() + 12 * 7 * 864e5) : null;
  const daysLeft = targetDate ? Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / 864e5)) : null;
  const weekNum = startDate ? Math.min(12, Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (7 * 864e5)))) : 1;
  const startW = Number(profile?.weight_kg ?? 0);
  const targetW = Number(profile?.target_weight_kg ?? 0);
  const transformPct = startW && targetW && startW !== targetW ? Math.min(100, Math.max(0, Math.round(Math.abs(startW - startW) / Math.abs(startW - targetW) * 100))) : 0;
  const mealTypes = new Set(data.recentFoods.map((f) => f.meal_type));
  const proteinHit = totals.protein >= goals.protein * 0.9;
  const missions = [{
    id: "scan",
    label: "Log a meal",
    done: mealsLogged > 0,
    xp: 25,
    icon: Camera,
    to: "/scan"
  }, {
    id: "protein",
    label: `Hit ${goals.protein}g protein`,
    done: proteinHit,
    xp: 50,
    icon: Flame,
    to: "/diet"
  }, {
    id: "workout",
    label: "Complete a workout",
    done: burned > 0,
    xp: 100,
    icon: Dumbbell,
    to: "/workout"
  }, {
    id: "weight",
    label: "Log weight",
    done: (data.weights ?? []).some((w) => new Date(w.logged_at).toDateString() === (/* @__PURE__ */ new Date()).toDateString()),
    xp: 25,
    icon: Scale,
    to: "/profile"
  }, {
    id: "dinner",
    label: "Log dinner",
    done: mealTypes.has("dinner"),
    xp: 25,
    icon: Plus,
    to: "/scan"
  }];
  const missionsDone = missions.filter((m) => m.done).length;
  const calRemaining = Math.max(0, goal - totals.calories);
  const proteinRemaining = Math.max(0, goals.protein - totals.protein);
  const nutritionScore = Math.round((Math.min(100, totals.calories / goal * 100) + Math.min(100, totals.protein / goals.protein * 100) + Math.min(100, totals.carbs / goals.carbs * 100) + Math.min(100, totals.fat / goals.fat * 100)) / 4);
  const insightText = data.insight?.content ?? (mealsLogged === 0 ? `Start strong — scan your first meal to unlock ${calRemaining} kcal of fuel.` : `${proteinRemaining}g protein and ${calRemaining} kcal left. A grilled chicken bowl would close the gap.`);
  const insightMut = useMutation({
    mutationFn: () => generateInsight(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
      toast.success("Fresh insight ready");
    },
    onError: (e) => toast.error(e.message)
  });
  const suggestions = useMemo(() => [{
    emoji: "🥗",
    name: "Greek chicken bowl",
    kcal: 520,
    p: 42
  }, {
    emoji: "🍳",
    name: "Protein scramble",
    kcal: 380,
    p: 32
  }, {
    emoji: "🥤",
    name: "Whey + banana",
    kcal: 280,
    p: 30
  }], []);
  return /* @__PURE__ */ jsxs("div", { className: "px-5 pt-12 pb-28 space-y-5 relative", children: [
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" }),
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute top-40 -left-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" }),
    /* @__PURE__ */ jsxs("header", { className: "relative flex items-center justify-between animate-slide-up", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground", children: greet }),
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold tracking-tight mt-0.5", children: [
          profile?.display_name ?? "Athlete",
          " ",
          /* @__PURE__ */ jsx("span", { className: "inline-block animate-pulse", children: "👋" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl px-3 py-1.5 border border-amber-400/20 bg-gradient-to-br from-amber-500/15 to-orange-500/5 backdrop-blur-xl flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Flame, { className: "h-3.5 w-3.5 text-amber-300" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold tabular-nums text-amber-200", children: streak })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl px-3 py-1.5 border border-violet-400/20 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/5 backdrop-blur-xl flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Crown, { className: "h-3.5 w-3.5 text-violet-300" }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold tabular-nums text-violet-200", children: [
            "Lv ",
            level
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "relative rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-4 animate-slide-up", style: {
      animationDelay: ".05s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 text-amber-300" }),
          " ",
          xp,
          " XP · Level ",
          level
        ] }),
        daysLeft !== null && /* @__PURE__ */ jsxs("span", { className: "text-cyan-300/90", children: [
          "Week ",
          weekNum,
          "/12 · ",
          daysLeft,
          "d left"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 h-2 rounded-full bg-white/5 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full transition-[width] duration-1000", style: {
        width: `${xpPct}%`,
        background: "linear-gradient(90deg,#fbbf24,#f97316,#ec4899)",
        boxShadow: "0 0 16px rgba(251,191,36,0.5)"
      } }) }),
      /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground mt-1.5 tabular-nums", children: [
        500 - xpInto,
        " XP to Level ",
        level + 1
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "animate-slide-up", style: {
      animationDelay: ".1s"
    }, children: /* @__PURE__ */ jsx(MacroRings, { totals, goals, insight: `${calRemaining} kcal left · ${proteinRemaining}g protein to go` }) }),
    /* @__PURE__ */ jsx("section", { className: "grid grid-cols-3 gap-2 animate-slide-up", style: {
      animationDelay: ".15s"
    }, children: [{
      label: "Eaten",
      val: totals.calories,
      tone: "text-foreground"
    }, {
      label: "Burned",
      val: burned,
      tone: "text-emerald-300"
    }, {
      label: "Net",
      val: totals.calories - burned,
      tone: "text-cyan-300"
    }].map((s) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-3 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: s.label }),
      /* @__PURE__ */ jsx("p", { className: `text-lg font-bold tabular-nums mt-0.5 ${s.tone}`, children: Math.round(s.val) })
    ] }, s.label)) }),
    /* @__PURE__ */ jsx("section", { className: "animate-slide-up space-y-3", style: {
      animationDelay: ".17s"
    }, children: squads.length === 0 ? /* @__PURE__ */ jsxs(Link, { to: "/squads", className: "relative block overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.12] via-white/[0.02] to-cyan-500/[0.08] backdrop-blur-2xl p-5 shadow-[0_20px_60px_-30px_rgba(52,211,153,0.5)]", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute -top-16 -right-10 h-40 w-40 rounded-full bg-emerald-400/25 blur-3xl" }),
      /* @__PURE__ */ jsx("div", { className: "absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" }),
      /* @__PURE__ */ jsxs("div", { className: "relative flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_24px_rgba(52,211,153,0.55)]", children: /* @__PURE__ */ jsx(Users, { className: "h-5 w-5 text-black" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.22em] text-emerald-300 font-semibold", children: "New · Squad Challenges" }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold mt-0.5", children: "Compete with friends, win Platinum" }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Create a squad or join with a code · earn coupons + badges" })
        ] }),
        /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-emerald-300" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "relative mt-4 grid grid-cols-3 gap-2", children: [{
        icon: /* @__PURE__ */ jsx(Trophy, { className: "h-3.5 w-3.5 text-amber-300" }),
        l: "Coupons"
      }, {
        icon: /* @__PURE__ */ jsx(Crown, { className: "h-3.5 w-3.5 text-fuchsia-300" }),
        l: "Platinum"
      }, {
        icon: /* @__PURE__ */ jsx(Zap, { className: "h-3.5 w-3.5 text-emerald-300" }),
        l: "XP Bonus"
      }].map((r) => /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-black/30 border border-white/[0.06] px-2 py-2 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
        r.icon,
        /* @__PURE__ */ jsx("span", { className: "text-[9px] uppercase tracking-widest text-muted-foreground", children: r.l })
      ] }) }, r.l)) })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      (() => {
        const active = squads.filter((s) => !s.finalized_at)[0] ?? squads[0];
        return /* @__PURE__ */ jsx(SquadHeroCard, { squad: active });
      })(),
      squads.length > 1 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-1 mb-2", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Trophy, { className: "h-3 w-3 text-amber-300" }),
            " Other squads"
          ] }),
          /* @__PURE__ */ jsx(Link, { to: "/squads", className: "text-[11px] text-emerald-300", children: "Manage all" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1", children: [
          squads.slice(1, 6).map((s) => {
            const daysLeft2 = Math.max(0, Math.ceil((new Date(s.ends_at).getTime() - Date.now()) / 864e5));
            return /* @__PURE__ */ jsxs(Link, { to: "/squads/$squadId", params: {
              squadId: s.id
            }, className: "min-w-[200px] rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-3 flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400/25 to-cyan-400/25 flex items-center justify-center", children: /* @__PURE__ */ jsx(Users, { className: "h-4 w-4 text-emerald-300" }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold truncate", children: s.name }),
                /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground capitalize", children: [
                  s.challenge_type.replace("_", " "),
                  " · ",
                  daysLeft2,
                  "d"
                ] })
              ] })
            ] }, s.id);
          }),
          /* @__PURE__ */ jsxs(Link, { to: "/squads", className: "min-w-[110px] rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.06] flex flex-col items-center justify-center py-3 gap-1", children: [
            /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 text-emerald-300" }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] text-emerald-300 font-medium", children: "New squad" })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "relative rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-5 animate-slide-up", style: {
      animationDelay: ".2s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground", children: "Daily missions" }),
          /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold flex items-center gap-1.5 mt-0.5", children: [
            /* @__PURE__ */ jsx(Target, { className: "h-4 w-4 text-fuchsia-300" }),
            " ",
            missionsDone,
            "/",
            missions.length,
            " complete"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-[10px] tabular-nums text-amber-200 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full", children: [
          "+",
          missions.filter((m) => !m.done).reduce((a, m) => a + m.xp, 0),
          " XP"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: missions.map((m) => {
        const Icon = m.done ? CheckCircle2 : m.icon;
        return /* @__PURE__ */ jsxs(Link, { to: m.to, className: `flex items-center gap-3 rounded-2xl p-3 border transition-all ${m.done ? "border-emerald-400/20 bg-emerald-500/[0.06]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] active:scale-[.99]"}`, children: [
          /* @__PURE__ */ jsx("div", { className: `h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${m.done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-foreground/70"}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: `text-sm font-medium ${m.done ? "line-through text-muted-foreground" : ""}`, children: m.label }),
            /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
              "+",
              m.xp,
              " XP"
            ] })
          ] }),
          !m.done && /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" }),
          m.done && /* @__PURE__ */ jsx(Circle, { className: "h-4 w-4 text-emerald-300 fill-emerald-300" })
        ] }, m.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "relative rounded-3xl border border-white/[0.06] bg-gradient-to-br from-violet-500/[0.08] via-white/[0.02] to-cyan-500/[0.06] backdrop-blur-xl p-5 overflow-hidden animate-slide-up", style: {
      animationDelay: ".25s"
    }, children: [
      /* @__PURE__ */ jsx("div", { className: "absolute -top-16 -right-16 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" }),
      /* @__PURE__ */ jsxs("div", { className: "relative flex items-start gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.4)]", children: /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5 text-white" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold", children: "AI Nutrition Coach" }),
            /* @__PURE__ */ jsx("button", { onClick: () => insightMut.mutate(), disabled: insightMut.isPending, className: "text-[10px] uppercase tracking-wider text-cyan-300 flex items-center gap-1", children: insightMut.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : "Refresh" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground/80 mt-1 leading-relaxed", children: insightText }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 mt-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-white/[0.04] border border-white/[0.06] p-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase tracking-wider text-muted-foreground", children: "Score" }),
              /* @__PURE__ */ jsx("p", { className: "text-base font-bold tabular-nums text-emerald-300", children: nutritionScore })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-white/[0.04] border border-white/[0.06] p-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase tracking-wider text-muted-foreground", children: "Protein left" }),
              /* @__PURE__ */ jsxs("p", { className: "text-base font-bold tabular-nums text-rose-300", children: [
                proteinRemaining,
                "g"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-white/[0.04] border border-white/[0.06] p-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase tracking-wider text-muted-foreground", children: "Cal left" }),
              /* @__PURE__ */ jsx("p", { className: "text-base font-bold tabular-nums text-amber-300", children: calRemaining })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Link, { to: "/scan", className: "mt-3 inline-flex items-center gap-2 text-xs font-semibold text-cyan-200", children: [
            "Get next-step meal ",
            /* @__PURE__ */ jsx(ChevronRight, { className: "h-3.5 w-3.5" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "animate-slide-up", style: {
      animationDelay: ".3s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-1 mb-2", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Flame, { className: "h-4 w-4 text-orange-300" }),
          " Today's fuel"
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/diet", className: "text-[11px] text-cyan-300", children: "See all" })
      ] }),
      data.recentFoods.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-5 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.4)] animate-pulse", children: /* @__PURE__ */ jsx(Camera, { className: "h-6 w-6 text-white" }) }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold mt-3", children: "Your transformation starts with one scan" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Snap a meal to unlock +25 XP and a personalized macro breakdown." }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-3 gap-2 text-left", children: suggestions.map((s) => /* @__PURE__ */ jsxs(Link, { to: "/scan", className: "rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2.5 hover:bg-white/[0.06] transition-colors", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xl", children: s.emoji }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] font-medium truncate mt-1", children: s.name }),
          /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground tabular-nums", children: [
            s.kcal,
            " kcal · ",
            s.p,
            "g P"
          ] })
        ] }, s.name)) }),
        /* @__PURE__ */ jsxs(Link, { to: "/scan", className: "mt-4 inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 text-white font-semibold py-3 text-sm shadow-[0_0_24px_rgba(139,92,246,0.45)]", children: [
          /* @__PURE__ */ jsx(Camera, { className: "h-4 w-4" }),
          " Scan your first meal"
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: data.recentFoods.map((f) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-3.5 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-400/30 to-violet-500/30 flex items-center justify-center text-lg", children: "🍽️" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium truncate", children: f.name }),
          /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground capitalize", children: f.meal_type })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold tabular-nums", children: f.calories }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: "kcal" })
        ] })
      ] }, f.id)) })
    ] }),
    targetW > 0 && /* @__PURE__ */ jsxs("section", { className: "relative rounded-3xl border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.08] via-white/[0.02] to-cyan-500/[0.06] backdrop-blur-xl p-5 overflow-hidden animate-slide-up", style: {
      animationDelay: ".35s"
    }, children: [
      /* @__PURE__ */ jsx("div", { className: "absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" }),
      /* @__PURE__ */ jsxs("div", { className: "relative flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_24px_rgba(52,211,153,0.45)]", children: /* @__PURE__ */ jsx(TrendingUp, { className: "h-6 w-6 text-white" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground", children: "Transformation" }),
          /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold mt-0.5", children: [
            transformPct,
            "% toward ",
            targetW,
            "kg"
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground", children: [
            daysLeft,
            "d left · Week ",
            weekNum,
            " of 12"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Link, { to: "/profile", className: "text-cyan-300", children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-5 w-5" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 h-2 rounded-full bg-white/5 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full transition-[width] duration-1000", style: {
        width: `${transformPct}%`,
        background: "linear-gradient(90deg,#34d399,#22d3ee,#a78bfa)"
      } }) })
    ] })
  ] });
}
export {
  Home as component
};
