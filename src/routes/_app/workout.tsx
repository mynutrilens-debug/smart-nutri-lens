import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { workoutsQuery, dashboardQuery } from "@/lib/queries";
import { logWorkout, deleteWorkout, generateAiWorkout } from "@/lib/workout.functions";
import {
  Dumbbell, Heart, Flame, Wind, Activity, Trophy, Plus, Loader2, Trash2, X,
  Sparkles, Calendar, TrendingUp, Award, Zap, Target, Brain,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/workout")({
  component: Workout,
});

const types = [
  { key: "strength", label: "Strength", icon: Dumbbell, color: "oklch(0.84 0.18 145)", est: 8 },
  { key: "cardio",   label: "Cardio",   icon: Heart,    color: "oklch(0.7 0.22 25)",   est: 10 },
  { key: "hiit",     label: "HIIT",     icon: Flame,    color: "oklch(0.82 0.18 50)",  est: 13 },
  { key: "yoga",     label: "Yoga",     icon: Wind,     color: "oklch(0.74 0.22 295)", est: 4 },
  { key: "mobility", label: "Mobility", icon: Activity, color: "oklch(0.7 0.15 220)",  est: 3 },
  { key: "sports",   label: "Sports",   icon: Trophy,   color: "oklch(0.78 0.18 60)",  est: 9 },
] as const;
type TypeKey = typeof types[number]["key"];

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const todayIdx = () => (new Date().getDay() + 6) % 7;

function difficultyTone(d?: string) {
  switch ((d || "").toLowerCase()) {
    case "easy":     return { label: "Easy",     bg: "oklch(0.7 0.18 150 / 18%)", fg: "oklch(0.84 0.18 145)" };
    case "hard":     return { label: "Hard",     bg: "oklch(0.7 0.22 25 / 18%)",  fg: "oklch(0.78 0.2 25)" };
    default:         return { label: "Moderate", bg: "oklch(0.78 0.18 210 / 18%)", fg: "oklch(0.82 0.16 210)" };
  }
}

