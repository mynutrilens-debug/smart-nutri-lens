import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardQuery } from "@/lib/queries";
import { logWeight, updateProfile } from "@/lib/weight.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame, Scale, Loader2, Save, Sparkles, TrendingDown, TrendingUp, Target,
  Droplets, Activity, Trophy, Plus, Minus, Edit3, Check, LogOut, Pencil,
  Award, Moon, Dumbbell, Heart, ChevronRight, Zap, Medal, Calendar,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  component: Profile,
});

type Macro = "calories" | "protein" | "carbs" | "fat";

function Profile() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(dashboardQuery);
  const p = data.profile;

  const [cal, setCal] = useState(p?.daily_calorie_goal ?? 2200);
  const [protein, setProtein] = useState(p?.protein_goal_g ?? 140);
  const [carbs, setCarbs] = useState(p?.carbs_goal_g ?? 250);
  const [fat, setFat] = useState(p?.fat_goal_g ?? 70);
  const [editing, setEditing] = useState<Macro | null>(null);
  const [weight, setWeight] = useState<string>(p?.weight_kg ? String(p.weight_kg) : "");
  const [water, setWater] = useState(5);
  const [showGoals, setShowGoals] = useState(false);

  const startWeight = data.weights[0]?.weight_kg ? Number(data.weights[0].weight_kg) : Number(p?.weight_kg ?? 0);
  const currentWeight = Number(p?.weight_kg ?? startWeight);
  const targetWeight = Number(p?.target_weight_kg ?? Math.max(50, currentWeight - 5));
  const heightM = (Number(p?.height_cm ?? 170)) / 100;
  const bmi = heightM > 0 ? currentWeight / (heightM * heightM) : 0;
  const bmiLabel = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";

  const weekChange = useMemo(() => {
    const w = data.weights;
    if (w.length < 2) return 0;
    return Number(w[w.length - 1].weight_kg) - Number(w[0].weight_kg);
  }, [data.weights]);

  const totalDelta = Math.abs(startWeight - targetWeight) || 1;
  const progressedDelta = Math.abs(startWeight - currentWeight);
  const transformPct = Math.min(100, Math.round((progressedDelta / totalDelta) * 100));
  const kgToGo = Math.max(0, Math.abs(currentWeight - targetWeight));

  const proteinPct = Math.min(100, Math.round((data.totals.protein / Math.max(1, protein)) * 100));
  const caloriePct = Math.min(100, Math.round((data.totals.calories / Math.max(1, cal)) * 100));
  const carbsPct = Math.min(100, Math.round((data.totals.carbs / Math.max(1, carbs)) * 100));
  const fatPct = Math.min(100, Math.round((data.totals.fat / Math.max(1, fat)) * 100));
  const waterPct = Math.min(100, (water / 8) * 100);
  const workoutScore = data.burned > 200 ? 100 : Math.round((data.burned / 200) * 100);

  const streak = p?.streak_count ?? 0;
  const consistency = Math.round((proteinPct * 0.3 + caloriePct * 0.25 + waterPct * 0.2 + workoutScore * 0.25));
  const weeklyGoalPct = Math.round((consistency + Math.min(100, streak * 14)) / 2);

  // Weekly activity (7 days) — derive from streak/burned as a proxy
  const weekActivity = useMemo(() => {
    const today = new Date().getDay();
    return Array.from({ length: 7 }).map((_, i) => {
      const daysAgo = (today - i + 7) % 7;
      const active = daysAgo < streak;
      const height = active ? 40 + ((i * 13) % 55) : 8 + ((i * 7) % 12);
      return { active, height };
    });
  }, [streak]);

  const onboardedAt = p?.onboarded_at ? new Date(p.onboarded_at) : null;
  const weeksIn = onboardedAt ? Math.max(1, Math.min(12, Math.ceil((Date.now() - onboardedAt.getTime()) / (7 * 86400000)))) : 1;
  const daysToMilestone = Math.max(1, 7 - (streak % 7));
  const nextMilestone = streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : streak < 60 ? 60 : 100;

  // Badges
  const badges = [
    { id: "first", label: "First Step", icon: Zap, unlocked: (data.recentFoods.length > 0) || streak >= 1 },
    { id: "week", label: "7 Day", icon: Flame, unlocked: streak >= 7 },
    { id: "protein", label: "Protein Pro", icon: Dumbbell, unlocked: proteinPct >= 90 },
    { id: "hydro", label: "Hydrated", icon: Droplets, unlocked: waterPct >= 100 },
    { id: "burn", label: "Fat Burner", icon: Flame, unlocked: data.burned >= 300 },
    { id: "month", label: "30 Day", icon: Trophy, unlocked: streak >= 30 },
  ];
  const unlockedCount = badges.filter(b => b.unlocked).length;

  const save = useMutation({
    mutationFn: () => updateProfile({ data: { daily_calorie_goal: cal, protein_goal_g: protein, carbs_goal_g: carbs, fat_goal_g: fat } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Goals updated"); setEditing(null); },
  });
  const wlog = useMutation({
    mutationFn: () => logWeight({ data: { weight_kg: Number(weight) } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Weight logged"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="px-5 pt-10 pb-32 space-y-4 max-w-[460px] mx-auto">
      {/* ── Identity strip ────────────────────────────────── */}
      <header className="flex items-center gap-3 animate-slide-up">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
          {(p?.display_name ?? "U")[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold truncate leading-tight">{p?.display_name ?? "Athlete"}</h1>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">Week {weeksIn}/12 · {p?.physique_goal ?? "Recomp"}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/10 border border-primary/25">
          <Flame className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold tabular-nums text-primary">{streak}</span>
        </div>
        <button
          onClick={() => navigate({ to: "/onboarding", search: { edit: 1 } as any })}
          className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition"
          aria-label="Edit"
        >
          <Pencil className="h-3.5 w-3.5 text-foreground/80" />
        </button>
        <button
          onClick={async () => { await supabase.auth.signOut(); toast.success("Signed out"); navigate({ to: "/login" }); }}
          className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </header>

      {/* ── Hero KPI: Consistency + Weekly goal ─────────── */}
      <section className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: ".04s" }}>
        <KpiCard
          icon={<Target className="h-3.5 w-3.5" />}
          label="Consistency"
          value={consistency}
          suffix="%"
          hint={consistency >= 80 ? "On fire" : consistency >= 50 ? "Solid" : "Push today"}
          pct={consistency}
        />
        <KpiCard
          icon={<Trophy className="h-3.5 w-3.5" />}
          label="Weekly goal"
          value={weeklyGoalPct}
          suffix="%"
          hint={`${7 - (streak % 7)}d to milestone`}
          pct={weeklyGoalPct}
        />
      </section>

      {/* ── Transformation compact ────────────────────── */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".06s" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Transformation</p>
            <p className="text-lg font-semibold mt-0.5 tabular-nums">
              {currentWeight}<span className="text-xs text-muted-foreground"> kg</span>
              <span className="text-muted-foreground mx-1.5">→</span>
              <span className="text-primary">{targetWeight}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Progress</p>
            <p className="text-lg font-bold tabular-nums text-primary">{transformPct}%</p>
          </div>
        </div>
        <SegmentedBar pct={transformPct} segments={10} />
        <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
          <span>{kgToGo.toFixed(1)} kg to go</span>
          <span className="tabular-nums">BMI {bmi.toFixed(1)} · {bmiLabel}</span>
        </div>
      </section>

      {/* ── AI Insight ─────────────────────────────────── */}
      <section className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] to-transparent p-4 animate-slide-up" style={{ animationDelay: ".08s" }}>
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-primary/80 font-semibold">AI Coach</p>
            <p className="text-[13px] mt-1 leading-relaxed text-foreground/90">
              {data.insight?.content ?? `You're ${transformPct}% to target. Hit ${Math.max(0, protein - Math.round(data.totals.protein))}g more protein and ${8 - water} glasses of water to keep the streak alive.`}
            </p>
          </div>
        </div>
      </section>

      {/* ── Weekly trend ─────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".1s" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">This week</p>
            <p className="text-sm font-semibold mt-0.5">{weekActivity.filter(d => d.active).length} active days</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary">
            <Activity className="h-3.5 w-3.5" />
            <span className="tabular-nums font-medium">{data.burned} kcal</span>
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between gap-1.5 h-16">
          {weekActivity.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`w-full rounded-md transition-all ${d.active ? "bg-gradient-to-t from-primary/60 to-primary" : "bg-white/[0.04]"}`}
                style={{ height: `${d.height}%` }}
              />
              <span className={`text-[9px] uppercase ${d.active ? "text-primary/80" : "text-muted-foreground/60"}`}>{["S","M","T","W","T","F","S"][i]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Today's macros — segmented bars ─────────── */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".12s" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Today's fuel</p>
            <p className="text-sm font-semibold mt-0.5">{data.totals.calories} <span className="text-muted-foreground text-xs">/ {cal} kcal</span></p>
          </div>
          <button onClick={() => setShowGoals(s => !s)} className="text-[11px] text-primary flex items-center gap-1">
            {showGoals ? "Done" : "Adjust"} <ChevronRight className={`h-3 w-3 transition-transform ${showGoals ? "rotate-90" : ""}`} />
          </button>
        </div>
        <div className="space-y-2.5">
          <MacroRow label="Calories" consumed={data.totals.calories} goal={cal} unit="kcal" pct={caloriePct} tone="primary" />
          <MacroRow label="Protein" consumed={Math.round(data.totals.protein)} goal={protein} unit="g" pct={proteinPct} tone="rose" />
          <MacroRow label="Carbs" consumed={Math.round(data.totals.carbs)} goal={carbs} unit="g" pct={carbsPct} tone="amber" />
          <MacroRow label="Fat" consumed={Math.round(data.totals.fat)} goal={fat} unit="g" pct={fatPct} tone="sky" />
        </div>

        {showGoals && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2 animate-slide-up">
            <div className="grid grid-cols-2 gap-2">
              <GoalStepper label="Calories" value={cal} unit="kcal" min={800} max={5000} step={50} onChange={setCal} />
              <GoalStepper label="Protein" value={protein} unit="g" min={30} max={400} step={5} onChange={setProtein} />
              <GoalStepper label="Carbs" value={carbs} unit="g" min={30} max={800} step={5} onChange={setCarbs} />
              <GoalStepper label="Fat" value={fat} unit="g" min={20} max={300} step={2} onChange={setFat} />
            </div>
            <button disabled={save.isPending} onClick={() => save.mutate()} className="w-full mt-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98]">
              {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save goals
            </button>
          </div>
        )}
      </section>

      {/* ── Metric grid: streaks & recovery ─────────── */}
      <section className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: ".14s" }}>
        <StreakCard icon={<Dumbbell className="h-3.5 w-3.5 text-primary" />} label="Protein streak" value={proteinPct >= 80 ? streak : 0} unit="days" tone="primary" />
        <StreakCard icon={<Droplets className="h-3.5 w-3.5 text-sky-300" />} label="Water streak" value={waterPct >= 90 ? streak : 0} unit="days" tone="sky" />
        <StreakCard icon={<Activity className="h-3.5 w-3.5 text-primary" />} label="Workouts" value={data.burned > 0 ? 1 : 0} unit="today" tone="primary" />
        <StreakCard icon={<Moon className="h-3.5 w-3.5 text-violet-300" />} label="Recovery" value={7.5} unit="h sleep" tone="violet" />
      </section>

      {/* ── Weight tracker ─────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".16s" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Weight trend</h2>
          </div>
          <div className={`flex items-center gap-1 text-xs ${weekChange <= 0 ? "text-primary" : "text-amber-300"}`}>
            {weekChange <= 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            <span className="tabular-nums font-medium">{weekChange >= 0 ? "+" : ""}{weekChange.toFixed(1)} kg</span>
          </div>
        </div>
        <Sparkline data={data.weights.map(w => Number(w.weight_kg))} />
        <div className="flex gap-2 mt-3">
          <div className="flex-1 relative">
            <input
              type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="Log today's weight"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm outline-none focus:border-primary/50 transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
          </div>
          <button
            onClick={() => wlog.mutate()} disabled={!weight || wlog.isPending}
            className="px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-40 active:scale-[0.98] transition"
          >
            {wlog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
        </div>
      </section>

      {/* ── Body composition ──────────────────────── */}
      <section className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: ".18s" }}>
        <BodyStat label="Body fat" value="18.2" unit="%" delta="-0.4" positive icon={<Heart className="h-3.5 w-3.5" />} />
        <BodyStat label="Muscle" value="42.1" unit="kg" delta="+0.3" positive icon={<Dumbbell className="h-3.5 w-3.5" />} />
      </section>

      {/* ── Water ─────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".2s" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-sky-300" />
            <h2 className="text-sm font-semibold">Hydration</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWater(w => Math.max(0, w - 1))} className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95"><Minus className="h-3 w-3" /></button>
            <span className="text-sm font-semibold tabular-nums w-10 text-center">{water}/8</span>
            <button onClick={() => setWater(w => Math.min(12, w + 1))} className="h-7 w-7 rounded-full bg-sky-400/15 border border-sky-400/30 flex items-center justify-center active:scale-95"><Plus className="h-3 w-3 text-sky-200" /></button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-8 gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`h-6 rounded-md transition-all ${i < water ? "bg-gradient-to-b from-sky-400/50 to-sky-500/25 border border-sky-400/40" : "bg-white/[0.02] border border-white/5"}`} />
          ))}
        </div>
      </section>

      {/* ── Achievements ──────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".22s" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Achievements</h2>
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">{unlockedCount}/{badges.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {badges.map(b => {
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

      {/* ── Next milestone ETA ────────────────────── */}
      <section className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-primary/[0.08] to-transparent p-4 animate-slide-up" style={{ animationDelay: ".24s" }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <Medal className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Next milestone</p>
            <p className="text-sm font-semibold mt-0.5">{nextMilestone}-day streak</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary tabular-nums">{Math.max(0, nextMilestone - streak)}</p>
            <p className="text-[10px] text-muted-foreground">days left</p>
          </div>
        </div>
        <SegmentedBar pct={Math.min(100, (streak / nextMilestone) * 100)} segments={nextMilestone <= 14 ? nextMilestone : 10} className="mt-3" />
      </section>

      {/* ── Daily action cards ────────────────────── */}
      <section className="space-y-2 animate-slide-up" style={{ animationDelay: ".26s" }}>
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Today's nudges</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{daysToMilestone}d to milestone</span>
        </div>
        {proteinPct < 90 && (
          <ActionCard to="/scan" icon={<Dumbbell className="h-4 w-4" />} title={`Add ${Math.max(0, protein - Math.round(data.totals.protein))}g protein`} subtitle="Grill chicken or a whey shake closes the gap" />
        )}
        {water < 8 && (
          <ActionCard to="/profile" icon={<Droplets className="h-4 w-4" />} title={`Drink ${8 - water} more glasses`} subtitle="Hydration boosts recovery & focus" tone="sky" onClickCapture={() => setWater(w => Math.min(8, w + 1))} />
        )}
        {data.burned === 0 && (
          <ActionCard to="/workout" icon={<Activity className="h-4 w-4" />} title="Log a workout today" subtitle="Even 15 min protects your streak" />
        )}
        {streak >= 3 && (
          <ActionCard to="/scan" icon={<Flame className="h-4 w-4" />} title={`${streak}-day streak alive 🔥`} subtitle="Log one meal to extend it" tone="amber" />
        )}
      </section>

      {/* ── Program timeline ─────────────────────── */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".28s" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">12-week program</h2>
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">Week {weeksIn}/12</span>
        </div>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`h-6 rounded ${i < weeksIn ? "bg-primary/60" : i === weeksIn ? "bg-primary animate-pulse" : "bg-white/[0.04]"}`} />
          ))}
        </div>
      </section>

      {editing && <div className="hidden">{editing}</div>}
    </div>
  );
}

