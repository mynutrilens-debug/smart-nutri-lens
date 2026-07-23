import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQueryClient, useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { d as dashboardQuery } from "./queries-DQC1c2F_.js";
import { c as createSsrRpc, u as useServerFn } from "./router-D-2d6VGp.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as createServerFn } from "./server-BadC42R4.js";
import { s as supabase } from "./client-BMbiJotd.js";
import { ShieldCheck, Activity, Loader2, RefreshCw, Footprints, Heart, Moon, Zap, Flame, Dumbbell, Droplets, Trophy, Pencil, LogOut, Target, Sparkles, ChevronRight, Save, Scale, TrendingDown, TrendingUp, Check, Minus, Plus, Award, Medal, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import "./food.functions-C13l6RKQ.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const logWeight = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  weight_kg: z.number().min(20).max(400)
}).parse(d)).handler(createSsrRpc("a78da44b1e541b0b26f3b5c1a4e2bb757b183f43bb1d2eea80fdc92e44886008"));
const updateProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  display_name: z.string().min(1).max(100).optional(),
  daily_calorie_goal: z.number().int().min(800).max(8e3).optional(),
  protein_goal_g: z.number().int().min(20).max(500).optional(),
  carbs_goal_g: z.number().int().min(20).max(1e3).optional(),
  fat_goal_g: z.number().int().min(10).max(400).optional(),
  height_cm: z.number().min(80).max(260).optional()
}).parse(d)).handler(createSsrRpc("250cfffd342bb4a312e8dd3bc6836a31c47efe44a4ba17098be8e91910933d11"));
const platform = () => typeof window !== "undefined" && Capacitor?.isNativePlatform?.() ? Capacitor.getPlatform() : "web";
function isHealthAvailable() {
  const p = platform();
  return p === "ios" || p === "android";
}
function todayISO() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
async function readHealthKit(sinceISO) {
  const { CapacitorHealthkit } = await import("@perfood/capacitor-healthkit");
  const READ = [
    "steps",
    "calories",
    "distance",
    "activity",
    "heartRate",
    "sleep",
    "weight",
    "height"
  ];
  try {
    await CapacitorHealthkit.requestAuthorization({
      all: [],
      read: READ,
      write: []
    });
  } catch {
    return { captured_on: todayISO(), source: "unavailable", workouts: [] };
  }
  const start = new Date(sinceISO);
  const end = /* @__PURE__ */ new Date();
  const q = { startDate: start.toISOString(), endDate: end.toISOString(), limit: 0 };
  const safe = async (fn) => {
    try {
      return await fn();
    } catch {
      return null;
    }
  };
  const [steps, calories, distance, hr, sleep, weight, height, workouts] = await Promise.all([
    safe(() => CapacitorHealthkit.queryHKitSampleType({ ...q, sampleName: "stepCount" })),
    safe(() => CapacitorHealthkit.queryHKitSampleType({ ...q, sampleName: "activeEnergyBurned" })),
    safe(() => CapacitorHealthkit.queryHKitSampleType({ ...q, sampleName: "distanceWalkingRunning" })),
    safe(() => CapacitorHealthkit.queryHKitSampleType({ ...q, sampleName: "heartRate" })),
    safe(() => CapacitorHealthkit.queryHKitSampleType({ ...q, sampleName: "sleepAnalysis" })),
    safe(() => CapacitorHealthkit.queryHKitSampleType({ ...q, sampleName: "weight" })),
    safe(() => CapacitorHealthkit.queryHKitSampleType({ ...q, sampleName: "height" })),
    safe(() => CapacitorHealthkit.queryHKitSampleType({ ...q, sampleName: "workoutType" }))
  ]);
  const sum = (rows) => (rows?.resultData ?? []).reduce((a, r) => a + Number(r.value ?? 0), 0);
  const avg = (rows) => {
    const rs = rows?.resultData ?? [];
    if (!rs.length) return void 0;
    return Math.round(rs.reduce((a, r) => a + Number(r.value ?? 0), 0) / rs.length);
  };
  const latest = (rows) => {
    const rs = rows?.resultData ?? [];
    if (!rs.length) return void 0;
    return Number(rs[rs.length - 1].value ?? 0);
  };
  const sleepMin = (() => {
    const rs = sleep?.resultData ?? [];
    return Math.round(rs.reduce((a, r) => a + Number(r.duration ?? 0), 0) / 60);
  })();
  const wk = (workouts?.resultData ?? []).map((w, i) => ({
    source_id: String(w.uuid ?? w.startDate ?? i),
    activity: String(w.workoutActivityName ?? w.activityType ?? "workout"),
    started_at: String(w.startDate ?? (/* @__PURE__ */ new Date()).toISOString()),
    duration_min: Math.round(Number(w.duration ?? 0) / 60),
    calories: Number(w.totalEnergyBurned ?? 0) || void 0,
    distance_m: Number(w.totalDistance ?? 0) || void 0
  }));
  return {
    captured_on: todayISO(),
    source: "healthkit",
    steps: Math.round(sum(steps)) || void 0,
    calories_burned: Math.round(sum(calories)) || void 0,
    distance_m: Math.round(sum(distance)) || void 0,
    active_minutes: void 0,
    avg_heart_rate: avg(hr),
    resting_heart_rate: void 0,
    sleep_minutes: sleepMin || void 0,
    weight_kg: latest(weight),
    height_cm: latest(height) ? Number(latest(height)) * 100 : void 0,
    workouts: wk
  };
}
async function readHealthConnect(_sinceISO) {
  return { captured_on: todayISO(), source: "unavailable", workouts: [] };
}
async function readHealthSnapshot(sinceDays = 1) {
  if (!isHealthAvailable()) return null;
  const since = new Date(Date.now() - sinceDays * 864e5).toISOString();
  try {
    if (platform() === "ios") return await readHealthKit(since);
    return await readHealthConnect(since);
  } catch (e) {
    console.warn("[health] read failed", e);
    return null;
  }
}
const WorkoutSchema = z.object({
  source_id: z.string(),
  activity: z.string(),
  started_at: z.string(),
  duration_min: z.number().nonnegative(),
  calories: z.number().nonnegative().optional(),
  distance_m: z.number().nonnegative().optional()
});
const SnapshotSchema = z.object({
  captured_on: z.string(),
  source: z.enum(["healthkit", "health_connect"]),
  steps: z.number().int().nonnegative().optional(),
  calories_burned: z.number().nonnegative().optional(),
  distance_m: z.number().nonnegative().optional(),
  active_minutes: z.number().nonnegative().optional(),
  avg_heart_rate: z.number().positive().optional(),
  resting_heart_rate: z.number().positive().optional(),
  sleep_minutes: z.number().nonnegative().optional(),
  weight_kg: z.number().positive().optional(),
  height_cm: z.number().positive().optional(),
  workouts: z.array(WorkoutSchema).default([])
});
const ingestHealthSnapshot = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => SnapshotSchema.parse(d)).handler(createSsrRpc("d3fd5391a7ce0f52dba4d9b2b547f17022fbb3b12b7c650401893fb6bdb51c46"));
createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("40a0c69efc2c22f6ca3610d36be0d9f08f4f3b583f908e2a90a6ca006b1b2a86"));
function HealthSyncCard({ lastSyncedAt, enabled, restingHr, sleepMinutes, activeMinutes }) {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snap, setSnap] = useState(null);
  const ingest = useServerFn(ingestHealthSnapshot);
  const qc = useQueryClient();
  useEffect(() => {
    setAvailable(isHealthAvailable());
  }, []);
  const sync = async () => {
    if (!isHealthAvailable()) {
      toast.info("Health sync is available in the mobile app.");
      return;
    }
    setBusy(true);
    try {
      const s = await readHealthSnapshot(1);
      if (!s || s.source === "unavailable") {
        toast.error("Health permissions not granted.");
        return;
      }
      setSnap(s);
      await ingest({ data: s });
      toast.success("Health data synced");
      qc.invalidateQueries();
    } catch (e) {
      toast.error(e?.message || "Sync failed");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (!available) return;
    const t = setTimeout(() => {
      void sync();
    }, 400);
    return () => clearTimeout(t);
  }, [available]);
  if (!available && !enabled) {
    return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-white/60", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { size: 16, className: "text-emerald-400" }),
        /* @__PURE__ */ jsx("span", { className: "text-white/80 font-medium", children: "Health sources" })
      ] }),
      "Install MyNutriLens on iOS or Android to sync Apple Health / Health Connect data automatically."
    ] });
  }
  const steps = snap?.steps;
  const cals = snap?.calories_burned;
  const hr = snap?.avg_heart_rate ?? restingHr ?? void 0;
  const sleep = snap?.sleep_minutes ?? sleepMinutes ?? void 0;
  const active = snap?.active_minutes ?? activeMinutes ?? void 0;
  const lastText = lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Activity, { size: 16, className: "text-emerald-400" }),
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-white/90", children: "Health sources" }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 uppercase tracking-wider", children: snap?.source === "healthkit" ? "Apple Health" : snap?.source === "health_connect" ? "Health Connect" : "Ready" })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: sync,
          disabled: busy,
          className: "text-xs flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 disabled:opacity-50",
          children: [
            busy ? /* @__PURE__ */ jsx(Loader2, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { size: 12 }),
            "Sync"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-2", children: [
      /* @__PURE__ */ jsx(Metric, { icon: /* @__PURE__ */ jsx(Footprints, { size: 14 }), label: "Steps", value: steps ? steps.toLocaleString() : "—" }),
      /* @__PURE__ */ jsx(Metric, { icon: /* @__PURE__ */ jsx(Activity, { size: 14 }), label: "Active", value: active ? `${active}m` : "—" }),
      /* @__PURE__ */ jsx(Metric, { icon: /* @__PURE__ */ jsx(Heart, { size: 14 }), label: "HR", value: hr ? `${hr}` : "—" }),
      /* @__PURE__ */ jsx(Metric, { icon: /* @__PURE__ */ jsx(Moon, { size: 14 }), label: "Sleep", value: sleep ? `${Math.floor(sleep / 60)}h${sleep % 60}` : "—" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-2 text-[11px] text-white/40", children: [
      "Last sync ",
      lastText,
      " · calories burned: ",
      cals ?? "—"
    ] })
  ] });
}
function Metric({ icon, label, value }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-black/30 border border-white/5 p-2 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "text-emerald-400/80 flex justify-center mb-1", children: icon }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-white font-semibold", children: value }),
    /* @__PURE__ */ jsx("div", { className: "text-[10px] text-white/40 uppercase tracking-wider", children: label })
  ] });
}
function Profile() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const {
    data
  } = useSuspenseQuery(dashboardQuery);
  const p = data.profile;
  const [cal, setCal] = useState(p?.daily_calorie_goal ?? 2200);
  const [protein, setProtein] = useState(p?.protein_goal_g ?? 140);
  const [carbs, setCarbs] = useState(p?.carbs_goal_g ?? 250);
  const [fat, setFat] = useState(p?.fat_goal_g ?? 70);
  const [editing, setEditing] = useState(null);
  const [weight, setWeight] = useState(p?.weight_kg ? String(p.weight_kg) : "");
  const [water, setWater] = useState(5);
  const [showGoals, setShowGoals] = useState(false);
  const startWeight = data.weights[0]?.weight_kg ? Number(data.weights[0].weight_kg) : Number(p?.weight_kg ?? 0);
  const currentWeight = Number(p?.weight_kg ?? startWeight);
  const targetWeight = Number(p?.target_weight_kg ?? Math.max(50, currentWeight - 5));
  const heightM = Number(p?.height_cm ?? 170) / 100;
  const bmi = heightM > 0 ? currentWeight / (heightM * heightM) : 0;
  const bmiLabel = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";
  const weekChange = useMemo(() => {
    const w = data.weights;
    if (w.length < 2) return 0;
    return Number(w[w.length - 1].weight_kg) - Number(w[0].weight_kg);
  }, [data.weights]);
  const totalDelta = Math.abs(startWeight - targetWeight) || 1;
  const progressedDelta = Math.abs(startWeight - currentWeight);
  const transformPct = Math.min(100, Math.round(progressedDelta / totalDelta * 100));
  const kgToGo = Math.max(0, Math.abs(currentWeight - targetWeight));
  const proteinPct = Math.min(100, Math.round(data.totals.protein / Math.max(1, protein) * 100));
  const caloriePct = Math.min(100, Math.round(data.totals.calories / Math.max(1, cal) * 100));
  const carbsPct = Math.min(100, Math.round(data.totals.carbs / Math.max(1, carbs) * 100));
  const fatPct = Math.min(100, Math.round(data.totals.fat / Math.max(1, fat) * 100));
  const waterPct = Math.min(100, water / 8 * 100);
  const workoutScore = data.burned > 200 ? 100 : Math.round(data.burned / 200 * 100);
  const streak = p?.streak_count ?? 0;
  const consistency = Math.round(proteinPct * 0.3 + caloriePct * 0.25 + waterPct * 0.2 + workoutScore * 0.25);
  const weeklyGoalPct = Math.round((consistency + Math.min(100, streak * 14)) / 2);
  const weekActivity = useMemo(() => {
    const today = (/* @__PURE__ */ new Date()).getDay();
    return Array.from({
      length: 7
    }).map((_, i) => {
      const daysAgo = (today - i + 7) % 7;
      const active = daysAgo < streak;
      const height = active ? 40 + i * 13 % 55 : 8 + i * 7 % 12;
      return {
        active,
        height
      };
    });
  }, [streak]);
  const onboardedAt = p?.onboarded_at ? new Date(p.onboarded_at) : null;
  const weeksIn = onboardedAt ? Math.max(1, Math.min(12, Math.ceil((Date.now() - onboardedAt.getTime()) / (7 * 864e5)))) : 1;
  const daysToMilestone = Math.max(1, 7 - streak % 7);
  const nextMilestone = streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : streak < 60 ? 60 : 100;
  const badges = [{
    id: "first",
    label: "First Step",
    icon: Zap,
    unlocked: data.recentFoods.length > 0 || streak >= 1
  }, {
    id: "week",
    label: "7 Day",
    icon: Flame,
    unlocked: streak >= 7
  }, {
    id: "protein",
    label: "Protein Pro",
    icon: Dumbbell,
    unlocked: proteinPct >= 90
  }, {
    id: "hydro",
    label: "Hydrated",
    icon: Droplets,
    unlocked: waterPct >= 100
  }, {
    id: "burn",
    label: "Fat Burner",
    icon: Flame,
    unlocked: data.burned >= 300
  }, {
    id: "month",
    label: "30 Day",
    icon: Trophy,
    unlocked: streak >= 30
  }];
  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const save = useMutation({
    mutationFn: () => updateProfile({
      data: {
        daily_calorie_goal: cal,
        protein_goal_g: protein,
        carbs_goal_g: carbs,
        fat_goal_g: fat
      }
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
      toast.success("Goals updated");
      setEditing(null);
    }
  });
  const wlog = useMutation({
    mutationFn: () => logWeight({
      data: {
        weight_kg: Number(weight)
      }
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
      toast.success("Weight logged");
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxs("div", { className: "px-5 pt-10 pb-32 space-y-4 max-w-[460px] mx-auto", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center gap-3 animate-slide-up", children: [
      /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 flex items-center justify-center text-sm font-semibold text-primary", children: (p?.display_name ?? "U")[0]?.toUpperCase() }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-base font-semibold truncate leading-tight", children: p?.display_name ?? "Athlete" }),
        /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-muted-foreground leading-tight mt-0.5", children: [
          "Week ",
          weeksIn,
          "/12 · ",
          p?.physique_goal ?? "Recomp"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/10 border border-primary/25", children: [
        /* @__PURE__ */ jsx(Flame, { className: "h-3.5 w-3.5 text-primary" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold tabular-nums text-primary", children: streak })
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: () => navigate({
        to: "/onboarding",
        search: {
          edit: 1
        }
      }), className: "h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition", "aria-label": "Edit", children: /* @__PURE__ */ jsx(Pencil, { className: "h-3.5 w-3.5 text-foreground/80" }) }),
      /* @__PURE__ */ jsx("button", { onClick: async () => {
        await supabase.auth.signOut();
        toast.success("Signed out");
        navigate({
          to: "/login"
        });
      }, className: "h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition", "aria-label": "Sign out", children: /* @__PURE__ */ jsx(LogOut, { className: "h-3.5 w-3.5 text-muted-foreground" }) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "animate-slide-up", style: {
      animationDelay: ".02s"
    }, children: /* @__PURE__ */ jsx(HealthSyncCard, { lastSyncedAt: p?.health_last_synced_at, enabled: p?.health_sync_enabled, restingHr: p?.resting_hr, sleepMinutes: p?.sleep_minutes, activeMinutes: p?.active_minutes_today }) }),
    /* @__PURE__ */ jsxs("section", { className: "grid grid-cols-2 gap-3 animate-slide-up", style: {
      animationDelay: ".04s"
    }, children: [
      /* @__PURE__ */ jsx(KpiCard, { icon: /* @__PURE__ */ jsx(Target, { className: "h-3.5 w-3.5" }), label: "Consistency", value: consistency, suffix: "%", hint: consistency >= 80 ? "On fire" : consistency >= 50 ? "Solid" : "Push today", pct: consistency }),
      /* @__PURE__ */ jsx(KpiCard, { icon: /* @__PURE__ */ jsx(Trophy, { className: "h-3.5 w-3.5" }), label: "Weekly goal", value: weeklyGoalPct, suffix: "%", hint: `${7 - streak % 7}d to milestone`, pct: weeklyGoalPct })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up", style: {
      animationDelay: ".06s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Transformation" }),
          /* @__PURE__ */ jsxs("p", { className: "text-lg font-semibold mt-0.5 tabular-nums", children: [
            currentWeight,
            /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: " kg" }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground mx-1.5", children: "→" }),
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: targetWeight })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "Progress" }),
          /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold tabular-nums text-primary", children: [
            transformPct,
            "%"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(SegmentedBar, { pct: transformPct, segments: 10 }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-2 text-[11px] text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          kgToGo.toFixed(1),
          " kg to go"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "tabular-nums", children: [
          "BMI ",
          bmi.toFixed(1),
          " · ",
          bmiLabel
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] to-transparent p-4 animate-slide-up", style: {
      animationDelay: ".08s"
    }, children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "h-8 w-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-primary" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.18em] text-primary/80 font-semibold", children: "AI Coach" }),
        /* @__PURE__ */ jsx("p", { className: "text-[13px] mt-1 leading-relaxed text-foreground/90", children: data.insight?.content ?? `You're ${transformPct}% to target. Hit ${Math.max(0, protein - Math.round(data.totals.protein))}g more protein and ${8 - water} glasses of water to keep the streak alive.` })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up", style: {
      animationDelay: ".1s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "This week" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold mt-0.5", children: [
            weekActivity.filter((d) => d.active).length,
            " active days"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-xs text-primary", children: [
          /* @__PURE__ */ jsx(Activity, { className: "h-3.5 w-3.5" }),
          /* @__PURE__ */ jsxs("span", { className: "tabular-nums font-medium", children: [
            data.burned,
            " kcal"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 flex items-end justify-between gap-1.5 h-16", children: weekActivity.map((d, i) => /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("div", { className: `w-full rounded-md transition-all ${d.active ? "bg-gradient-to-t from-primary/60 to-primary" : "bg-white/[0.04]"}`, style: {
          height: `${d.height}%`
        } }),
        /* @__PURE__ */ jsx("span", { className: `text-[9px] uppercase ${d.active ? "text-primary/80" : "text-muted-foreground/60"}`, children: ["S", "M", "T", "W", "T", "F", "S"][i] })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up", style: {
      animationDelay: ".12s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Today's fuel" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold mt-0.5", children: [
            data.totals.calories,
            " ",
            /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-xs", children: [
              "/ ",
              cal,
              " kcal"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setShowGoals((s) => !s), className: "text-[11px] text-primary flex items-center gap-1", children: [
          showGoals ? "Done" : "Adjust",
          " ",
          /* @__PURE__ */ jsx(ChevronRight, { className: `h-3 w-3 transition-transform ${showGoals ? "rotate-90" : ""}` })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2.5", children: [
        /* @__PURE__ */ jsx(MacroRow, { label: "Calories", consumed: data.totals.calories, goal: cal, unit: "kcal", pct: caloriePct, tone: "primary" }),
        /* @__PURE__ */ jsx(MacroRow, { label: "Protein", consumed: Math.round(data.totals.protein), goal: protein, unit: "g", pct: proteinPct, tone: "rose" }),
        /* @__PURE__ */ jsx(MacroRow, { label: "Carbs", consumed: Math.round(data.totals.carbs), goal: carbs, unit: "g", pct: carbsPct, tone: "amber" }),
        /* @__PURE__ */ jsx(MacroRow, { label: "Fat", consumed: Math.round(data.totals.fat), goal: fat, unit: "g", pct: fatPct, tone: "sky" })
      ] }),
      showGoals && /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-white/5 space-y-2 animate-slide-up", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsx(GoalStepper, { label: "Calories", value: cal, unit: "kcal", min: 800, max: 5e3, step: 50, onChange: setCal }),
          /* @__PURE__ */ jsx(GoalStepper, { label: "Protein", value: protein, unit: "g", min: 30, max: 400, step: 5, onChange: setProtein }),
          /* @__PURE__ */ jsx(GoalStepper, { label: "Carbs", value: carbs, unit: "g", min: 30, max: 800, step: 5, onChange: setCarbs }),
          /* @__PURE__ */ jsx(GoalStepper, { label: "Fat", value: fat, unit: "g", min: 20, max: 300, step: 2, onChange: setFat })
        ] }),
        /* @__PURE__ */ jsxs("button", { disabled: save.isPending, onClick: () => save.mutate(), className: "w-full mt-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98]", children: [
          save.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsx(Save, { className: "h-3.5 w-3.5" }),
          " Save goals"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "grid grid-cols-2 gap-3 animate-slide-up", style: {
      animationDelay: ".14s"
    }, children: [
      /* @__PURE__ */ jsx(StreakCard, { icon: /* @__PURE__ */ jsx(Dumbbell, { className: "h-3.5 w-3.5 text-primary" }), label: "Protein streak", value: proteinPct >= 80 ? streak : 0, unit: "days", tone: "primary" }),
      /* @__PURE__ */ jsx(StreakCard, { icon: /* @__PURE__ */ jsx(Droplets, { className: "h-3.5 w-3.5 text-sky-300" }), label: "Water streak", value: waterPct >= 90 ? streak : 0, unit: "days", tone: "sky" }),
      /* @__PURE__ */ jsx(StreakCard, { icon: /* @__PURE__ */ jsx(Activity, { className: "h-3.5 w-3.5 text-primary" }), label: "Workouts", value: data.burned > 0 ? 1 : 0, unit: "today", tone: "primary" }),
      /* @__PURE__ */ jsx(StreakCard, { icon: /* @__PURE__ */ jsx(Moon, { className: "h-3.5 w-3.5 text-violet-300" }), label: "Recovery", value: 7.5, unit: "h sleep", tone: "violet" })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up", style: {
      animationDelay: ".16s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Scale, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold", children: "Weight trend" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1 text-xs ${weekChange <= 0 ? "text-primary" : "text-amber-300"}`, children: [
          weekChange <= 0 ? /* @__PURE__ */ jsx(TrendingDown, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(TrendingUp, { className: "h-3.5 w-3.5" }),
          /* @__PURE__ */ jsxs("span", { className: "tabular-nums font-medium", children: [
            weekChange >= 0 ? "+" : "",
            weekChange.toFixed(1),
            " kg"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Sparkline, { data: data.weights.map((w) => Number(w.weight_kg)) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 relative", children: [
          /* @__PURE__ */ jsx("input", { type: "number", step: "0.1", value: weight, onChange: (e) => setWeight(e.target.value), placeholder: "Log today's weight", className: "w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm outline-none focus:border-primary/50 transition-colors" }),
          /* @__PURE__ */ jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground", children: "kg" })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => wlog.mutate(), disabled: !weight || wlog.isPending, className: "px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-40 active:scale-[0.98] transition", children: wlog.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "grid grid-cols-2 gap-3 animate-slide-up", style: {
      animationDelay: ".18s"
    }, children: [
      /* @__PURE__ */ jsx(BodyStat, { label: "Body fat", value: "18.2", unit: "%", delta: "-0.4", positive: true, icon: /* @__PURE__ */ jsx(Heart, { className: "h-3.5 w-3.5" }) }),
      /* @__PURE__ */ jsx(BodyStat, { label: "Muscle", value: "42.1", unit: "kg", delta: "+0.3", positive: true, icon: /* @__PURE__ */ jsx(Dumbbell, { className: "h-3.5 w-3.5" }) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up", style: {
      animationDelay: ".2s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Droplets, { className: "h-4 w-4 text-sky-300" }),
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold", children: "Hydration" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setWater((w) => Math.max(0, w - 1)), className: "h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95", children: /* @__PURE__ */ jsx(Minus, { className: "h-3 w-3" }) }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm font-semibold tabular-nums w-10 text-center", children: [
            water,
            "/8"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setWater((w) => Math.min(12, w + 1)), className: "h-7 w-7 rounded-full bg-sky-400/15 border border-sky-400/30 flex items-center justify-center active:scale-95", children: /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3 text-sky-200" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 grid grid-cols-8 gap-1", children: Array.from({
        length: 8
      }).map((_, i) => /* @__PURE__ */ jsx("div", { className: `h-6 rounded-md transition-all ${i < water ? "bg-gradient-to-b from-sky-400/50 to-sky-500/25 border border-sky-400/40" : "bg-white/[0.02] border border-white/5"}` }, i)) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up", style: {
      animationDelay: ".22s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Award, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold", children: "Achievements" })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-muted-foreground tabular-nums", children: [
          unlockedCount,
          "/",
          badges.length
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: badges.map((b) => {
        const Icon = b.icon;
        return /* @__PURE__ */ jsxs("div", { className: `rounded-xl border p-2.5 flex flex-col items-center gap-1.5 transition ${b.unlocked ? "border-primary/25 bg-primary/[0.06]" : "border-white/5 bg-white/[0.01] opacity-40"}`, children: [
          /* @__PURE__ */ jsx("div", { className: `h-8 w-8 rounded-full flex items-center justify-center ${b.unlocked ? "bg-primary/15 text-primary" : "bg-white/5 text-muted-foreground"}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-medium text-center leading-tight", children: b.label })
        ] }, b.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/[0.06] bg-gradient-to-br from-primary/[0.08] to-transparent p-4 animate-slide-up", style: {
      animationDelay: ".24s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Medal, { className: "h-4 w-4 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Next milestone" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold mt-0.5", children: [
            nextMilestone,
            "-day streak"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-primary tabular-nums", children: Math.max(0, nextMilestone - streak) }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground", children: "days left" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(SegmentedBar, { pct: Math.min(100, streak / nextMilestone * 100), segments: nextMilestone <= 14 ? nextMilestone : 10, className: "mt-3" })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-2 animate-slide-up", style: {
      animationDelay: ".26s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-1", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Zap, { className: "h-3.5 w-3.5 text-primary" }),
          " Today's nudges"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: [
          daysToMilestone,
          "d to milestone"
        ] })
      ] }),
      proteinPct < 90 && /* @__PURE__ */ jsx(ActionCard, { to: "/scan", icon: /* @__PURE__ */ jsx(Dumbbell, { className: "h-4 w-4" }), title: `Add ${Math.max(0, protein - Math.round(data.totals.protein))}g protein`, subtitle: "Grill chicken or a whey shake closes the gap" }),
      water < 8 && /* @__PURE__ */ jsx(ActionCard, { to: "/profile", icon: /* @__PURE__ */ jsx(Droplets, { className: "h-4 w-4" }), title: `Drink ${8 - water} more glasses`, subtitle: "Hydration boosts recovery & focus", tone: "sky", onClickCapture: () => setWater((w) => Math.min(8, w + 1)) }),
      data.burned === 0 && /* @__PURE__ */ jsx(ActionCard, { to: "/workout", icon: /* @__PURE__ */ jsx(Activity, { className: "h-4 w-4" }), title: "Log a workout today", subtitle: "Even 15 min protects your streak" }),
      streak >= 3 && /* @__PURE__ */ jsx(ActionCard, { to: "/scan", icon: /* @__PURE__ */ jsx(Flame, { className: "h-4 w-4" }), title: `${streak}-day streak alive 🔥`, subtitle: "Log one meal to extend it", tone: "amber" })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up", style: {
      animationDelay: ".28s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold", children: "12-week program" })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-muted-foreground tabular-nums", children: [
          "Week ",
          weeksIn,
          "/12"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-12 gap-1", children: Array.from({
        length: 12
      }).map((_, i) => /* @__PURE__ */ jsx("div", { className: `h-6 rounded ${i < weeksIn ? "bg-primary/60" : i === weeksIn ? "bg-primary animate-pulse" : "bg-white/[0.04]"}` }, i)) })
    ] }),
    editing && /* @__PURE__ */ jsx("div", { className: "hidden", children: editing })
  ] });
}
function KpiCard({
  icon,
  label,
  value,
  suffix,
  hint,
  pct
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground", children: [
      icon,
      label
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold tabular-nums mt-1.5", children: [
      value,
      /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: suffix })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "h-1 rounded-full bg-white/5 mt-2 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-primary", style: {
      width: `${pct}%`,
      transition: "width 1s cubic-bezier(.2,.8,.2,1)"
    } }) }),
    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground mt-1.5", children: hint })
  ] });
}
function SegmentedBar({
  pct,
  segments,
  className
}) {
  const filled = Math.round(pct / 100 * segments);
  return /* @__PURE__ */ jsx("div", { className: `flex gap-1 mt-3 ${className ?? ""}`, children: Array.from({
    length: segments
  }).map((_, i) => /* @__PURE__ */ jsx("div", { className: `flex-1 h-1.5 rounded-full transition-all ${i < filled ? "bg-primary" : "bg-white/5"}`, style: {
    transitionDelay: `${i * 30}ms`
  } }, i)) });
}
function MacroRow({
  label,
  consumed,
  goal,
  unit,
  pct,
  tone
}) {
  const toneMap = {
    primary: "bg-primary",
    rose: "bg-rose-400",
    amber: "bg-amber-400",
    sky: "bg-sky-400"
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[11px] mb-1", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: label }),
      /* @__PURE__ */ jsxs("span", { className: "tabular-nums", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-foreground", children: consumed }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          " / ",
          goal,
          unit
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-white/5 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: `h-full rounded-full ${toneMap[tone]}`, style: {
      width: `${pct}%`,
      transition: "width 1s cubic-bezier(.2,.8,.2,1)"
    } }) })
  ] });
}
function GoalStepper({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-white/5 bg-white/[0.02] p-2.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground", children: [
      /* @__PURE__ */ jsx("span", { children: label }),
      /* @__PURE__ */ jsx("span", { children: unit })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => onChange(Math.max(min, value - step)), className: "h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95", children: /* @__PURE__ */ jsx(Minus, { className: "h-2.5 w-2.5" }) }),
      /* @__PURE__ */ jsx("span", { className: "flex-1 text-center text-sm font-semibold tabular-nums", children: value }),
      /* @__PURE__ */ jsx("button", { onClick: () => onChange(Math.min(max, value + step)), className: "h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95", children: /* @__PURE__ */ jsx(Plus, { className: "h-2.5 w-2.5" }) })
    ] })
  ] });
}
function StreakCard({
  icon,
  label,
  value,
  unit,
  tone
}) {
  const borderMap = {
    primary: "border-primary/15",
    sky: "border-sky-400/15",
    violet: "border-violet-400/15"
  };
  return /* @__PURE__ */ jsxs("div", { className: `rounded-2xl border ${borderMap[tone]} bg-white/[0.02] p-3.5`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground", children: [
      icon,
      label
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold tabular-nums mt-1", children: [
      value,
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground ml-1 font-normal", children: unit })
    ] })
  ] });
}
function BodyStat({
  label,
  value,
  unit,
  delta,
  positive,
  icon
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground", children: [
      icon,
      label
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1 mt-1", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xl font-bold tabular-nums", children: value }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: unit })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `text-[10px] mt-0.5 tabular-nums ${positive ? "text-primary" : "text-amber-300"}`, children: [
      delta,
      " this week"
    ] })
  ] });
}
function ActionCard({
  to,
  icon,
  title,
  subtitle,
  tone = "primary",
  onClickCapture
}) {
  const toneMap = {
    primary: "border-primary/20 bg-primary/[0.05] text-primary",
    sky: "border-sky-400/20 bg-sky-400/[0.05] text-sky-300",
    amber: "border-amber-400/20 bg-amber-400/[0.05] text-amber-300"
  };
  return /* @__PURE__ */ jsxs(Link, { to, onClickCapture, className: `flex items-center gap-3 rounded-2xl border p-3.5 active:scale-[0.99] transition ${toneMap[tone]}`, children: [
    /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0", children: icon }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground", children: title }),
      /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5 leading-tight", children: subtitle })
    ] }),
    /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 opacity-60" })
  ] });
}
function Sparkline({
  data
}) {
  if (data.length < 2) {
    return /* @__PURE__ */ jsx("div", { className: "h-14 mt-3 flex items-center justify-center text-[11px] text-muted-foreground", children: "Log 2+ weights to see trend" });
  }
  const w = 320, h = 56, pad = 4;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = pad + i / (data.length - 1) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${d} L${points[points.length - 1][0]},${h} L${points[0][0]},${h} Z`;
  return /* @__PURE__ */ jsxs("svg", { viewBox: `0 0 ${w} ${h}`, className: "w-full h-14 mt-3", preserveAspectRatio: "none", children: [
    /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "spGrad", x1: "0", y1: "0", x2: "0", y2: "1", children: [
      /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "oklch(0.78 0.18 145 / 40%)" }),
      /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "oklch(0.78 0.18 145 / 0%)" })
    ] }) }),
    /* @__PURE__ */ jsx("path", { d: area, fill: "url(#spGrad)" }),
    /* @__PURE__ */ jsx("path", { d, fill: "none", stroke: "oklch(0.78 0.18 145)", strokeWidth: "1.75", strokeLinecap: "round", strokeLinejoin: "round" }),
    points.map(([x, y], i) => /* @__PURE__ */ jsx("circle", { cx: x, cy: y, r: i === points.length - 1 ? 2.5 : 1.5, fill: "oklch(0.82 0.16 145)" }, i))
  ] });
}
export {
  Profile as component
};