function Workout() {
  const { data: workouts } = useSuspenseQuery(workoutsQuery);
  const { data: dash } = useSuspenseQuery(dashboardQuery);
  const qc = useQueryClient();

  const profile: any = dash.profile ?? {};
  const aiPlan = profile.ai_plan?.workout_plan;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekly = workouts.filter(w => new Date(w.logged_at) >= weekAgo);
  const todays = workouts.filter(w => new Date(w.logged_at) >= today);
  const totalMin = weekly.reduce((a, w) => a + w.duration_min, 0);
  const totalKcal = weekly.reduce((a, w) => a + w.calories_burned, 0);
  const weeklyGoal = 150;

  // BMI
  const heightM = (profile.height_cm ?? 170) / 100;
  const bmi = +((profile.weight_kg ?? 70) / (heightM * heightM)).toFixed(1);
  const bmiCat =
    bmi < 18.5 ? { label: "Underweight", color: "oklch(0.78 0.15 220)" } :
    bmi < 25 ?   { label: "Healthy",     color: "oklch(0.78 0.18 150)" } :
    bmi < 30 ?   { label: "Overweight",  color: "oklch(0.82 0.18 60)"  } :
                 { label: "Obese",       color: "oklch(0.7 0.22 25)"   };

  // Streak: consecutive days with at least one workout, ending today or yesterday
  const streak = useMemo(() => {
    const set = new Set(workouts.map(w => new Date(w.logged_at).toDateString()));
    let s = 0;
    const d = new Date();
    if (!set.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (set.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
    return s;
  }, [workouts]);

  // Heatmap last 56 days
  const heatmap = useMemo(() => {
    const map = new Map<string, number>();
    workouts.forEach(w => {
      const k = new Date(w.logged_at).toDateString();
      map.set(k, (map.get(k) ?? 0) + w.duration_min);
    });
    const cells: { date: Date; mins: number }[] = [];
    const start = new Date(); start.setDate(start.getDate() - 55);
    for (let i = 0; i < 56; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      cells.push({ date: d, mins: map.get(d.toDateString()) ?? 0 });
    }
    return cells;
  }, [workouts]);

  // Achievements
  const achievements = [
    { id: "first", label: "First step", icon: Zap,    unlocked: workouts.length >= 1 },
    { id: "3day",  label: "3-day streak", icon: Flame, unlocked: streak >= 3 },
    { id: "week",  label: "150 min/week", icon: Target, unlocked: totalMin >= 150 },
    { id: "10ses", label: "10 sessions", icon: Trophy, unlocked: workouts.length >= 10 },
  ];

  // AI form
  const [aiOpen, setAiOpen] = useState(false);
  const [level, setLevel] = useState<"beginner"|"intermediate"|"pro">("intermediate");
  const [equipment, setEquipment] = useState<"none"|"home"|"gym">("home");
  const [injuries, setInjuries] = useState("");

  const gen = useMutation({
    mutationFn: () => generateAiWorkout({ data: {
      level, equipment,
      injuries: injuries.split(",").map(s => s.trim()).filter(Boolean).slice(0, 10),
    }}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Your AI plan is ready");
      setAiOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to generate plan"),
  });

  // Log modal
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TypeKey>("strength");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);

  const add = useMutation({
    mutationFn: () => {
      const meta = types.find(t => t.key === type)!;
      return logWorkout({ data: {
        name: name || meta.label,
        workout_type: type,
        duration_min: duration,
        calories_burned: Math.round(duration * meta.est),
      }});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Workout logged");
      setOpen(false); setName(""); setDuration(30);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteWorkout({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const logFromPlan = (d: any) => {
    const tk: TypeKey = (["strength","cardio","hiit","yoga","mobility","sports"].includes(d.workout_type)
      ? d.workout_type : "strength") as TypeKey;
    const meta = types.find(t => t.key === tk)!;
    return logWorkout({ data: {
      name: d.focus || meta.label,
      workout_type: tk,
      duration_min: d.duration_min || 30,
      calories_burned: d.calories || Math.round((d.duration_min || 30) * meta.est),
    }});
  };
  const quickLogPlan = useMutation({
    mutationFn: logFromPlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Logged from plan");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const todayPlan = aiPlan?.days?.[todayIdx()];

  return (
    <div className="px-5 pt-12 pb-32 space-y-5">
      {/* AI Coach Header */}
      <header className="relative overflow-hidden rounded-3xl p-5 animate-slide-up"
        style={{ background: "linear-gradient(140deg, oklch(0.22 0.06 250 / 90%), oklch(0.16 0.04 250 / 85%))",
                 border: "1px solid oklch(0.98 0.01 240 / 8%)" }}>
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl opacity-40"
             style={{ background: "radial-gradient(closest-side, oklch(0.72 0.22 240), transparent)" }} />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
              <Brain className="h-3 w-3" /> AI Coach
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {profile.display_name ? `Hey, ${profile.display_name.split(" ")[0]}` : "Training"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {aiPlan?.summary ?? "Tell me your level & equipment — I'll design a smart split tuned to your BMI and goal."}
            </p>
          </div>
          <button onClick={() => setAiOpen(true)}
            className="shrink-0 h-10 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5
                       bg-gradient-to-r from-primary to-accent text-primary-foreground active:scale-95
                       shadow-[0_8px_24px_-6px_oklch(0.72_0.22_240/55%)]">
            <Sparkles className="h-3.5 w-3.5" /> {aiPlan ? "Re-plan" : "Generate"}
          </button>
        </div>

        {/* Quick stats row */}
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <Stat label="Streak" value={`${streak}d`} icon={Flame} accent="oklch(0.82 0.18 50)" />
          <Stat label="BMI" value={String(bmi)} sub={bmiCat.label} icon={Activity} accent={bmiCat.color} />
          <Stat label="This week" value={`${totalMin}m`} sub={`${totalKcal} kcal`} icon={TrendingUp} accent="oklch(0.78 0.18 210)" />
        </div>
      </header>

      {/* Weekly progress */}
      <section className="glass rounded-3xl p-5 animate-slide-up" style={{ animationDelay: ".05s" }}>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Active minutes</div>
            <div className="text-3xl font-bold tabular-nums">{totalMin}<span className="text-base text-muted-foreground"> / {weeklyGoal}</span></div>
          </div>
          <button onClick={() => setOpen(true)}
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center active:scale-95">
            <Plus className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
            style={{ width: `${Math.min(100, (totalMin / weeklyGoal) * 100)}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{Math.max(0, weeklyGoal - totalMin)} min to weekly goal</span>
          <span className="text-accent font-semibold">{totalKcal} kcal burned</span>
        </div>
      </section>

      {/* Today's recommended */}
      <section className="animate-slide-up" style={{ animationDelay: ".08s" }}>
        <h3 className="text-sm font-semibold px-1 mb-2 flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-primary" /> Today's recommendation
        </h3>
        {todayPlan ? (
          <div className="glass-strong rounded-3xl p-4 border border-white/[0.06]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{DAYS[todayIdx()]} · {todayPlan.muscle_group?.replace("_"," ")}</div>
                <div className="mt-0.5 text-lg font-bold truncate">{todayPlan.focus}</div>
              </div>
              <DifficultyBadge d={todayPlan.difficulty} />
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span><b className="text-foreground tabular-nums">{todayPlan.duration_min}</b> min</span>
              <span><b className="text-accent tabular-nums">{todayPlan.calories}</b> kcal</span>
              <span className="capitalize">{todayPlan.workout_type}</span>
            </div>
            {todayPlan.exercises?.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {todayPlan.exercises.slice(0, 4).map((ex: any, i: number) => (
                  <li key={i} className="flex items-center justify-between text-[13px]">
                    <span className="truncate">{ex.name}</span>
                    <span className="text-muted-foreground tabular-nums shrink-0 ml-2">{ex.sets}×{ex.reps}</span>
                  </li>
                ))}
                {todayPlan.exercises.length > 4 && (
                  <li className="text-[11px] text-muted-foreground">+ {todayPlan.exercises.length - 4} more</li>
                )}
              </ul>
            )}
            <button disabled={quickLogPlan.isPending}
              onClick={() => quickLogPlan.mutate(todayPlan)}
              className="mt-4 w-full py-2.5 rounded-2xl bg-primary/90 text-primary-foreground text-sm font-semibold active:scale-[0.98] flex items-center justify-center gap-1.5">
              {quickLogPlan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Log this workout
            </button>
          </div>
        ) : (
          <div className="glass rounded-3xl p-5 text-center">
            <p className="text-sm text-muted-foreground">No AI plan yet. Tap <b className="text-foreground">Generate</b> for a personalized weekly split.</p>
          </div>
        )}
      </section>

      {/* Weekly split */}
      {aiPlan?.days?.length > 0 && (
        <section className="animate-slide-up" style={{ animationDelay: ".1s" }}>
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-sm font-semibold">Weekly split</h3>
            <span className="text-[11px] text-muted-foreground">{aiPlan.split_name}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
            {aiPlan.days.map((d: any, i: number) => {
              const active = i === todayIdx();
              const isRest = d.workout_type === "rest";
              return (
                <div key={i} className={`shrink-0 w-[148px] rounded-2xl p-3 border transition
                  ${active ? "border-primary/60 bg-primary/10" : "border-white/[0.06] bg-white/[0.03]"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.day}</span>
                    {!isRest && <DifficultyBadge d={d.difficulty} compact />}
                  </div>
                  <div className="mt-1.5 text-[13px] font-semibold leading-tight line-clamp-2">{d.focus}</div>
                  <div className="mt-2 text-[10px] text-muted-foreground tabular-nums">
                    {isRest ? "Rest day" : `${d.duration_min}m · ${d.calories}kcal`}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick start */}
      <section className="animate-slide-up" style={{ animationDelay: ".12s" }}>
        <h3 className="text-sm font-semibold px-1 mb-2">Quick start</h3>
        <div className="grid grid-cols-3 gap-2.5">
          {types.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => { setType(t.key); setOpen(true); }}
                className="glass rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-95 transition">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${t.color}20` }}>
                  <Icon className="h-4.5 w-4.5" style={{ color: t.color }} />
                </div>
                <span className="text-[11px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Heatmap */}
      <section className="glass rounded-3xl p-4 animate-slide-up" style={{ animationDelay: ".14s" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> Last 8 weeks</h3>
          <span className="text-[10px] text-muted-foreground">{workouts.length} sessions</span>
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {heatmap.map((c, i) => {
            const intensity = c.mins === 0 ? 0 : c.mins < 20 ? 1 : c.mins < 45 ? 2 : c.mins < 75 ? 3 : 4;
            const bg = intensity === 0
              ? "oklch(0.98 0.01 240 / 4%)"
              : `oklch(0.72 0.22 240 / ${15 + intensity * 18}%)`;
            return <div key={i} className="h-3 w-3 rounded-[3px]" style={{ background: bg }} title={`${c.date.toDateString()} · ${c.mins}m`} />;
          })}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0,1,2,3,4].map(i => (
            <div key={i} className="h-2.5 w-2.5 rounded-[2px]"
              style={{ background: i === 0 ? "oklch(0.98 0.01 240 / 4%)" : `oklch(0.72 0.22 240 / ${15 + i * 18}%)` }} />
          ))}
          <span>More</span>
        </div>
      </section>

      {/* Achievements */}
      <section className="animate-slide-up" style={{ animationDelay: ".16s" }}>
        <h3 className="text-sm font-semibold px-1 mb-2 flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-primary" /> Achievements</h3>
        <div className="grid grid-cols-4 gap-2">
          {achievements.map(a => {
            const Icon = a.icon;
            return (
              <div key={a.id} className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 border
                ${a.unlocked ? "bg-primary/10 border-primary/30" : "bg-white/[0.02] border-white/[0.04] opacity-50"}`}>
                <Icon className={`h-4 w-4 ${a.unlocked ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-[10px] font-medium text-center leading-tight">{a.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Today logged */}
      <section className="animate-slide-up" style={{ animationDelay: ".18s" }}>
        <h3 className="text-sm font-semibold px-1 mb-2">Today's log</h3>
        {todays.length === 0 ? (
          <div className="glass rounded-2xl p-4 text-center text-xs text-muted-foreground">
            Nothing logged yet today.
          </div>
        ) : (
          <div className="space-y-2">
            {todays.map(w => {
              const meta = types.find(t => t.key === w.workout_type) ?? types[0];
              const Icon = meta.icon;
              return (
                <div key={w.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}20` }}>
                    <Icon className="h-4 w-4" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{w.name}</div>
                    <div className="text-[11px] text-muted-foreground capitalize">{w.workout_type} · {w.duration_min} min</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums text-accent">{w.calories_burned}</div>
                    <div className="text-[10px] text-muted-foreground">kcal</div>
                  </div>
                  <button onClick={() => del.mutate(w.id)} className="text-muted-foreground/60 hover:text-destructive p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* History */}
      <section className="animate-slide-up" style={{ animationDelay: ".2s" }}>
        <h3 className="text-sm font-semibold px-1 mb-2">History</h3>
        <div className="space-y-2">
          {workouts.filter(w => new Date(w.logged_at) < today).slice(0, 12).map(w => {
            const meta = types.find(t => t.key === w.workout_type) ?? types[0];
            const Icon = meta.icon;
            const mg = (w as any).muscle_group as string | undefined;
            const diff = (w as any).difficulty as string | undefined;
            return (
              <div key={w.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}20` }}>
                  <Icon className="h-4 w-4" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{w.name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <span>{new Date(w.logged_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                    {mg && <><span>·</span><span className="capitalize">{mg.replace("_"," ")}</span></>}
                    {diff && <DifficultyBadge d={diff} compact />}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground tabular-nums">{w.duration_min}m</div>
                  <div className="text-xs text-accent font-semibold tabular-nums">{w.calories_burned} kcal</div>
                </div>
              </div>
            );
          })}
          {workouts.length === 0 && (
            <div className="glass rounded-2xl p-4 text-center text-xs text-muted-foreground">No history yet.</div>
          )}
        </div>
      </section>

      {/* AI generator sheet */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-end justify-center animate-slide-up" onClick={() => setAiOpen(false)}>
          <div className="w-full max-w-[460px] glass-strong rounded-t-[32px] p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> AI workout plan</h3>
              <button onClick={() => setAiOpen(false)} className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>

            <Field label="Level">
              <div className="flex gap-2">
                {(["beginner","intermediate","pro"] as const).map(l => (
                  <Chip key={l} active={level===l} onClick={() => setLevel(l)}>{l}</Chip>
                ))}
              </div>
            </Field>

            <Field label="Equipment">
              <div className="flex gap-2">
                {(["none","home","gym"] as const).map(e => (
                  <Chip key={e} active={equipment===e} onClick={() => setEquipment(e)}>{e}</Chip>
                ))}
              </div>
            </Field>

            <Field label="Injuries / limits (optional)">
              <input value={injuries} onChange={e => setInjuries(e.target.value)}
                placeholder="e.g. knee, lower back"
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-primary/60" />
            </Field>

            <div className="text-[11px] text-muted-foreground">
              Personalized to your profile: {profile.gender ?? "—"}, age {profile.age ?? "—"}, BMI {bmi}, goal {profile.physique_goal ?? "—"}.
            </div>

            <button disabled={gen.isPending} onClick={() => gen.mutate()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center gap-2">
              {gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {gen.isPending ? "Designing your split…" : "Generate plan"}
            </button>
          </div>
        </div>
      )}

      {/* Manual log sheet */}
      {open && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-end justify-center animate-slide-up" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[460px] glass-strong rounded-t-[32px] p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Log workout</h3>
              <button onClick={() => setOpen(false)} className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
              {types.map(t => (
                <button key={t.key} onClick={() => setType(t.key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${type === t.key ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Push day)"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-primary/60" />
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-semibold tabular-nums">{duration} min</span>
              </div>
              <input type="range" min={5} max={180} step={5} value={duration} onChange={e => setDuration(+e.target.value)}
                className="w-full accent-primary" />
            </div>
            <button disabled={add.isPending} onClick={() => add.mutate()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center gap-2">
              {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon, accent }: { label: string; value: string; sub?: string; icon: any; accent: string }) {
  return (
    <div className="rounded-2xl p-2.5 bg-white/[0.04] border border-white/[0.05]">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" style={{ color: accent }} /> {label}
      </div>
      <div className="mt-1 text-lg font-bold tabular-nums leading-none">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}

function DifficultyBadge({ d, compact }: { d?: string; compact?: boolean }) {
  const t = difficultyTone(d);
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"}`}
      style={{ background: t.bg, color: t.fg }}>
      {t.label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition
        ${active ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"}`}>
      {children}
    </button>
  );
}