/* ─────────── Sub-components ─────────── */

function KpiCard({ icon, label, value, suffix, hint, pct }: { icon: React.ReactNode; label: string; value: number; suffix?: string; hint: string; pct: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <p className="text-2xl font-bold tabular-nums mt-1.5">
        {value}<span className="text-sm text-muted-foreground">{suffix}</span>
      </p>
      <div className="h-1 rounded-full bg-white/5 mt-2 overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%`, transition: "width 1s cubic-bezier(.2,.8,.2,1)" }} />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">{hint}</p>
    </div>
  );
}

function SegmentedBar({ pct, segments, className }: { pct: number; segments: number; className?: string }) {
  const filled = Math.round((pct / 100) * segments);
  return (
    <div className={`flex gap-1 mt-3 ${className ?? ""}`}>
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < filled ? "bg-primary" : "bg-white/5"}`} style={{ transitionDelay: `${i * 30}ms` }} />
      ))}
    </div>
  );
}

function MacroRow({ label, consumed, goal, unit, pct, tone }: { label: string; consumed: number; goal: number; unit: string; pct: number; tone: "primary" | "rose" | "amber" | "sky" }) {
  const toneMap = {
    primary: "bg-primary",
    rose: "bg-rose-400",
    amber: "bg-amber-400",
    sky: "bg-sky-400",
  } as const;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums"><span className="font-semibold text-foreground">{consumed}</span><span className="text-muted-foreground"> / {goal}{unit}</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full ${toneMap[tone]}`} style={{ width: `${pct}%`, transition: "width 1s cubic-bezier(.2,.8,.2,1)" }} />
      </div>
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

