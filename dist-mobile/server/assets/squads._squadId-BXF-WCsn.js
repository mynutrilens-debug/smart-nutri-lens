import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { a as Route, u as useServerFn } from "./router-D-2d6VGp.js";
import { g as getSquadLeaderboard, f as finalizeSquad, a as leaveSquad } from "./squad.functions-BwqOTUym.js";
import { Loader2, ArrowLeft, Copy, Share2, Users, Trophy, Sparkles, Flame, LogOut, Crown, Medal, Award } from "lucide-react";
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
function SquadDetail() {
  const {
    squadId
  } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const board = useServerFn(getSquadLeaderboard);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["squad", squadId],
    queryFn: () => board({
      data: {
        squad_id: squadId
      }
    }),
    refetchInterval: 3e4
  });
  const finalizeFn = useServerFn(finalizeSquad);
  const leaveFn = useServerFn(leaveSquad);
  const finalizeMut = useMutation({
    mutationFn: () => finalizeFn({
      data: {
        squad_id: squadId
      }
    }),
    onSuccess: (r) => {
      toast.success(r.youWon ? "🏆 You placed on the podium!" : "Rewards distributed");
      qc.invalidateQueries({
        queryKey: ["squad", squadId]
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const leaveMut = useMutation({
    mutationFn: () => leaveFn({
      data: {
        squad_id: squadId
      }
    }),
    onSuccess: () => {
      toast.success("Left squad");
      qc.invalidateQueries({
        queryKey: ["squads"]
      });
      navigate({
        to: "/squads"
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const squad = data?.squad;
  const leaderboard = data?.leaderboard ?? [];
  const me = data?.me;
  const rewards = data?.rewards ?? [];
  const now = Date.now();
  const endMs = squad ? new Date(squad.ends_at).getTime() : 0;
  const startMs = squad ? new Date(squad.starts_at).getTime() : 0;
  const totalMs = Math.max(1, endMs - startMs);
  const elapsedPct = Math.min(100, Math.max(0, (now - startMs) / totalMs * 100));
  const daysLeft = Math.max(0, Math.ceil((endMs - now) / 864e5));
  const isEnded = squad ? new Date(squad.ends_at) < /* @__PURE__ */ new Date() : false;
  const finalized = !!squad?.finalized_at;
  useEffect(() => {
    if (isEnded && !finalized && !finalizeMut.isPending) finalizeMut.mutate();
  }, [isEnded, finalized]);
  const shareLink = useMemo(() => {
    if (!squad || typeof window === "undefined") return "";
    return `${window.location.origin}/squads/join/${squad.code}`;
  }, [squad]);
  const copyCode = () => {
    if (squad) {
      navigator.clipboard.writeText(squad.code);
      toast.success("Code copied");
    }
  };
  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Invite link copied");
  };
  const doShare = async () => {
    if (!squad) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my squad: ${squad.name}`,
          text: `Compete with me on MyNutriLens · Code ${squad.code}`,
          url: shareLink
        });
      } catch {
      }
    } else copyLink();
  };
  if (isLoading || !squad) {
    return /* @__PURE__ */ jsx("div", { className: "app-shell flex items-center justify-center pt-24", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-emerald-300" }) });
  }
  const rankIcon = (i) => i === 0 ? /* @__PURE__ */ jsx(Crown, { className: "h-4 w-4 text-amber-300" }) : i === 1 ? /* @__PURE__ */ jsx(Medal, { className: "h-4 w-4 text-slate-300" }) : i === 2 ? /* @__PURE__ */ jsx(Award, { className: "h-4 w-4 text-orange-300" }) : null;
  return /* @__PURE__ */ jsxs("div", { className: "px-5 pt-12 pb-28 space-y-5 relative", children: [
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" }),
    /* @__PURE__ */ jsxs("header", { className: "flex items-center gap-3 animate-slide-up", children: [
      /* @__PURE__ */ jsx(Link, { to: "/squads", className: "h-9 w-9 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground capitalize", children: [
          squad.period,
          " · ",
          squad.challenge_type.replace("_", " ")
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight truncate", children: squad.name })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "relative rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.08] via-white/[0.02] to-cyan-500/[0.06] backdrop-blur-xl p-5 animate-slide-up", style: {
      animationDelay: ".05s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground", children: "Invite code" }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-mono font-bold tracking-widest text-emerald-200 mt-1", children: squad.code })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: copyCode, className: "h-10 w-10 rounded-2xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center", children: /* @__PURE__ */ jsx(Copy, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { onClick: doShare, className: "h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_18px_rgba(52,211,153,0.4)]", children: /* @__PURE__ */ jsx(Share2, { className: "h-4 w-4 text-black" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between text-[11px] text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Users, { className: "h-3 w-3" }),
          " ",
          leaderboard.length,
          " member",
          leaderboard.length === 1 ? "" : "s"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "tabular-nums text-emerald-300", children: finalized ? "Finalized" : isEnded ? "Ended" : `${daysLeft}d left` })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-[width] duration-1000", style: {
        width: `${elapsedPct}%`
      } }) })
    ] }),
    me && /* @__PURE__ */ jsx("section", { className: "animate-slide-up", style: {
      animationDelay: ".1s"
    }, children: /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground", children: "Your rank" }),
          /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold mt-0.5", children: [
            "#",
            leaderboard.findIndex((l) => l.user_id === me.user_id) + 1,
            " ",
            /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground font-normal", children: [
              "of ",
              leaderboard.length
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground", children: "Points" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold tabular-nums text-emerald-300", children: me.points })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 grid grid-cols-4 gap-2", children: [{
        label: "Meals",
        val: me.breakdown.meals
      }, {
        label: "Workouts",
        val: me.breakdown.workouts
      }, {
        label: "Steps",
        val: me.breakdown.steps
      }, {
        label: "Streak",
        val: me.breakdown.streak
      }].map((s) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2 text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase tracking-wider text-muted-foreground", children: s.label }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-bold tabular-nums text-emerald-200 mt-0.5", children: s.val })
      ] }, s.label)) })
    ] }) }),
    finalized && rewards.length > 0 && /* @__PURE__ */ jsxs("section", { className: "rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.1] via-white/[0.02] to-orange-500/[0.06] backdrop-blur-xl p-5 animate-slide-up", style: {
      animationDelay: ".15s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ jsx(Trophy, { className: "h-4 w-4 text-amber-300" }),
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold", children: "Podium & prizes" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: [...rewards].sort((a, b) => a.rank - b.rank).map((r) => {
        const winner = leaderboard.find((l) => l.user_id === r.user_id);
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center font-bold text-black", children: [
            "#",
            r.rank
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold truncate", children: winner?.display_name ?? "Athlete" }),
            /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground", children: [
              "+",
              r.platinum_days,
              "d Platinum · +",
              r.xp_bonus,
              " XP · ",
              r.badge
            ] })
          ] }),
          r.coupon_code && /* @__PURE__ */ jsx("button", { onClick: () => {
            navigator.clipboard.writeText(r.coupon_code);
            toast.success("Coupon copied");
          }, className: "rounded-xl bg-white/[0.06] border border-white/[0.06] px-2.5 py-1.5 text-[10px] font-mono", children: r.coupon_code })
        ] }, r.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "animate-slide-up", style: {
      animationDelay: ".2s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-1 mb-2", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Trophy, { className: "h-4 w-4 text-amber-300" }),
          " Leaderboard"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "Live · updates every 30s" })
      ] }),
      leaderboard.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6 text-center", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-6 w-6 text-emerald-300 mx-auto" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold mt-2", children: "No members yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Share your invite code to fill the roster." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: leaderboard.map((row, i) => {
        const isMe = me && row.user_id === me.user_id;
        return /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-3 rounded-2xl border p-3.5 backdrop-blur-xl transition-all ${isMe ? "border-emerald-400/40 bg-emerald-500/[0.08] shadow-[0_0_20px_rgba(52,211,153,0.15)]" : "border-white/[0.06] bg-white/[0.03]"}`, children: [
          /* @__PURE__ */ jsx("div", { className: `h-10 w-10 rounded-xl flex items-center justify-center font-bold tabular-nums ${i === 0 ? "bg-gradient-to-br from-amber-400 to-orange-400 text-black shadow-[0_0_16px_rgba(251,191,36,0.5)]" : i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-black" : i === 2 ? "bg-gradient-to-br from-orange-500 to-orange-700 text-white" : "bg-white/[0.06] text-foreground/70"}`, children: i < 3 ? rankIcon(i) : `#${i + 1}` }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold truncate", children: [
              row.display_name,
              isMe && /* @__PURE__ */ jsx("span", { className: "text-[10px] ml-1.5 text-emerald-300", children: "(you)" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-muted-foreground flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Flame, { className: "h-3 w-3 text-orange-300" }),
              " ",
              row.streak_days,
              "d active · ",
              row.breakdown.workouts / 30 | 0,
              " workouts"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-base font-bold tabular-nums text-emerald-300", children: row.points }),
            /* @__PURE__ */ jsx("p", { className: "text-[9px] uppercase tracking-wider text-muted-foreground", children: "points" })
          ] })
        ] }, row.user_id);
      }) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "animate-slide-up", style: {
      animationDelay: ".25s"
    }, children: /* @__PURE__ */ jsxs("button", { onClick: () => leaveMut.mutate(), disabled: leaveMut.isPending, className: "w-full rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] text-rose-300 py-3 text-sm font-medium flex items-center justify-center gap-2", children: [
      /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" }),
      " ",
      leaveMut.isPending ? "Leaving…" : "Leave squad"
    ] }) })
  ] });
}
export {
  SquadDetail as component
};
