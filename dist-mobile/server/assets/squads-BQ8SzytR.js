import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { u as useServerFn } from "./router-D-2d6VGp.js";
import { l as listMySquads, c as createSquad, j as joinSquadByCode } from "./squad.functions-BwqOTUym.js";
import { ArrowLeft, Plus, ChevronRight, Lock, Users, Calendar, Gift, Trophy, Sparkles, Globe, Crown, Target } from "lucide-react";
import { toast } from "sonner";
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
const CHALLENGES = [{
  id: "weight_loss",
  label: "Weight Loss",
  emoji: "⚖️"
}, {
  id: "muscle_gain",
  label: "Muscle Gain",
  emoji: "💪"
}, {
  id: "steps",
  label: "Steps",
  emoji: "🏃"
}, {
  id: "healthy_eating",
  label: "Healthy Eating",
  emoji: "🥗"
}, {
  id: "workout",
  label: "Workout",
  emoji: "🏋️"
}, {
  id: "hydration",
  label: "Hydration",
  emoji: "💧"
}, {
  id: "sleep",
  label: "Sleep",
  emoji: "😴"
}, {
  id: "custom",
  label: "Custom",
  emoji: "✨"
}];
function SquadsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listMySquads);
  const {
    data: squads = []
  } = useQuery({
    queryKey: ["squads"],
    queryFn: () => list()
  });
  const [mode, setMode] = useState("none");
  const [name, setName] = useState("");
  const [challenge, setChallenge] = useState("workout");
  const [customChallenge, setCustomChallenge] = useState("");
  const [goal, setGoal] = useState("");
  const [period, setPeriod] = useState("weekly");
  const [visibility, setVisibility] = useState("private");
  const [maxMembers, setMaxMembers] = useState(10);
  const [reward, setReward] = useState("coupon");
  const [code, setCode] = useState("");
  const createFn = useServerFn(createSquad);
  const joinFn = useServerFn(joinSquadByCode);
  const createMut = useMutation({
    mutationFn: () => createFn({
      data: {
        name: name.trim(),
        challenge_type: challenge,
        custom_challenge: challenge === "custom" ? customChallenge.trim() : null,
        goal_description: goal.trim() || null,
        period
      }
    }),
    onSuccess: (s) => {
      toast.success("Squad ready!");
      qc.invalidateQueries({
        queryKey: ["squads"]
      });
      navigate({
        to: "/squads/$squadId",
        params: {
          squadId: s.id
        }
      });
    },
    onError: (e) => toast.error(e.message ?? "Failed")
  });
  const joinMut = useMutation({
    mutationFn: () => joinFn({
      data: {
        code: code.trim()
      }
    }),
    onSuccess: (r) => {
      toast.success("Joined!");
      qc.invalidateQueries({
        queryKey: ["squads"]
      });
      navigate({
        to: "/squads/$squadId",
        params: {
          squadId: r.squad_id
        }
      });
    },
    onError: (e) => toast.error(e.message ?? "Invalid code")
  });
  return /* @__PURE__ */ jsxs("div", { className: "px-5 pt-12 pb-28 space-y-5 relative", children: [
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" }),
    /* @__PURE__ */ jsxs("header", { className: "flex items-center gap-3 animate-slide-up", children: [
      /* @__PURE__ */ jsx(Link, { to: "/home", className: "h-9 w-9 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground", children: "Community" }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Squad Challenges" })
      ] })
    ] }),
    mode === "none" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("section", { className: "animate-slide-up", children: /* @__PURE__ */ jsxs("button", { onClick: () => setMode("create"), className: "group relative w-full overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.14] via-white/[0.02] to-cyan-500/[0.10] p-5 text-left shadow-[0_20px_60px_-30px_rgba(52,211,153,0.55)] backdrop-blur-2xl", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-14 -right-10 h-40 w-40 rounded-full bg-emerald-400/25 blur-3xl" }),
        /* @__PURE__ */ jsx("div", { className: "absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" }),
        /* @__PURE__ */ jsxs("div", { className: "relative flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_28px_rgba(52,211,153,0.55)]", children: /* @__PURE__ */ jsx(Plus, { className: "h-6 w-6 text-black" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.22em] text-emerald-300 font-semibold", children: "Premium" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", children: "Create your squad" }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Public or private · pick rewards, member limits & duration" })
          ] }),
          /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-emerald-300" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "relative mt-4 grid grid-cols-4 gap-2", children: [{
          icon: /* @__PURE__ */ jsx(Lock, { className: "h-3.5 w-3.5 text-emerald-300" }),
          l: "Private"
        }, {
          icon: /* @__PURE__ */ jsx(Users, { className: "h-3.5 w-3.5 text-cyan-300" }),
          l: "Limits"
        }, {
          icon: /* @__PURE__ */ jsx(Calendar, { className: "h-3.5 w-3.5 text-fuchsia-300" }),
          l: "Duration"
        }, {
          icon: /* @__PURE__ */ jsx(Gift, { className: "h-3.5 w-3.5 text-amber-300" }),
          l: "Rewards"
        }].map((r) => /* @__PURE__ */ jsx("div", { className: "rounded-xl bg-black/30 border border-white/[0.06] px-1.5 py-2 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
          r.icon,
          /* @__PURE__ */ jsx("span", { className: "text-[9px] uppercase tracking-widest text-muted-foreground", children: r.l })
        ] }) }, r.l)) })
      ] }) }),
      /* @__PURE__ */ jsx("section", { className: "animate-slide-up", style: {
        animationDelay: ".05s"
      }, children: /* @__PURE__ */ jsxs("button", { onClick: () => setMode("join"), className: "w-full rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-4 text-left flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-2xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center", children: /* @__PURE__ */ jsx(Users, { className: "h-5 w-5 text-cyan-300" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Join with invite code" }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground", children: "Got a FIT-XXXXXX code from a friend?" })
        ] }),
        /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })
      ] }) }),
      /* @__PURE__ */ jsxs("section", { className: "animate-slide-up", style: {
        animationDelay: ".1s"
      }, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-1 mb-2", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Trophy, { className: "h-4 w-4 text-amber-300" }),
            " My squads"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] text-muted-foreground tabular-nums", children: squads.length })
        ] }),
        squads.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center animate-pulse", children: /* @__PURE__ */ jsx(Sparkles, { className: "h-6 w-6 text-white" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold mt-3", children: "Start your first squad" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Compete weekly, earn coupons, Platinum days, and badges." })
        ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: squads.map((s) => {
          const done = s.finalized_at || new Date(s.ends_at) < /* @__PURE__ */ new Date();
          const daysLeft = Math.max(0, Math.ceil((new Date(s.ends_at).getTime() - Date.now()) / 864e5));
          return /* @__PURE__ */ jsxs(Link, { to: "/squads/$squadId", params: {
            squadId: s.id
          }, className: "flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4", children: [
            /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 flex items-center justify-center text-xl", children: CHALLENGES.find((c) => c.id === s.challenge_type)?.emoji ?? "🏆" }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold truncate", children: s.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground capitalize", children: [
                s.period,
                " · ",
                s.challenge_type.replace("_", " ")
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-wider text-emerald-300", children: done ? "Ended" : `${daysLeft}d left` }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] font-mono text-muted-foreground mt-0.5", children: s.code })
            ] }),
            /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })
          ] }, s.id);
        }) })
      ] })
    ] }),
    mode === "create" && /* @__PURE__ */ jsxs("section", { className: "space-y-4 animate-slide-up", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Squad name" }),
          /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), maxLength: 60, placeholder: "Iron Circle", className: "mt-1 w-full rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-3 text-sm focus:outline-none focus:border-emerald-400/40" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Challenge type" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 grid grid-cols-4 gap-2", children: CHALLENGES.map((c) => /* @__PURE__ */ jsxs("button", { onClick: () => setChallenge(c.id), className: `rounded-2xl p-2.5 text-center border transition-all ${challenge === c.id ? "border-emerald-400/50 bg-emerald-500/[0.12] shadow-[0_0_18px_rgba(52,211,153,0.25)]" : "border-white/[0.06] bg-white/[0.02]"}`, children: [
            /* @__PURE__ */ jsx("div", { className: "text-lg", children: c.emoji }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] mt-0.5 leading-tight", children: c.label })
          ] }, c.id)) })
        ] }),
        challenge === "custom" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Custom challenge" }),
          /* @__PURE__ */ jsx("input", { value: customChallenge, onChange: (e) => setCustomChallenge(e.target.value), maxLength: 80, placeholder: "e.g. No sugar week", className: "mt-1 w-full rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-3 text-sm focus:outline-none focus:border-emerald-400/40" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Goal (optional)" }),
          /* @__PURE__ */ jsx("input", { value: goal, onChange: (e) => setGoal(e.target.value), maxLength: 200, placeholder: "Lose 2kg / 70k steps / 5 workouts", className: "mt-1 w-full rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-3 text-sm focus:outline-none focus:border-emerald-400/40" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Duration" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 grid grid-cols-2 gap-2", children: ["weekly", "monthly"].map((p) => /* @__PURE__ */ jsxs("button", { onClick: () => setPeriod(p), className: `rounded-2xl py-3 text-sm capitalize border flex items-center justify-center gap-2 ${period === p ? "border-emerald-400/50 bg-emerald-500/[0.12] shadow-[0_0_18px_rgba(52,211,153,0.25)]" : "border-white/[0.06] bg-white/[0.02]"}`, children: [
            /* @__PURE__ */ jsx(Calendar, { className: "h-3.5 w-3.5" }),
            " ",
            p === "weekly" ? "7 days" : "30 days"
          ] }, p)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Visibility" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 grid grid-cols-2 gap-2", children: [{
            id: "private",
            icon: /* @__PURE__ */ jsx(Lock, { className: "h-3.5 w-3.5" }),
            l: "Private",
            d: "Invite-only"
          }, {
            id: "public",
            icon: /* @__PURE__ */ jsx(Globe, { className: "h-3.5 w-3.5" }),
            l: "Public",
            d: "Anyone with code"
          }].map((v) => /* @__PURE__ */ jsxs("button", { onClick: () => setVisibility(v.id), className: `rounded-2xl py-2.5 px-3 text-left border ${visibility === v.id ? "border-emerald-400/50 bg-emerald-500/[0.12]" : "border-white/[0.06] bg-white/[0.02]"}`, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs font-semibold", children: [
              v.icon,
              v.l
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: v.d })
          ] }, v.id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { children: "Member limit" }),
            /* @__PURE__ */ jsx("span", { className: "text-emerald-300 font-mono tabular-nums", children: maxMembers })
          ] }),
          /* @__PURE__ */ jsx("input", { type: "range", min: 2, max: 50, value: maxMembers, onChange: (e) => setMaxMembers(Number(e.target.value)), className: "mt-2 w-full accent-emerald-400" }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[9px] text-muted-foreground mt-1", children: [
            /* @__PURE__ */ jsx("span", { children: "2" }),
            /* @__PURE__ */ jsx("span", { children: "50" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Reward" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 grid grid-cols-3 gap-2", children: [{
            id: "coupon",
            icon: /* @__PURE__ */ jsx(Gift, { className: "h-4 w-4 text-amber-300" }),
            l: "Coupon"
          }, {
            id: "platinum",
            icon: /* @__PURE__ */ jsx(Crown, { className: "h-4 w-4 text-fuchsia-300" }),
            l: "Platinum"
          }, {
            id: "badge",
            icon: /* @__PURE__ */ jsx(Trophy, { className: "h-4 w-4 text-cyan-300" }),
            l: "Badge"
          }].map((r) => /* @__PURE__ */ jsxs("button", { onClick: () => setReward(r.id), className: `rounded-2xl py-2.5 border flex flex-col items-center gap-1 ${reward === r.id ? "border-emerald-400/50 bg-emerald-500/[0.12]" : "border-white/[0.06] bg-white/[0.02]"}`, children: [
            r.icon,
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-medium", children: r.l })
          ] }, r.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setMode("none"), className: "rounded-2xl py-3 border border-white/[0.06] bg-white/[0.03] text-sm", children: "Cancel" }),
        /* @__PURE__ */ jsx("button", { onClick: () => createMut.mutate(), disabled: createMut.isPending || name.trim().length < 2, className: "rounded-2xl py-3 text-sm font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 text-black shadow-[0_0_24px_rgba(52,211,153,0.4)] disabled:opacity-50", children: createMut.isPending ? "Creating…" : "Create squad" })
      ] })
    ] }),
    mode === "join" && /* @__PURE__ */ jsxs("section", { className: "space-y-4 animate-slide-up", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5", children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Invite code" }),
        /* @__PURE__ */ jsx("input", { value: code, onChange: (e) => setCode(e.target.value.toUpperCase()), maxLength: 12, placeholder: "ABC123", className: "mt-1 w-full rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-4 text-lg font-mono tracking-widest text-center focus:outline-none focus:border-emerald-400/40" }),
        /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Target, { className: "h-3 w-3" }),
          " 6 characters, letters + numbers"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setMode("none"), className: "rounded-2xl py-3 border border-white/[0.06] bg-white/[0.03] text-sm", children: "Cancel" }),
        /* @__PURE__ */ jsx("button", { onClick: () => joinMut.mutate(), disabled: joinMut.isPending || code.trim().length < 4, className: "rounded-2xl py-3 text-sm font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 text-black shadow-[0_0_24px_rgba(52,211,153,0.4)] disabled:opacity-50", children: joinMut.isPending ? "Joining…" : "Join squad" })
      ] })
    ] })
  ] });
}
export {
  SquadsPage as component
};