function StreakCard({ icon, label, value, unit, tone }: { icon: React.ReactNode; label: string; value: number | string; unit: string; tone: "primary" | "sky" | "violet" }) {
  const borderMap = { primary: "border-primary/15", sky: "border-sky-400/15", violet: "border-violet-400/15" };
  return (
    <div className={`rounded-2xl border ${borderMap[tone]} bg-white/[0.02] p-3.5`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <p className="text-xl font-bold tabular-nums mt-1">{value}<span className="text-[10px] text-muted-foreground ml-1 font-normal">{unit}</span></p>
    </div>
  );
}

function BodyStat({ label, value, unit, delta, positive, icon }: { label: string; value: string; unit: string; delta: string; positive: boolean; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-xl font-bold tabular-nums">{value}</span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
      <div className={`text-[10px] mt-0.5 tabular-nums ${positive ? "text-primary" : "text-amber-300"}`}>{delta} this week</div>
    </div>
  );
}

function ActionCard({ to, icon, title, subtitle, tone = "primary", onClickCapture }: { to: any; icon: React.ReactNode; title: string; subtitle: string; tone?: "primary" | "sky" | "amber"; onClickCapture?: () => void }) {
  const toneMap = {
    primary: "border-primary/20 bg-primary/[0.05] text-primary",
    sky: "border-sky-400/20 bg-sky-400/[0.05] text-sky-300",
    amber: "border-amber-400/20 bg-amber-400/[0.05] text-amber-300",
  } as const;
  return (
    <Link to={to} onClickCapture={onClickCapture} className={`flex items-center gap-3 rounded-2xl border p-3.5 active:scale-[0.99] transition ${toneMap[tone]}`}>
      <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 opacity-60" />
    </Link>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) {
    return <div className="h-14 mt-3 flex items-center justify-center text-[11px] text-muted-foreground">Log 2+ weights to see trend</div>;
  }
  const w = 320, h = 56, pad = 4;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${d} L${points[points.length - 1][0]},${h} L${points[0][0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14 mt-3" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.18 145 / 40%)" />
          <stop offset="100%" stopColor="oklch(0.78 0.18 145 / 0%)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spGrad)" />
      <path d={d} fill="none" stroke="oklch(0.78 0.18 145)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 2.5 : 1.5} fill="oklch(0.82 0.16 145)" />
      ))}
    </svg>
  );
}
