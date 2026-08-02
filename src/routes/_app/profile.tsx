import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { progressQuery } from "@/lib/queries";
import { logWeight, updateProfile } from "@/lib/weight.functions";
import { logWater } from "@/lib/progress.functions";
import { supabase } from "@/integrations/supabase/client";
import { MealHistory, type FoodLog } from "@/components/mobile/MealHistory";
import { LineChart, BarChart, ScoreRing, CHART_COLORS } from "@/components/mobile/ProgressCharts";
import { HealthSyncCard } from "@/components/mobile/HealthSyncCard";
import { NotificationSettings } from "@/components/mobile/NotificationSettings";
import {
  Flame, Scale, Loader2, Save, Sparkles, TrendingDown, TrendingUp, Target,
  Droplets, Activity, Trophy, Plus, Minus, Check, LogOut, Pencil,
  Award, Moon, Dumbbell, Heart, Zap, Medal, Footprints, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  component: Profile,
  head: () => ({
    meta: [
      { title: "Progress & History — MyNutriLens" },
      { name: "description", content: "Track weight, BMI, macros, workouts, steps, hydration and sleep with weekly and monthly progress charts plus your full meal history." },
      { property: "og:title", content: "Progress & History — MyNutriLens" },
      { property: "og:description", content: "Your personal AI progress hub: trends, streaks, records and meal timeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const DAY_MS = 86400000;
const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

function buildDays(n: number) {
  const out: string[] = [];
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(new Date(base.getTime() - i * DAY_MS)));
  return out;
}

function Profile() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(progressQuery);
  const p = data.profile as any;

  const [period, setPeriod] = useState<7 | 30>(7);
  const [weight, setWeight] = useState("");
  const [showGoals, setShowGoals] = useState(false);
  const [cal, setCal] = useState(p?.daily_calorie_goal ?? 2200);
  const [protein, setProtein] = useState(p?.protein_goal_g ?? 140);
  const [carbs, setCarbs] = useState(p?.carbs_goal_g ?? 250);
  const [fat, setFat] = useState(p?.fat_goal_g ?? 70);

  const days = useMemo(() => buildDays(period), [period]);
  const labels = useMemo(
    () => days.map((d) => (period === 7 ? ["S", "M", "T", "W", "T", "F", "S"][new Date(d + "T12:00:00").getDay()] : "")),
    [days, period],
  );

  /* ── Daily aggregation ───────────────────────── */
  const series = useMemo(() => {
    const cals: Record<string, number> = {};
    const prot: Record<string, number> = {};
    const meals: Record<string, number> = {};
    for (const f of data.foods) {
      const k = dayKey(f.logged_at);
      cals[k] = (cals[k] ?? 0) + (f.calories ?? 0);
      prot[k] = (prot[k] ?? 0) + Number(f.protein_g ?? 0);
      meals[k] = (meals[k] ?? 0) + 1;
    }
    const wk: Record<string, number> = {};
    const burn: Record<string, number> = {};
    for (const w of data.workouts) {
      const k = dayKey(w.logged_at);
      wk[k] = (wk[k] ?? 0) + 1;
      burn[k] = (burn[k] ?? 0) + (w.calories_burned ?? 0);
    }
    const wt: Record<string, number> = {};
    for (const e of data.weights) wt[dayKey(e.logged_at)] = Number(e.weight_kg);
    const steps: Record<string, number> = {};
    const sleep: Record<string, number> = {};
    const water: Record<string, number> = {};
    for (const s of data.snapshots) {
      if (s.steps != null) steps[s.captured_on] = s.steps;
      if (s.sleep_minutes != null) sleep[s.captured_on] = s.sleep_minutes / 60;
      if (s.water_ml != null) water[s.captured_on] = s.water_ml;
      if (s.weight_kg != null && wt[s.captured_on] == null) wt[s.captured_on] = Number(s.weight_kg);
    }
    return { cals, prot, meals, wk, burn, wt, steps, sleep, water };
  }, [data]);

  const get = (m: Record<string, number>, k: string) => m[k] ?? 0;
  const calSeries = days.map((d) => get(series.cals, d));
  const protSeries = days.map((d) => get(series.prot, d));
  const workoutSeries = days.map((d) => get(series.wk, d));
  const stepSeries = days.map((d) => get(series.steps, d));
  const sleepSeries = days.map((d) => get(series.sleep, d));
  const waterSeries = days.map((d) => get(series.water, d));

  // weight forward-filled
  const weightSeries = useMemo(() => {
    let last = Number(p?.weight_kg ?? 0);
    const first = days.map((d) => series.wt[d]).find((v) => v != null);
    if (first != null) last = first;
    return days.map((d) => {
      if (series.wt[d] != null) last = series.wt[d];
      return last;
    });
  }, [days, series.wt, p?.weight_kg]);

  const heightM = Number(p?.height_cm ?? 170) / 100;
  const bmiSeries = weightSeries.map((w) => (heightM > 0 ? +(w / (heightM * heightM)).toFixed(1) : 0));
  const currentWeight = Number(p?.weight_kg ?? weightSeries[weightSeries.length - 1] ?? 0);
  const targetWeight = Number(p?.target_weight_kg ?? Math.max(45, currentWeight - 5));
  const bmi = bmiSeries[bmiSeries.length - 1] ?? 0;
  const bmiLabel = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";
  const weightDelta = weightSeries[weightSeries.length - 1] - weightSeries[0];

  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

  const waterTargetMl = Math.round(Number(p?.water_intake_l ?? 3) * 1000) || 3000;
  const sleepTarget = Number(p?.sleep_hours ?? 8) || 8;
  const stepTarget = 8000;

  const pct = (v: number, t: number) => Math.max(0, Math.min(100, Math.round((v / Math.max(1, t)) * 100)));
  const calScore = pct(avg(calSeries), cal);
  const protScore = pct(avg(protSeries), protein);
  const stepScore = pct(avg(stepSeries), stepTarget);
  const waterScore = pct(avg(waterSeries), waterTargetMl);
  const sleepScore = pct(avg(sleepSeries), sleepTarget);
  const workoutScore = pct(sum(workoutSeries), period === 7 ? 4 : 16);
  const goalCompletion = Math.round((calScore * 0.2 + protScore * 0.25 + workoutScore * 0.25 + waterScore * 0.15 + sleepScore * 0.15));

  /* ── Streaks & records ───────────────────────── */
  const loggedDays = useMemo(() => new Set(Object.keys(series.cals).filter((k) => series.cals[k] > 0)), [series.cals]);
  const streak = useMemo(() => {
    let s = 0;
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    for (let i = 0; i < 120; i++) {
      const k = dayKey(new Date(base.getTime() - i * DAY_MS));
      if (loggedDays.has(k)) s++;
      else if (i > 0) break;
    }
    return s;
  }, [loggedDays]);

  const records = useMemo(() => {
    const bestSteps = Math.max(0, ...Object.values(series.steps));
    const bestProtein = Math.max(0, ...Object.values(series.prot));
    const bestBurn = Math.max(0, ...Object.values(series.burn));
    const lowestWeight = data.weights.length ? Math.min(...data.weights.map((w) => Number(w.weight_kg))) : currentWeight;
    const longestWorkout = Math.max(0, ...data.workouts.map((w) => w.duration_min ?? 0));
    return { bestSteps, bestProtein, bestBurn, lowestWeight, longestWorkout };
  }, [series, data.weights, data.workouts, currentWeight]);

  const totalWorkouts = data.workouts.length;
  const totalMeals = data.foods.length;

  const badges = [
    { id: "first", label: "First Log", icon: Zap, unlocked: totalMeals > 0 },
    { id: "week", label: "7-Day Streak", icon: Flame, unlocked: streak >= 7 },
    { id: "protein", label: "Protein Pro", icon: Dumbbell, unlocked: protScore >= 90 },
    { id: "hydro", label: "Hydrated", icon: Droplets, unlocked: waterScore >= 90 },
    { id: "steps", label: "10K Steps", icon: Footprints, unlocked: records.bestSteps >= 10000 },
    { id: "iron", label: "10 Workouts", icon: Trophy, unlocked: totalWorkouts >= 10 },
  ];
  const unlocked = badges.filter((b) => b.unlocked).length;

  /* ── Water logging ───────────────────────────── */
  const todayKey = dayKey(new Date());
  const waterToday = series.water[todayKey] ?? 0;
  const glasses = Math.round(waterToday / 250);
  const targetGlasses = Math.max(4, Math.round(waterTargetMl / 250));

  const waterMut = useMutation({
    mutationFn: (ml: number) => logWater({ data: { water_ml: ml } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["progress"] }),
    onError: (e: any) => toast.error(e.message),
  });
  const save = useMutation({
    mutationFn: () => updateProfile({ data: { daily_calorie_goal: cal, protein_goal_g: protein, carbs_goal_g: carbs, fat_goal_g: fat } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["progress"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Goals updated"); },
  });
  const wlog = useMutation({
    mutationFn: () => logWeight({ data: { weight_kg: Number(weight) } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["progress"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); setWeight(""); toast.success("Weight logged"); },
    onError: (e: any) => toast.error(e.message),
  });

  const periodLabel = period === 7 ? "this week" : "this month";
  const aiInsight =
    data.insight?.content ??
    `You've logged ${totalMeals} meals and ${totalWorkouts} workouts. Goal completion is ${goalCompletion}% ${periodLabel} — ${
      protScore < 80 ? "protein is your biggest gap, add 25–30g at dinner." :
      waterScore < 80 ? "hydration is lagging, aim for two more glasses daily." :
      workoutScore < 60 ? "add one more training session to lock in progress." :
      "consistency is strong, keep the same rhythm next week."
    }`;

  return (
    <div className="px-5 pt-10 pb-32 space-y-4 max-w-[460px] mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 animate-slide-up">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/25 to-cyan-400/10 border border-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
          {(p?.display_name ?? "U")[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold truncate leading-tight">Progress & History</h1>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{p?.display_name ?? "Athlete"} · {p?.physique_goal ?? "Recomp"}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/10 border border-primary/25">
          <Flame className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold tabular-nums text-primary">{streak}</span>
        </div>
        <button onClick={() => navigate({ to: "/onboarding", search: { edit: 1 } as any })} className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition" aria-label="Edit profile">
          <Pencil className="h-3.5 w-3.5 text-foreground/80" />
        </button>
        <button onClick={async () => { await supabase.auth.signOut(); toast.success("Signed out"); navigate({ to: "/login" }); }} className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition" aria-label="Sign out">
          <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </header>

      {/* Period switch */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-slide-up" style={{ animationDelay: ".02s" }}>
        {([7, 30] as const).map((d) => (
          <button
            key={d}
            onClick={() => setPeriod(d)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${period === d ? "bg-primary/15 text-primary border border-primary/25" : "text-muted-foreground"}`}
          >
            {d === 7 ? "Weekly" : "Monthly"}
          </button>
        ))}
      </div>

      {/* Goal completion hero */}
      <section className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.09] via-cyan-400/[0.03] to-transparent p-4 flex items-center gap-4 animate-slide-up" style={{ animationDelay: ".04s" }}>
        <ScoreRing pct={goalCompletion} size={96} label="Goal" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Completion {periodLabel}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <ScoreLine label="Calories" v={calScore} />
            <ScoreLine label="Protein" v={protScore} />
            <ScoreLine label="Training" v={workoutScore} />
            <ScoreLine label="Hydration" v={waterScore} />
            <ScoreLine label="Sleep" v={sleepScore} />
            <ScoreLine label="Steps" v={stepScore} />
          </div>
        </div>
      </section>

      {/* AI insight */}
      <section className="rounded-2xl border border-primary/15 bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".06s" }}>
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-primary/80 font-semibold">AI progress insight</p>
            <p className="text-[13px] mt-1 leading-relaxed text-foreground/90">{aiInsight}</p>
          </div>
        </div>
      </section>

      {/* Body metrics */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".08s" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Weight & BMI</h2>
          </div>
          <div className={`flex items-center gap-1 text-xs ${weightDelta <= 0 ? "text-primary" : "text-amber-300"}`}>
            {weightDelta <= 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            <span className="tabular-nums font-medium">{weightDelta >= 0 ? "+" : ""}{weightDelta.toFixed(1)} kg</span>
          </div>
        </div>
        <LineChart id="weight" data={weightSeries} height={64} />
        <div className="grid grid-cols-4 gap-2 mt-3">
          <Stat label="Now" value={`${currentWeight.toFixed(1)}`} unit="kg" />
          <Stat label="Target" value={`${targetWeight.toFixed(1)}`} unit="kg" />
          <Stat label="BMI" value={bmi.toFixed(1)} unit={bmiLabel} />
          <Stat label="Body fat" value={p?.body_fat_pct ? Number(p.body_fat_pct).toFixed(1) : "—"} unit="%" />
        </div>
        <div className="flex gap-2 mt-3">
          <div className="flex-1 relative">
            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Log today's weight"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm outline-none focus:border-primary/50 transition-colors" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
          </div>
          <button onClick={() => wlog.mutate()} disabled={!weight || wlog.isPending}
            className="px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-40 active:scale-[0.98] transition">
            {wlog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
        </div>
      </section>

      {/* Nutrition trend */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".1s" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Calories</h2>
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">avg {Math.round(avg(calSeries))} / {cal}</span>
        </div>
        <BarChart data={calSeries} labels={period === 7 ? labels : undefined} goal={cal} />
        <div className="flex items-center justify-between mt-4 mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Dumbbell className="h-4 w-4 text-primary" /> Protein</h3>
          <span className="text-[11px] text-muted-foreground tabular-nums">avg {Math.round(avg(protSeries))}g / {protein}g</span>
        </div>
        <BarChart data={protSeries} labels={period === 7 ? labels : undefined} goal={protein} color="cyan" />
        <button onClick={() => setShowGoals((s) => !s)} className="mt-3 w-full text-[11px] text-primary flex items-center justify-center gap-1">
          {showGoals ? "Hide targets" : "Adjust targets"} <ChevronRight className={`h-3 w-3 transition-transform ${showGoals ? "rotate-90" : ""}`} />
        </button>
        {showGoals && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2 animate-slide-up">
            <div className="grid grid-cols-2 gap-2">
              <GoalStepper label="Calories" value={cal} unit="kcal" min={800} max={5000} step={50} onChange={setCal} />
              <GoalStepper label="Protein" value={protein} unit="g" min={30} max={400} step={5} onChange={setProtein} />
              <GoalStepper label="Carbs" value={carbs} unit="g" min={30} max={800} step={5} onChange={setCarbs} />
              <GoalStepper label="Fat" value={fat} unit="g" min={20} max={300} step={2} onChange={setFat} />
            </div>
            <button disabled={save.isPending} onClick={() => save.mutate()} className="w-full mt-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98]">
              {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save goals
            </button>
          </div>
        )}
      </section>

      {/* Activity + health metrics */}
      <section className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: ".12s" }}>
        <MetricCard icon={<Activity className="h-3.5 w-3.5 text-primary" />} label="Workouts" value={sum(workoutSeries)} unit={period === 7 ? "/ wk" : "/ mo"} score={workoutScore} data={workoutSeries} color="primary" />
        <MetricCard icon={<Footprints className="h-3.5 w-3.5 text-cyan-300" />} label="Steps" value={Math.round(avg(stepSeries))} unit="avg" score={stepScore} data={stepSeries} color="cyan" />
        <MetricCard icon={<Droplets className="h-3.5 w-3.5 text-cyan-300" />} label="Water" value={`${(avg(waterSeries) / 1000).toFixed(1)}L`} unit="avg" score={waterScore} data={waterSeries} color="cyan" />
        <MetricCard icon={<Moon className="h-3.5 w-3.5 text-violet-300" />} label="Sleep" value={`${avg(sleepSeries).toFixed(1)}h`} unit="avg" score={sleepScore} data={sleepSeries} color="violet" />
      </section>

      {/* Hydration logger */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".14s" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-cyan-300" />
            <h2 className="text-sm font-semibold">Hydration today</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => waterMut.mutate(Math.max(0, waterToday - 250))} className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95"><Minus className="h-3 w-3" /></button>
            <span className="text-sm font-semibold tabular-nums w-12 text-center">{glasses}/{targetGlasses}</span>
            <button onClick={() => waterMut.mutate(waterToday + 250)} className="h-7 w-7 rounded-full bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center active:scale-95"><Plus className="h-3 w-3 text-cyan-200" /></button>
          </div>
        </div>
        <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${targetGlasses}, minmax(0,1fr))` }}>
          {Array.from({ length: targetGlasses }).map((_, i) => (
            <div key={i} className={`h-6 rounded-md transition-all ${i < glasses ? "bg-gradient-to-b from-cyan-400/50 to-cyan-500/20 border border-cyan-400/40" : "bg-white/[0.02] border border-white/5"}`} />
          ))}
        </div>
      </section>

      {/* Meal history */}
      <div className="animate-slide-up" style={{ animationDelay: ".16s" }}>
        <MealHistory foods={data.foods as FoodLog[]} />
      </div>

      {/* Personal records */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".18s" }}>
        <div className="flex items-center gap-2 mb-3">
          <Medal className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Personal records</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Record icon={<Footprints className="h-3.5 w-3.5" />} label="Most steps" value={records.bestSteps ? records.bestSteps.toLocaleString() : "—"} />
          <Record icon={<Dumbbell className="h-3.5 w-3.5" />} label="Best protein day" value={records.bestProtein ? `${Math.round(records.bestProtein)}g` : "—"} />
          <Record icon={<Flame className="h-3.5 w-3.5" />} label="Top burn" value={records.bestBurn ? `${records.bestBurn} kcal` : "—"} />
          <Record icon={<Heart className="h-3.5 w-3.5" />} label="Lowest weight" value={records.lowestWeight ? `${records.lowestWeight.toFixed(1)} kg` : "—"} />
          <Record icon={<Activity className="h-3.5 w-3.5" />} label="Longest session" value={records.longestWorkout ? `${records.longestWorkout} min` : "—"} />
          <Record icon={<Flame className="h-3.5 w-3.5" />} label="Current streak" value={`${streak} days`} />
        </div>
      </section>

      {/* Achievements */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".2s" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Achievements</h2>
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">{unlocked}/{badges.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {badges.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.id} className={`rounded-xl border p-2.5 flex flex-col items-center gap-1.5 transition ${b.unlocked ? "border-primary/25 bg-primary/[0.06]" : "border-white/5 bg-white/[0.01] opacity-40"}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${b.unlocked ? "bg-primary/15 text-primary" : "bg-white/5 text-muted-foreground"}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-medium text-center leading-tight">{b.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Health sources */}
      <section className="animate-slide-up" style={{ animationDelay: ".22s" }}>
        <HealthSyncCard
          lastSyncedAt={p?.health_last_synced_at}
          enabled={p?.health_sync_enabled}
          restingHr={p?.resting_hr}
          sleepMinutes={p?.sleep_minutes}
          activeMinutes={p?.active_minutes_today}
        />
      </section>

      {/* Smart notifications */}
      <section className="animate-slide-up" style={{ animationDelay: ".24s" }}>
        <NotificationSettings />
      </section>
    </div>
  );
}

/* ── Sub-components ─────────────────────────── */

function ScoreLine({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">{v}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden mt-0.5">
        <div className="h-full rounded-full bg-primary" style={{ width: `${v}%`, transition: "width 1s cubic-bezier(.2,.8,.2,1)" }} />
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2 text-center">
      <p className="text-sm font-semibold tabular-nums leading-none">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1 truncate">{unit ?? label}</p>
      {unit && <p className="text-[9px] text-muted-foreground/60 truncate">{label}</p>}
    </div>
  );
}

function MetricCard({
  icon, label, value, unit, score, data, color,
}: {
  icon: React.ReactNode; label: string; value: string | number; unit: string; score: number;
  data: number[]; color: "primary" | "cyan" | "violet";
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-xl font-bold tabular-nums">{value}</span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-2">
        <BarChart data={data.slice(-14)} height={30} color={color} />
      </div>
      <p className={`text-[10px] mt-1.5 tabular-nums ${score >= 80 ? "text-primary" : score >= 50 ? "text-cyan-300" : "text-muted-foreground"}`}>{score}% of target</p>
    </div>
  );
}

function Record({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <p className="text-sm font-semibold tabular-nums mt-1">{value}</p>
    </div>
  );
}

function GoalStepper({ label, value, unit, min, max, step, onChange }: { label: string; value: number; unit: string; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{label}</span><span>{unit}</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <button onClick={() => onChange(Math.max(min, value - step))} className="h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95"><Minus className="h-2.5 w-2.5" /></button>
        <span className="flex-1 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + step))} className="h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95"><Plus className="h-2.5 w-2.5" /></button>
      </div>
    </div>
  );
}

// keep tree-shaking honest for shared color tokens
void CHART_COLORS;
void Target;
void Trophy;
