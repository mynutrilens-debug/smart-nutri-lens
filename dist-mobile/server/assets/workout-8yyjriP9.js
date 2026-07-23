import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { w as workoutsQuery, d as dashboardQuery, g as generateAiWorkout, l as logWorkout, a as deleteWorkout } from "./queries-DQC1c2F_.js";
import { Dumbbell, Heart, Flame, Wind, Activity, Trophy, Brain, Sparkles, TrendingUp, Zap, Play, X, Loader2, Check, Lightbulb, Medal, Timer, Award, History, Trash2, RotateCcw, SkipForward, Plus, ChevronDown, Crosshair, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import "./router-D-2d6VGp.js";
import "@tanstack/react-router";
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
const types = [{
  key: "strength",
  label: "Strength",
  icon: Dumbbell,
  color: "oklch(0.84 0.18 145)",
  est: 8
}, {
  key: "cardio",
  label: "Cardio",
  icon: Heart,
  color: "oklch(0.7 0.22 25)",
  est: 10
}, {
  key: "hiit",
  label: "HIIT",
  icon: Flame,
  color: "oklch(0.82 0.18 50)",
  est: 13
}, {
  key: "yoga",
  label: "Yoga",
  icon: Wind,
  color: "oklch(0.74 0.22 295)",
  est: 4
}, {
  key: "mobility",
  label: "Mobility",
  icon: Activity,
  color: "oklch(0.7 0.15 220)",
  est: 3
}, {
  key: "sports",
  label: "Sports",
  icon: Trophy,
  color: "oklch(0.78 0.18 60)",
  est: 9
}];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const todayIdx = () => ((/* @__PURE__ */ new Date()).getDay() + 6) % 7;
const NEON = "oklch(0.84 0.20 145)";
const NEON_SOFT = "oklch(0.84 0.20 145 / 15%)";
function difficultyTone(d) {
  switch ((d || "").toLowerCase()) {
    case "easy":
      return {
        label: "Easy",
        bg: "oklch(0.7 0.18 150 / 18%)",
        fg: "oklch(0.84 0.18 145)"
      };
    case "hard":
      return {
        label: "Hard",
        bg: "oklch(0.7 0.22 25 / 18%)",
        fg: "oklch(0.78 0.2 25)"
      };
    default:
      return {
        label: "Moderate",
        bg: "oklch(0.78 0.18 210 / 18%)",
        fg: "oklch(0.82 0.16 210)"
      };
  }
}
function ytUrl(name) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " proper form tutorial")}`;
}
function inferMuscles(name, focus) {
  const n = (name + " " + (focus || "")).toLowerCase();
  const map = [[/bench|push[- ]?up|chest|fly/i, ["Chest", "Triceps", "Shoulders"]], [/squat|lunge|leg press|step[- ]?up/i, ["Quads", "Glutes", "Hamstrings"]], [/deadlift|rdl|romanian/i, ["Hamstrings", "Glutes", "Back"]], [/row|pull[- ]?up|lat|pulldown/i, ["Back", "Biceps"]], [/curl/i, ["Biceps", "Forearms"]], [/tricep|dip|skull/i, ["Triceps"]], [/shoulder|press|lateral|delt/i, ["Shoulders", "Triceps"]], [/plank|crunch|ab|core|russian/i, ["Core", "Abs"]], [/calf|raise/i, ["Calves"]], [/glute|hip thrust|bridge/i, ["Glutes", "Hamstrings"]], [/burpee|jumping|mountain|hiit|jump/i, ["Full Body", "Cardio"]], [/run|jog|bike|cycl|row(ing)?|ellipt/i, ["Cardio", "Legs"]], [/stretch|mobility|yoga|cobra|child/i, ["Mobility"]]];
  for (const [re, m] of map) if (re.test(n)) return m;
  return ["Full Body"];
}
function Workout() {
  const {
    data: workouts
  } = useSuspenseQuery(workoutsQuery);
  const {
    data: dash
  } = useSuspenseQuery(dashboardQuery);
  const qc = useQueryClient();
  const profile = dash.profile ?? {};
  const aiPlan = profile.ai_plan?.workout_plan;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = /* @__PURE__ */ new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekly = workouts.filter((w) => new Date(w.logged_at) >= weekAgo);
  const todays = workouts.filter((w) => new Date(w.logged_at) >= today);
  const totalMin = weekly.reduce((a, w) => a + w.duration_min, 0);
  const totalKcal = weekly.reduce((a, w) => a + w.calories_burned, 0);
  const weeklyGoal = 150;
  const heightM = (profile.height_cm ?? 170) / 100;
  const bmi = +((profile.weight_kg ?? 70) / (heightM * heightM)).toFixed(1);
  const streak = useMemo(() => {
    const set = new Set(workouts.map((w) => new Date(w.logged_at).toDateString()));
    let s = 0;
    const d = /* @__PURE__ */ new Date();
    if (!set.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (set.has(d.toDateString())) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, [workouts]);
  const prs = useMemo(() => {
    const longest = workouts.reduce((m, w) => Math.max(m, w.duration_min), 0);
    const hottest = workouts.reduce((m, w) => Math.max(m, w.calories_burned), 0);
    const byWeek = /* @__PURE__ */ new Map();
    workouts.forEach((w) => {
      const d = new Date(w.logged_at);
      const y = d.getFullYear();
      const oneJan = new Date(y, 0, 1);
      const wk = Math.ceil(((+d - +oneJan) / 864e5 + oneJan.getDay() + 1) / 7);
      const k = `${y}-${wk}`;
      byWeek.set(k, (byWeek.get(k) ?? 0) + 1);
    });
    const bestWeek = [...byWeek.values()].reduce((a, b) => Math.max(a, b), 0);
    return {
      longest,
      hottest,
      bestWeek,
      total: workouts.length
    };
  }, [workouts]);
  const lastPerf = (exName) => {
    const prev = workouts.find((w) => (w.name || "").toLowerCase().includes(exName.toLowerCase()));
    return prev ? new Date(prev.logged_at) : null;
  };
  const [aiOpen, setAiOpen] = useState(false);
  const [level, setLevel] = useState("intermediate");
  const [equipment, setEquipment] = useState("home");
  const [injuries, setInjuries] = useState("");
  const gen = useMutation({
    mutationFn: () => generateAiWorkout({
      data: {
        level,
        equipment,
        injuries: injuries.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10)
      }
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
      toast.success("Your AI plan is ready");
      setAiOpen(false);
    },
    onError: (e) => toast.error(e.message ?? "Failed to generate plan")
  });
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("strength");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const add = useMutation({
    mutationFn: () => {
      const meta = types.find((t) => t.key === type);
      return logWorkout({
        data: {
          name: name || meta.label,
          workout_type: type,
          duration_min: duration,
          calories_burned: Math.round(duration * meta.est)
        }
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["workouts"]
      });
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
      toast.success("Workout logged");
      setOpen(false);
      setName("");
      setDuration(30);
    },
    onError: (e) => toast.error(e.message)
  });
  const del = useMutation({
    mutationFn: (id) => deleteWorkout({
      data: {
        id
      }
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["workouts"]
      });
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
    }
  });
  const [selectedDay, setSelectedDay] = useState(todayIdx());
  const todayPlan = aiPlan?.days?.[selectedDay];
  const exercises = todayPlan?.exercises ?? [];
  const planGenAt = aiPlan?.generated_at ? new Date(aiPlan.generated_at).getTime() : 0;
  const msSinceGen = planGenAt ? Date.now() - planGenAt : Infinity;
  const daysUntilReplan = Math.max(0, Math.ceil((7 * 864e5 - msSinceGen) / 864e5));
  const canReplan = !aiPlan || daysUntilReplan === 0;
  const [session, setSession] = useState(null);
  const [expanded, setExpanded] = useState({
    0: true
  });
  const [rest, setRest] = useState(null);
  const [weights, setWeights] = useState({});
  const [loggedEx, setLoggedEx] = useState({});
  const setWeight = (exIdx, setIdx, val) => setWeights((w) => ({
    ...w,
    [`${exIdx}:${setIdx}`]: val
  }));
  const estimateExerciseKcal = (ex, exIdx) => {
    const setCount = Number(ex.sets) || 3;
    const repsNum = parseInt(String(ex.reps).match(/\d+/)?.[0] ?? "10", 10) || 10;
    const bw = Number(profile.weight_kg) || 70;
    let volume = 0;
    for (let s = 0; s < setCount; s++) {
      const kg = parseFloat(weights[`${exIdx}:${s}`] || "");
      if (!isNaN(kg) && kg > 0) {
        volume += kg * repsNum;
      }
    }
    const base = setCount * 4 + Math.round(bw * 0.04 * setCount);
    const load = Math.round(volume * 0.05);
    return Math.max(8, base + load);
  };
  const estimateExerciseMin = (ex) => {
    const setCount = Number(ex.sets) || 3;
    const rest_sec = Number(ex.rest_sec) || 60;
    return Math.max(1, Math.round(setCount * (30 + rest_sec) / 60));
  };
  const logExMut = useMutation({
    mutationFn: (payload) => logWorkout({
      data: {
        name: payload.name,
        workout_type: "strength",
        duration_min: payload.duration_min,
        calories_burned: payload.calories_burned
      }
    }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["workouts"]
      });
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
      toast.success(`Logged · ${vars.calories_burned} kcal 🔥`);
    },
    onError: (e) => toast.error(e.message ?? "Failed to log")
  });
  const logExercise = (ex, exIdx) => {
    const kcal = estimateExerciseKcal(ex, exIdx);
    const mins = estimateExerciseMin(ex);
    logExMut.mutate({
      name: ex.name,
      duration_min: mins,
      calories_burned: kcal
    });
    setLoggedEx((l) => ({
      ...l,
      [exIdx]: true
    }));
  };
  useEffect(() => {
    if (!rest) return;
    if (rest.remaining <= 0) {
      setRest(null);
      toast.success("Rest done — next set 💪");
      return;
    }
    const t = setTimeout(() => setRest((r) => r ? {
      ...r,
      remaining: r.remaining - 1
    } : null), 1e3);
    return () => clearTimeout(t);
  }, [rest]);
  const totalSets = useMemo(() => exercises.reduce((a, e) => a + (Number(e.sets) || 1), 0), [exercises]);
  const doneSets = useMemo(() => session ? Object.values(session.completed).filter(Boolean).length : 0, [session]);
  const progressPct = totalSets ? Math.min(100, doneSets / totalSets * 100) : 0;
  const startSession = () => {
    setSession({
      startedAt: Date.now(),
      completed: {}
    });
    setExpanded({
      0: true
    });
    toast.success("Workout started — let's go!");
  };
  const toggleSet = (exIdx, setIdx, rest_sec) => {
    if (!session) return;
    const k = `${exIdx}:${setIdx}`;
    const wasDone = session.completed[k];
    setSession((s) => s ? {
      ...s,
      completed: {
        ...s.completed,
        [k]: !wasDone
      }
    } : s);
    if (!wasDone && rest_sec) setRest({
      remaining: rest_sec,
      total: rest_sec
    });
  };
  const finishMut = useMutation({
    mutationFn: () => {
      if (!session || !todayPlan) throw new Error("No active session");
      const elapsedMin = Math.max(1, Math.round((Date.now() - session.startedAt) / 6e4));
      const ratio = totalSets ? doneSets / totalSets : 1;
      const kcal = Math.round((todayPlan.calories ?? elapsedMin * 8) * Math.max(0.4, ratio));
      const tk = ["strength", "cardio", "hiit", "yoga", "mobility", "sports"].includes(todayPlan.workout_type) ? todayPlan.workout_type : "strength";
      return logWorkout({
        data: {
          name: todayPlan.focus || "Workout",
          workout_type: tk,
          duration_min: elapsedMin,
          calories_burned: kcal
        }
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["workouts"]
      });
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
      toast.success("Great work — session saved 🔥");
      setSession(null);
      setRest(null);
    },
    onError: (e) => toast.error(e.message)
  });
  const elapsedLabel = useTicker(session?.startedAt);
  return /* @__PURE__ */ jsxs("div", { className: "px-5 pt-12 pb-32 space-y-5", children: [
    /* @__PURE__ */ jsxs("header", { className: "relative overflow-hidden rounded-[28px] p-5 animate-slide-up", style: {
      background: "linear-gradient(150deg, oklch(0.16 0.03 155), oklch(0.10 0.02 160))",
      border: "1px solid oklch(0.84 0.20 145 / 22%)",
      boxShadow: "0 0 60px -20px oklch(0.84 0.20 145 / 30%)"
    }, children: [
      /* @__PURE__ */ jsx("div", { className: "absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl opacity-50", style: {
        background: `radial-gradient(closest-side, ${NEON}, transparent)`
      } }),
      /* @__PURE__ */ jsxs("div", { className: "relative flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[oklch(0.84_0.20_145)]", children: [
            /* @__PURE__ */ jsx(Brain, { className: "h-3 w-3" }),
            " AI Trainer"
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "mt-1 text-[26px] font-black tracking-tight leading-tight", children: profile.display_name ? `Let's train, ${profile.display_name.split(" ")[0]}` : "Let's train" }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-[12px] text-muted-foreground line-clamp-2", children: aiPlan?.summary ?? "Tell me your level & gear — I'll build a smart split tuned to your goal." })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => canReplan && setAiOpen(true), disabled: !canReplan, title: canReplan ? "" : `Re-plan available in ${daysUntilReplan}d`, className: "shrink-0 h-10 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 text-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed", style: {
          background: `linear-gradient(135deg, ${NEON}, oklch(0.9 0.2 135))`,
          boxShadow: `0 8px 24px -6px ${NEON}`
        }, children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5" }),
          !aiPlan ? "Generate" : canReplan ? "Re-plan" : `Re-plan in ${daysUntilReplan}d`
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative mt-4 grid grid-cols-3 gap-2", children: [
        /* @__PURE__ */ jsx(Stat, { label: "Streak", value: `${streak}`, sub: "days", icon: Flame, accent: "oklch(0.82 0.18 50)" }),
        /* @__PURE__ */ jsx(Stat, { label: "This week", value: `${totalMin}`, sub: `/ ${weeklyGoal} min`, icon: TrendingUp, accent: NEON }),
        /* @__PURE__ */ jsx(Stat, { label: "Burned", value: `${totalKcal}`, sub: "kcal", icon: Zap, accent: "oklch(0.82 0.18 60)" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "relative mt-3", children: /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-white/[0.06] overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full transition-all duration-700", style: {
        width: `${Math.min(100, totalMin / weeklyGoal * 100)}%`,
        background: `linear-gradient(90deg, ${NEON}, oklch(0.92 0.2 130))`,
        boxShadow: `0 0 12px ${NEON}`
      } }) }) })
    ] }),
    aiPlan?.days?.length > 0 && /* @__PURE__ */ jsxs("section", { className: "animate-slide-up", style: {
      animationDelay: ".04s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-1 mb-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold", children: "Weekly split" }),
        /* @__PURE__ */ jsx("span", { className: "text-[11px] text-muted-foreground truncate max-w-[60%]", children: aiPlan.split_name })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 snap-x", children: aiPlan.days.map((d, i) => {
        const active = i === selectedDay;
        const isToday = i === todayIdx();
        const isRest = d.workout_type === "rest";
        return /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setSelectedDay(i), className: `snap-start shrink-0 w-[128px] text-left rounded-2xl p-3 border transition active:scale-[0.98]
                  ${active ? "border-[oklch(0.84_0.20_145/60%)] bg-[oklch(0.84_0.20_145/10%)]" : "border-white/[0.06] bg-white/[0.03]"}`, style: active ? {
          boxShadow: `0 0 20px -8px ${NEON}`
        } : void 0, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("span", { className: `text-[10px] uppercase tracking-widest ${active ? "text-[oklch(0.84_0.20_145)] font-bold" : "text-muted-foreground"}`, children: [
              d.day,
              isToday ? " •" : ""
            ] }),
            !isRest && /* @__PURE__ */ jsx(DifficultyBadge, { d: d.difficulty, compact: true })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-1.5 text-[13px] font-semibold leading-tight line-clamp-2", children: d.focus }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-[10px] text-muted-foreground tabular-nums", children: isRest ? "Rest day" : `${d.duration_min}m · ${d.calories}kcal` })
        ] }, i);
      }) })
    ] }),
    todayPlan ? /* @__PURE__ */ jsxs("section", { className: "animate-slide-up space-y-3", style: {
      animationDelay: ".08s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "relative rounded-[26px] p-5 overflow-hidden", style: {
        background: "linear-gradient(145deg, oklch(0.18 0.02 160), oklch(0.11 0.015 160))",
        border: "1px solid oklch(1 0 0 / 6%)"
      }, children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 h-[3px]", style: {
          background: `linear-gradient(90deg, transparent, ${NEON}, transparent)`
        } }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground", children: [
              DAYS[selectedDay],
              selectedDay === todayIdx() ? " · Today" : ""
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-2xl font-black leading-tight truncate", children: todayPlan.focus }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-center gap-2 flex-wrap text-[11px]", children: [
              /* @__PURE__ */ jsx(DifficultyBadge, { d: todayPlan.difficulty }),
              /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full bg-white/[0.05] text-muted-foreground capitalize", children: todayPlan.workout_type }),
              todayPlan.muscle_group && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full bg-white/[0.05] text-muted-foreground capitalize", children: String(todayPlan.muscle_group).replace("_", " ") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "text-3xl font-black tabular-nums", style: {
              color: NEON
            }, children: exercises.length }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground uppercase tracking-widest", children: "Exercises" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-3 gap-2", children: [
          /* @__PURE__ */ jsx(MetricTile, { label: "Duration", value: `${todayPlan.duration_min ?? 30}m` }),
          /* @__PURE__ */ jsx(MetricTile, { label: "Volume", value: `${totalSets} sets` }),
          /* @__PURE__ */ jsx(MetricTile, { label: "Est. burn", value: `${todayPlan.calories ?? 0} kcal`, accent: true })
        ] }),
        session && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-2xl p-3 border border-[oklch(0.84_0.20_145/25%)]", style: {
          background: `linear-gradient(135deg, ${NEON_SOFT}, transparent)`
        }, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 font-bold", style: {
              color: NEON
            }, children: [
              /* @__PURE__ */ jsxs("span", { className: "relative flex h-2 w-2", children: [
                /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", style: {
                  background: NEON
                } }),
                /* @__PURE__ */ jsx("span", { className: "relative inline-flex rounded-full h-2 w-2", style: {
                  background: NEON
                } })
              ] }),
              "Live · ",
              elapsedLabel
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "tabular-nums font-semibold", children: [
              doneSets,
              "/",
              totalSets,
              " sets"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 h-1.5 rounded-full bg-black/40 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full transition-all duration-500", style: {
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${NEON}, oklch(0.92 0.2 130))`,
            boxShadow: `0 0 10px ${NEON}`
          } }) })
        ] }),
        !session ? /* @__PURE__ */ jsxs("button", { onClick: startSession, className: "mt-4 w-full h-14 rounded-2xl font-black text-black text-base flex items-center justify-center gap-2 active:scale-[0.98] transition", style: {
          background: `linear-gradient(135deg, ${NEON}, oklch(0.92 0.2 130))`,
          boxShadow: `0 12px 30px -8px ${NEON}`
        }, children: [
          /* @__PURE__ */ jsx(Play, { className: "h-5 w-5 fill-black" }),
          " Start Workout"
        ] }) : /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => {
            setSession(null);
            setRest(null);
            toast("Session cancelled");
          }, className: "h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-sm font-semibold flex items-center justify-center gap-1.5", children: [
            /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
            " Cancel"
          ] }),
          /* @__PURE__ */ jsxs("button", { disabled: finishMut.isPending, onClick: () => finishMut.mutate(), className: "h-12 rounded-2xl font-black text-black text-sm flex items-center justify-center gap-1.5 active:scale-[0.98]", style: {
            background: `linear-gradient(135deg, ${NEON}, oklch(0.92 0.2 130))`,
            boxShadow: `0 8px 24px -6px ${NEON}`
          }, children: [
            finishMut.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
            "Finish"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(PhaseCard, { tone: "warm", icon: Flame, title: "Warm-up", duration: "5 min", items: ["2 min light cardio (jog / jumping jacks)", "10 arm circles + 10 leg swings each side", "1 set of the first exercise at 40% effort"] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-1 pt-1", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Dumbbell, { className: "h-4 w-4", style: {
            color: NEON
          } }),
          " Exercises"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          const allOpen = exercises.every((_, i) => expanded[i]);
          const next = {};
          exercises.forEach((_, i) => {
            next[i] = !allOpen;
          });
          setExpanded(next);
        }, className: "text-[11px] text-muted-foreground hover:text-foreground", children: exercises.every((_, i) => expanded[i]) ? "Collapse all" : "Expand all" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2.5", children: [
        exercises.map((ex, i) => /* @__PURE__ */ jsx(ExerciseCard, { idx: i, ex, open: !!expanded[i], onToggle: () => setExpanded((e) => ({
          ...e,
          [i]: !e[i]
        })), session, onToggleSet: (sIdx) => toggleSet(i, sIdx, Number(ex.rest_sec) || 60), lastDone: lastPerf(ex.name), weights, onWeightChange: (sIdx, v) => setWeight(i, sIdx, v), onLog: () => logExercise(ex, i), logging: logExMut.isPending, logged: !!loggedEx[i], estKcal: estimateExerciseKcal(ex, i) }, i)),
        exercises.length === 0 && /* @__PURE__ */ jsx("div", { className: "glass rounded-2xl p-6 text-center text-xs text-muted-foreground", children: "No exercises in today's plan. Try re-generating." })
      ] }),
      /* @__PURE__ */ jsx(PhaseCard, { tone: "cool", icon: Wind, title: "Cool-down", duration: "5 min", items: ["3 min easy walk to bring HR down", "Static stretch worked muscles 30s each", "Deep breathing 4-7-8 for 1 min"] }),
      aiPlan?.tips?.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-3xl p-4 border border-white/[0.06]", style: {
        background: "linear-gradient(140deg, oklch(0.18 0.03 155), oklch(0.12 0.02 160))"
      }, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-sm font-bold mb-2", children: [
          /* @__PURE__ */ jsx(Lightbulb, { className: "h-4 w-4", style: {
            color: NEON
          } }),
          " Coach's tips"
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-1.5", children: aiPlan.tips.map((t, i) => /* @__PURE__ */ jsxs("li", { className: "flex gap-2 text-[13px] text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { style: {
            color: NEON
          }, children: "•" }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "flex-1", children: t })
        ] }, i)) })
      ] })
    ] }) : /* @__PURE__ */ jsxs("section", { className: "glass rounded-3xl p-6 text-center animate-slide-up", children: [
      /* @__PURE__ */ jsx("div", { className: "h-14 w-14 mx-auto rounded-2xl flex items-center justify-center mb-3", style: {
        background: NEON_SOFT
      }, children: /* @__PURE__ */ jsx(Sparkles, { className: "h-6 w-6", style: {
        color: NEON
      } }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold", children: "No plan yet" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Generate a personalized weekly split tuned to your BMI and goal." }),
      /* @__PURE__ */ jsx("button", { onClick: () => setAiOpen(true), className: "mt-4 h-12 px-6 rounded-2xl text-black font-black active:scale-95", style: {
        background: `linear-gradient(135deg, ${NEON}, oklch(0.92 0.2 130))`
      }, children: "Generate my plan" })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "animate-slide-up", style: {
      animationDelay: ".12s"
    }, children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold px-1 mb-2 flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(Medal, { className: "h-4 w-4", style: {
          color: NEON
        } }),
        " Personal records"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
        /* @__PURE__ */ jsx(PrCard, { label: "Longest session", value: prs.longest ? `${prs.longest} min` : "—", icon: Timer }),
        /* @__PURE__ */ jsx(PrCard, { label: "Biggest burn", value: prs.hottest ? `${prs.hottest} kcal` : "—", icon: Flame }),
        /* @__PURE__ */ jsx(PrCard, { label: "Best week", value: prs.bestWeek ? `${prs.bestWeek} sessions` : "—", icon: Trophy }),
        /* @__PURE__ */ jsx(PrCard, { label: "Total sessions", value: String(prs.total), icon: Award })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "animate-slide-up", style: {
      animationDelay: ".14s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-1 mb-2", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold", children: "Quick log" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setOpen(true), className: "text-[11px] font-semibold", style: {
          color: NEON
        }, children: "Custom +" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: types.map((t) => {
        const Icon = t.icon;
        return /* @__PURE__ */ jsxs("button", { onClick: () => {
          setType(t.key);
          setOpen(true);
        }, className: "rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-95 transition border border-white/[0.05] bg-white/[0.03]", children: [
          /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-xl flex items-center justify-center", style: {
            background: `${t.color}22`
          }, children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4", style: {
            color: t.color
          } }) }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold", children: t.label })
        ] }, t.key);
      }) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "animate-slide-up", style: {
      animationDelay: ".16s"
    }, children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold px-1 mb-2 flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(History, { className: "h-4 w-4", style: {
          color: NEON
        } }),
        " Recent"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        todays.map((w) => {
          const meta = types.find((t) => t.key === w.workout_type) ?? types[0];
          const Icon = meta.icon;
          return /* @__PURE__ */ jsxs("div", { className: "glass rounded-2xl p-3 flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl flex items-center justify-center", style: {
              background: `${meta.color}22`
            }, children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4", style: {
              color: meta.color
            } }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold truncate", children: w.name }),
              /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
                "Today · ",
                w.duration_min,
                " min"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-bold tabular-nums", style: {
                color: NEON
              }, children: w.calories_burned }),
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: "kcal" })
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => del.mutate(w.id), className: "text-muted-foreground/60 hover:text-destructive p-1", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] }, w.id);
        }),
        workouts.filter((w) => new Date(w.logged_at) < today).slice(0, 8).map((w) => {
          const meta = types.find((t) => t.key === w.workout_type) ?? types[0];
          const Icon = meta.icon;
          return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl p-3 flex items-center gap-3 bg-white/[0.03] border border-white/[0.05]", children: [
            /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-xl flex items-center justify-center", style: {
              background: `${meta.color}22`
            }, children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4", style: {
              color: meta.color
            } }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium truncate", children: w.name }),
              /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: new Date(w.logged_at).toLocaleDateString(void 0, {
                weekday: "short",
                month: "short",
                day: "numeric"
              }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground tabular-nums", children: [
                w.duration_min,
                "m"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs font-semibold tabular-nums", style: {
                color: NEON
              }, children: [
                w.calories_burned,
                " kcal"
              ] })
            ] })
          ] }, w.id);
        }),
        workouts.length === 0 && /* @__PURE__ */ jsx("div", { className: "glass rounded-2xl p-4 text-center text-xs text-muted-foreground", children: "No history yet." })
      ] })
    ] }),
    rest && /* @__PURE__ */ jsx("div", { className: "fixed inset-x-0 z-40 flex justify-center pointer-events-none", style: {
      bottom: "calc(100px + env(safe-area-inset-bottom))"
    }, children: /* @__PURE__ */ jsx("div", { className: "pointer-events-auto w-[min(420px,calc(100vw-24px))] rounded-2xl p-3 backdrop-blur-xl border animate-slide-up", style: {
      background: "oklch(0.10 0.015 160 / 90%)",
      borderColor: "oklch(0.84 0.20 145 / 40%)",
      boxShadow: `0 20px 40px -10px ${NEON}`
    }, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative h-12 w-12 flex items-center justify-center", children: [
        /* @__PURE__ */ jsxs("svg", { className: "absolute inset-0 -rotate-90", viewBox: "0 0 40 40", children: [
          /* @__PURE__ */ jsx("circle", { cx: "20", cy: "20", r: "17", fill: "none", stroke: "oklch(1 0 0 / 8%)", strokeWidth: "3" }),
          /* @__PURE__ */ jsx("circle", { cx: "20", cy: "20", r: "17", fill: "none", stroke: NEON, strokeWidth: "3", strokeDasharray: 2 * Math.PI * 17, strokeDashoffset: 2 * Math.PI * 17 * (1 - rest.remaining / rest.total), strokeLinecap: "round", style: {
            transition: "stroke-dashoffset 1s linear"
          } })
        ] }),
        /* @__PURE__ */ jsx(Timer, { className: "h-4 w-4", style: {
          color: NEON
        } })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-widest text-muted-foreground", children: "Rest" }),
        /* @__PURE__ */ jsxs("div", { className: "text-xl font-black tabular-nums", style: {
          color: NEON
        }, children: [
          String(Math.floor(rest.remaining / 60)).padStart(1, "0"),
          ":",
          String(rest.remaining % 60).padStart(2, "0")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => setRest((r) => r ? {
          ...r,
          remaining: Math.min(r.total, r.remaining + 15),
          total: Math.max(r.total, r.remaining + 15)
        } : null), className: "h-9 px-2 rounded-xl bg-white/[0.06] text-[11px] font-semibold flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }),
          " +15"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setRest(null), className: "h-9 px-2 rounded-xl text-black font-bold text-[11px] flex items-center gap-1", style: {
          background: NEON
        }, children: [
          /* @__PURE__ */ jsx(SkipForward, { className: "h-3 w-3" }),
          " Skip"
        ] })
      ] })
    ] }) }) }),
    aiOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-end justify-center animate-slide-up", onClick: () => setAiOpen(false), children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-[460px] glass-strong rounded-t-[32px] p-6 space-y-4", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4", style: {
            color: NEON
          } }),
          " AI workout plan"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setAiOpen(false), className: "h-9 w-9 rounded-full bg-white/5 flex items-center justify-center", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsx(Field, { label: "Level", children: /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: ["beginner", "intermediate", "pro"].map((l) => /* @__PURE__ */ jsx(Chip, { active: level === l, onClick: () => setLevel(l), children: l }, l)) }) }),
      /* @__PURE__ */ jsx(Field, { label: "Equipment", children: /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: ["none", "home", "gym"].map((e) => /* @__PURE__ */ jsx(Chip, { active: equipment === e, onClick: () => setEquipment(e), children: e }, e)) }) }),
      /* @__PURE__ */ jsx(Field, { label: "Injuries / limits (optional)", children: /* @__PURE__ */ jsx("input", { value: injuries, onChange: (e) => setInjuries(e.target.value), placeholder: "e.g. knee, lower back", className: "w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[oklch(0.84_0.20_145/60%)]" }) }),
      /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
        "Personalized to: ",
        profile.gender ?? "—",
        ", age ",
        profile.age ?? "—",
        ", BMI ",
        bmi,
        ", goal ",
        profile.physique_goal ?? "—",
        "."
      ] }),
      /* @__PURE__ */ jsxs("button", { disabled: gen.isPending, onClick: () => gen.mutate(), className: "w-full h-12 rounded-2xl text-black font-black flex items-center justify-center gap-2", style: {
        background: `linear-gradient(135deg, ${NEON}, oklch(0.92 0.2 130))`
      }, children: [
        gen.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
        gen.isPending ? "Designing your split…" : "Generate plan"
      ] })
    ] }) }),
    open && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-end justify-center animate-slide-up", onClick: () => setOpen(false), children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-[460px] glass-strong rounded-t-[32px] p-6 space-y-4", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold", children: "Log workout" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setOpen(false), className: "h-9 w-9 rounded-full bg-white/5 flex items-center justify-center", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2 overflow-x-auto -mx-1 px-1 pb-1", children: types.map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setType(t.key), className: `shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${type === t.key ? "text-black" : "bg-white/5 text-muted-foreground"}`, style: type === t.key ? {
        background: NEON
      } : void 0, children: t.label }, t.key)) }),
      /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Name (e.g. Push day)", className: "w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[oklch(0.84_0.20_145/60%)]" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs mb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Duration" }),
          /* @__PURE__ */ jsxs("span", { className: "font-semibold tabular-nums", children: [
            duration,
            " min"
          ] })
        ] }),
        /* @__PURE__ */ jsx("input", { type: "range", min: 5, max: 180, step: 5, value: duration, onChange: (e) => setDuration(+e.target.value), className: "w-full", style: {
          accentColor: NEON
        } })
      ] }),
      /* @__PURE__ */ jsxs("button", { disabled: add.isPending, onClick: () => add.mutate(), className: "w-full h-12 rounded-2xl text-black font-black flex items-center justify-center gap-2", style: {
        background: `linear-gradient(135deg, ${NEON}, oklch(0.92 0.2 130))`
      }, children: [
        add.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
        " Save workout"
      ] })
    ] }) })
  ] });
}
function useTicker(startedAt) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => force((x) => x + 1), 1e3);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return "0:00";
  const s = Math.floor((Date.now() - startedAt) / 1e3);
  const m = Math.floor(s / 60), ss = s % 60;
  return `${m}:${String(ss).padStart(2, "0")}`;
}
function Stat({
  label,
  value,
  sub,
  icon: Icon,
  accent
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl p-2.5 bg-white/[0.04] border border-white/[0.05]", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Icon, { className: "h-3 w-3", style: {
        color: accent
      } }),
      " ",
      label
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 text-xl font-black tabular-nums leading-none", children: value }),
    sub && /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-[10px] text-muted-foreground truncate", children: sub })
  ] });
}
function MetricTile({
  label,
  value,
  accent
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl p-3 bg-black/30 border border-white/[0.05]", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-widest text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-lg font-black tabular-nums", style: accent ? {
      color: NEON
    } : void 0, children: value })
  ] });
}
function PrCard({
  label,
  value,
  icon: Icon
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl p-3 bg-white/[0.03] border border-white/[0.05] flex items-center gap-3", children: [
    /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl flex items-center justify-center", style: {
      background: NEON_SOFT
    }, children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4", style: {
      color: NEON
    } }) }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-widest text-muted-foreground truncate", children: label }),
      /* @__PURE__ */ jsx("div", { className: "text-sm font-black tabular-nums", children: value })
    ] })
  ] });
}
function DifficultyBadge({
  d,
  compact
}) {
  const t = difficultyTone(d);
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-full font-semibold ${compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"}`, style: {
    background: t.bg,
    color: t.fg
  }, children: t.label });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5", children: label }),
    children
  ] });
}
function Chip({
  active,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsx("button", { onClick, className: `px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition
        ${active ? "text-black" : "bg-white/5 text-muted-foreground"}`, style: active ? {
    background: NEON
  } : void 0, children });
}
function PhaseCard({
  tone,
  icon: Icon,
  title,
  duration,
  items
}) {
  const color = tone === "warm" ? "oklch(0.82 0.18 50)" : "oklch(0.74 0.15 220)";
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl p-4 border border-white/[0.05]", style: {
    background: `linear-gradient(140deg, ${color}12, transparent 70%)`
  }, children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "h-8 w-8 rounded-xl flex items-center justify-center", style: {
        background: `${color}22`
      }, children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4", style: {
        color
      } }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-bold", children: title }),
        /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground uppercase tracking-widest", children: duration })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("ul", { className: "space-y-1 pl-1", children: items.map((it, i) => /* @__PURE__ */ jsxs("li", { className: "flex gap-2 text-[12px] text-muted-foreground", children: [
      /* @__PURE__ */ jsx("span", { style: {
        color
      }, children: "›" }),
      " ",
      /* @__PURE__ */ jsx("span", { children: it })
    ] }, i)) })
  ] });
}
function ExerciseCard({
  idx,
  ex,
  open,
  onToggle,
  session,
  onToggleSet,
  lastDone,
  weights,
  onWeightChange,
  onLog,
  logging,
  logged,
  estKcal
}) {
  const setCount = Number(ex.sets) || 3;
  const sets = Array.from({
    length: setCount
  });
  const muscles = Array.isArray(ex.target_muscles) && ex.target_muscles.length ? ex.target_muscles : inferMuscles(ex.name, ex.focus);
  const doneCount = session ? sets.filter((_, i) => session.completed[`${idx}:${i}`]).length : 0;
  const allDone = session && doneCount === setCount;
  return /* @__PURE__ */ jsxs("div", { className: `rounded-2xl border overflow-hidden transition-all duration-300
      ${allDone ? "border-[oklch(0.84_0.20_145/50%)]" : "border-white/[0.06]"}`, style: {
    background: allDone ? `linear-gradient(140deg, ${NEON_SOFT}, oklch(0.13 0.02 160))` : "linear-gradient(140deg, oklch(0.17 0.015 160), oklch(0.13 0.015 160))"
  }, children: [
    /* @__PURE__ */ jsxs("button", { onClick: onToggle, className: "w-full flex items-center gap-3 p-4 text-left active:scale-[0.99] transition", children: [
      /* @__PURE__ */ jsx("div", { className: `h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 tabular-nums
          ${allDone ? "text-black" : "text-white"}`, style: {
        background: allDone ? NEON : "oklch(1 0 0 / 5%)",
        boxShadow: allDone ? `0 0 16px ${NEON}` : void 0
      }, children: allDone ? /* @__PURE__ */ jsx(Check, { className: "h-5 w-5", strokeWidth: 3 }) : String(idx + 1).padStart(2, "0") }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "text-[15px] font-bold leading-tight truncate", children: ex.name }),
        /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-[11px] px-2 py-0.5 rounded-md bg-white/[0.06] font-semibold tabular-nums", children: [
            ex.sets,
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground mx-0.5", children: "×" }),
            ex.reps
          ] }),
          ex.rest_sec && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground flex items-center gap-0.5", children: [
            /* @__PURE__ */ jsx(Timer, { className: "h-2.5 w-2.5" }),
            " ",
            ex.rest_sec,
            "s"
          ] }),
          session && /* @__PURE__ */ jsxs("span", { className: "text-[10px] tabular-nums", style: {
            color: NEON
          }, children: [
            doneCount,
            "/",
            setCount
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(ChevronDown, { className: `h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}` })
    ] }),
    open && /* @__PURE__ */ jsxs("div", { className: "px-4 pb-4 space-y-3 animate-slide-up", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [
        /* @__PURE__ */ jsx(Crosshair, { className: "h-3 w-3 text-muted-foreground" }),
        muscles.map((m, i) => /* @__PURE__ */ jsx("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-muted-foreground uppercase tracking-wider font-semibold", children: m }, i))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-black/40 border border-white/[0.05] overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[42px_1fr_1fr_44px] text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 border-b border-white/[0.04]", children: [
          /* @__PURE__ */ jsx("div", { children: "Set" }),
          /* @__PURE__ */ jsx("div", { className: "text-center", children: "Reps" }),
          /* @__PURE__ */ jsx("div", { className: "text-center", children: "Weight" }),
          /* @__PURE__ */ jsx("div", {})
        ] }),
        sets.map((_, sIdx) => {
          const done = session?.completed[`${idx}:${sIdx}`];
          return /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-[42px_1fr_1fr_44px] items-center px-3 py-2.5 border-b border-white/[0.03] last:border-0 transition
                    ${done ? "bg-[oklch(0.84_0.20_145/10%)]" : ""}`, children: [
            /* @__PURE__ */ jsx("div", { className: "text-base font-black tabular-nums", style: done ? {
              color: NEON
            } : void 0, children: sIdx + 1 }),
            /* @__PURE__ */ jsx("div", { className: "text-center text-lg font-bold tabular-nums", children: ex.reps }),
            /* @__PURE__ */ jsxs("div", { className: "text-center text-sm text-muted-foreground tabular-nums", children: [
              /* @__PURE__ */ jsx("input", { type: "number", inputMode: "decimal", min: 0, step: "0.5", value: weights[`${idx}:${sIdx}`] ?? "", onChange: (e) => onWeightChange(sIdx, e.target.value), placeholder: "—", className: "w-16 bg-transparent text-center text-base font-bold outline-none focus:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" }),
              /* @__PURE__ */ jsx("span", { className: "text-[10px] ml-0.5", children: "kg" })
            ] }),
            /* @__PURE__ */ jsx("button", { disabled: !session, onClick: () => onToggleSet(sIdx), className: `h-8 w-8 mx-auto rounded-lg flex items-center justify-center transition
                      ${done ? "text-black" : "bg-white/[0.05] text-muted-foreground"}
                      ${!session ? "opacity-40 cursor-not-allowed" : "active:scale-90"}`, style: done ? {
              background: NEON,
              boxShadow: `0 0 12px ${NEON}`
            } : void 0, children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4", strokeWidth: 3 }) })
          ] }, sIdx);
        })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[11px] text-muted-foreground", children: [
        /* @__PURE__ */ jsx(History, { className: "h-3 w-3" }),
        lastDone ? /* @__PURE__ */ jsxs("span", { children: [
          "Last done ",
          /* @__PURE__ */ jsx("b", { className: "text-foreground", children: timeAgo(lastDone) })
        ] }) : /* @__PURE__ */ jsx("span", { children: "No previous record — set the baseline today 🎯" })
      ] }),
      ex.tip && /* @__PURE__ */ jsxs("div", { className: "rounded-xl p-3 border flex gap-2", style: {
        background: NEON_SOFT,
        borderColor: "oklch(0.84 0.20 145 / 25%)"
      }, children: [
        /* @__PURE__ */ jsx(Lightbulb, { className: "h-3.5 w-3.5 shrink-0 mt-0.5", style: {
          color: NEON
        } }),
        /* @__PURE__ */ jsx("p", { className: "text-[12px] leading-snug", children: ex.tip })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-[1fr_auto] gap-2", children: [
        /* @__PURE__ */ jsx("button", { type: "button", disabled: logging || logged, onClick: onLog, className: "h-11 rounded-xl font-black text-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70", style: {
          background: logged ? "oklch(0.84 0.20 145 / 30%)" : `linear-gradient(135deg, ${NEON}, oklch(0.92 0.2 130))`,
          color: logged ? NEON : void 0,
          boxShadow: logged ? void 0 : `0 8px 20px -6px ${NEON}`
        }, children: logging ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : logged ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Check, { className: "h-4 w-4", strokeWidth: 3 }),
          " Logged · ",
          estKcal,
          " kcal"
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Flame, { className: "h-4 w-4" }),
          " Log Workout · ~",
          estKcal,
          " kcal"
        ] }) }),
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = ytUrl(ex.name);
          const win = window.open(url, "_blank", "noopener,noreferrer");
          if (!win) window.top ? window.top.location.href = url : window.location.href = url;
        }, className: "h-11 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center gap-1 text-xs font-bold transition active:scale-[0.98]", children: [
          /* @__PURE__ */ jsx(PlayCircle, { className: "h-4 w-4", style: {
            color: NEON
          } }),
          "Demo"
        ] })
      ] })
    ] })
  ] });
}
function timeAgo(d) {
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 864e5);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const wks = Math.floor(days / 7);
  if (wks < 4) return `${wks} wk ago`;
  return d.toLocaleDateString(void 0, {
    month: "short",
    day: "numeric"
  });
}
export {
  Workout as component
};
