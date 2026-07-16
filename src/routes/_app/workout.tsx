import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { workoutsQuery, dashboardQuery } from "@/lib/queries";
import { logWorkout, deleteWorkout, generateAiWorkout } from "@/lib/workout.functions";
import {
  Dumbbell, Heart, Flame, Wind, Activity, Trophy, Plus, Loader2, Trash2, X,
  Sparkles, Calendar, TrendingUp, Award, Zap, Target, Brain, Play, Pause,
  ChevronDown, ChevronRight, Check, PlayCircle, Timer, RotateCcw, SkipForward,
  Lightbulb, Crosshair, History, Medal,
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

const NEON = "oklch(0.84 0.20 145)";
const NEON_SOFT = "oklch(0.84 0.20 145 / 15%)";

function difficultyTone(d?: string) {
  switch ((d || "").toLowerCase()) {
    case "easy":     return { label: "Easy",     bg: "oklch(0.7 0.18 150 / 18%)", fg: "oklch(0.84 0.18 145)" };
    case "hard":     return { label: "Hard",     bg: "oklch(0.7 0.22 25 / 18%)",  fg: "oklch(0.78 0.2 25)" };
    default:         return { label: "Moderate", bg: "oklch(0.78 0.18 210 / 18%)", fg: "oklch(0.82 0.16 210)" };
  }
}

function ytUrl(name: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " proper form tutorial")}`;
}

// Infer target muscles from exercise name (fallback when AI doesn't include them)
function inferMuscles(name: string, focus?: string): string[] {
  const n = (name + " " + (focus || "")).toLowerCase();
  const map: [RegExp, string[]][] = [
    [/bench|push[- ]?up|chest|fly/i, ["Chest", "Triceps", "Shoulders"]],
    [/squat|lunge|leg press|step[- ]?up/i, ["Quads", "Glutes", "Hamstrings"]],
    [/deadlift|rdl|romanian/i, ["Hamstrings", "Glutes", "Back"]],
    [/row|pull[- ]?up|lat|pulldown/i, ["Back", "Biceps"]],
    [/curl/i, ["Biceps", "Forearms"]],
    [/tricep|dip|skull/i, ["Triceps"]],
    [/shoulder|press|lateral|delt/i, ["Shoulders", "Triceps"]],
    [/plank|crunch|ab|core|russian/i, ["Core", "Abs"]],
    [/calf|raise/i, ["Calves"]],
    [/glute|hip thrust|bridge/i, ["Glutes", "Hamstrings"]],
    [/burpee|jumping|mountain|hiit|jump/i, ["Full Body", "Cardio"]],
    [/run|jog|bike|cycl|row(ing)?|ellipt/i, ["Cardio", "Legs"]],
    [/stretch|mobility|yoga|cobra|child/i, ["Mobility"]],
  ];
  for (const [re, m] of map) if (re.test(n)) return m;
  return ["Full Body"];
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

  const heightM = (profile.height_cm ?? 170) / 100;
  const bmi = +((profile.weight_kg ?? 70) / (heightM * heightM)).toFixed(1);

  const streak = useMemo(() => {
    const set = new Set(workouts.map(w => new Date(w.logged_at).toDateString()));
    let s = 0;
    const d = new Date();
    if (!set.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (set.has(d.toDateString())) { s++; d.setDate(d.getDate() - 1); }
    return s;
  }, [workouts]);

  // Personal records — longest session, most kcal in one session, most sessions/week
  const prs = useMemo(() => {
    const longest = workouts.reduce((m, w) => Math.max(m, w.duration_min), 0);
    const hottest = workouts.reduce((m, w) => Math.max(m, w.calories_burned), 0);
    const byWeek = new Map<string, number>();
    workouts.forEach(w => {
      const d = new Date(w.logged_at);
      const y = d.getFullYear();
      const oneJan = new Date(y, 0, 1);
      const wk = Math.ceil(((+d - +oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
      const k = `${y}-${wk}`;
      byWeek.set(k, (byWeek.get(k) ?? 0) + 1);
    });
    const bestWeek = [...byWeek.values()].reduce((a, b) => Math.max(a, b), 0);
    return { longest, hottest, bestWeek, total: workouts.length };
  }, [workouts]);

  // Previous performance for an exercise name (from last logged workout containing it)
  const lastPerf = (exName: string) => {
    const prev = workouts.find(w => (w.name || "").toLowerCase().includes(exName.toLowerCase()));
    return prev ? new Date(prev.logged_at) : null;
  };

  // AI generator sheet
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

  // Manual log sheet
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

  const todayPlan = aiPlan?.days?.[todayIdx()];
  const exercises: any[] = todayPlan?.exercises ?? [];

  // -------- Live session state --------
  const [session, setSession] = useState<null | {
    startedAt: number;
    completed: Record<string, boolean>; // key = `${exIdx}:${setIdx}`
  }>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });
  const [rest, setRest] = useState<{ remaining: number; total: number } | null>(null);
  // weights[exerciseIdx][setIdx] = kg string
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [loggedEx, setLoggedEx] = useState<Record<number, boolean>>({});

  const setWeight = (exIdx: number, setIdx: number, val: string) =>
    setWeights(w => ({ ...w, [`${exIdx}:${setIdx}`]: val }));

  const estimateExerciseKcal = (ex: any, exIdx: number) => {
    const setCount = Number(ex.sets) || 3;
    const repsNum = parseInt(String(ex.reps).match(/\d+/)?.[0] ?? "10", 10) || 10;
    const bw = Number(profile.weight_kg) || 70;
    let volume = 0;
    let weighted = 0;
    for (let s = 0; s < setCount; s++) {
      const kg = parseFloat(weights[`${exIdx}:${s}`] || "");
      if (!isNaN(kg) && kg > 0) { volume += kg * repsNum; weighted++; }
    }
    // Strength kcal: ~0.05/kg-rep of external load + base 4 kcal per set (from bodyweight/effort)
    const base = setCount * 4 + Math.round(bw * 0.04 * setCount);
    const load = Math.round(volume * 0.05);
    return Math.max(8, base + load);
  };

  const estimateExerciseMin = (ex: any) => {
    const setCount = Number(ex.sets) || 3;
    const rest_sec = Number(ex.rest_sec) || 60;
    return Math.max(1, Math.round((setCount * (30 + rest_sec)) / 60));
  };

  const logExMut = useMutation({
    mutationFn: (payload: { name: string; duration_min: number; calories_burned: number }) =>
      logWorkout({ data: {
        name: payload.name,
        workout_type: "strength",
        duration_min: payload.duration_min,
        calories_burned: payload.calories_burned,
      }}),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Logged · ${vars.calories_burned} kcal 🔥`);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to log"),
  });

  const logExercise = (ex: any, exIdx: number) => {
    const kcal = estimateExerciseKcal(ex, exIdx);
    const mins = estimateExerciseMin(ex);
    logExMut.mutate({ name: ex.name, duration_min: mins, calories_burned: kcal });
    setLoggedEx(l => ({ ...l, [exIdx]: true }));
  };

  useEffect(() => {
    if (!rest) return;
    if (rest.remaining <= 0) { setRest(null); toast.success("Rest done — next set 💪"); return; }
    const t = setTimeout(() => setRest(r => r ? { ...r, remaining: r.remaining - 1 } : null), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const totalSets = useMemo(
    () => exercises.reduce((a, e) => a + (Number(e.sets) || 1), 0),
    [exercises]
  );
  const doneSets = useMemo(
    () => (session ? Object.values(session.completed).filter(Boolean).length : 0),
    [session]
  );
  const progressPct = totalSets ? Math.min(100, (doneSets / totalSets) * 100) : 0;

  const startSession = () => {
    setSession({ startedAt: Date.now(), completed: {} });
    setExpanded({ 0: true });
    toast.success("Workout started — let's go!");
  };

  const toggleSet = (exIdx: number, setIdx: number, rest_sec?: number) => {
    if (!session) return;
    const k = `${exIdx}:${setIdx}`;
    const wasDone = session.completed[k];
    setSession(s => s ? { ...s, completed: { ...s.completed, [k]: !wasDone } } : s);
    if (!wasDone && rest_sec) setRest({ remaining: rest_sec, total: rest_sec });
  };

  const finishMut = useMutation({
    mutationFn: () => {
      if (!session || !todayPlan) throw new Error("No active session");
      const elapsedMin = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000));
      const ratio = totalSets ? doneSets / totalSets : 1;
      const kcal = Math.round((todayPlan.calories ?? elapsedMin * 8) * Math.max(0.4, ratio));
      const tk: TypeKey = (["strength","cardio","hiit","yoga","mobility","sports"].includes(todayPlan.workout_type)
        ? todayPlan.workout_type : "strength") as TypeKey;
      return logWorkout({ data: {
        name: todayPlan.focus || "Workout",
        workout_type: tk,
        duration_min: elapsedMin,
        calories_burned: kcal,
      }});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Great work — session saved 🔥");
      setSession(null); setRest(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const elapsedLabel = useTicker(session?.startedAt);

  return (
    <div className="px-5 pt-12 pb-32 space-y-5">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-[28px] p-5 animate-slide-up"
        style={{
          background: "linear-gradient(150deg, oklch(0.16 0.03 155), oklch(0.10 0.02 160))",
          border: "1px solid oklch(0.84 0.20 145 / 22%)",
          boxShadow: "0 0 60px -20px oklch(0.84 0.20 145 / 30%)",
        }}>
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl opacity-50"
          style={{ background: `radial-gradient(closest-side, ${NEON}, transparent)` }} />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[oklch(0.84_0.20_145)]">
              <Brain className="h-3 w-3" /> AI Trainer
            </div>
            <h1 className="mt-1 text-[26px] font-black tracking-tight leading-tight">
              {profile.display_name ? `Let's train, ${profile.display_name.split(" ")[0]}` : "Let's train"}
            </h1>
            <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2">
              {aiPlan?.summary ?? "Tell me your level & gear — I'll build a smart split tuned to your goal."}
            </p>
          </div>
          <button onClick={() => setAiOpen(true)}
            className="shrink-0 h-10 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 text-black active:scale-95"
            style={{ background: `linear-gradient(135deg, ${NEON}, oklch(0.9 0.2 135))`, boxShadow: `0 8px 24px -6px ${NEON}` }}>
            <Sparkles className="h-3.5 w-3.5" /> {aiPlan ? "Re-plan" : "Generate"}
          </button>
        </div>

        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <Stat label="Streak" value={`${streak}`} sub="days" icon={Flame} accent="oklch(0.82 0.18 50)" />
          <Stat label="This week" value={`${totalMin}`} sub={`/ ${weeklyGoal} min`} icon={TrendingUp} accent={NEON} />
          <Stat label="Burned" value={`${totalKcal}`} sub="kcal" icon={Zap} accent="oklch(0.82 0.18 60)" />
        </div>

        {/* Weekly bar */}
        <div className="relative mt-3">
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, (totalMin / weeklyGoal) * 100)}%`,
                background: `linear-gradient(90deg, ${NEON}, oklch(0.92 0.2 130))`,
                boxShadow: `0 0 12px ${NEON}`,
              }} />
          </div>
        </div>
      </header>

      {/* Weekly split rail */}
      {aiPlan?.days?.length > 0 && (
        <section className="animate-slide-up" style={{ animationDelay: ".04s" }}>
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-sm font-bold">Weekly split</h3>
            <span className="text-[11px] text-muted-foreground truncate max-w-[60%]">{aiPlan.split_name}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 snap-x">
            {aiPlan.days.map((d: any, i: number) => {
              const active = i === todayIdx();
              const isRest = d.workout_type === "rest";
              return (
                <div key={i} className={`snap-start shrink-0 w-[128px] rounded-2xl p-3 border transition
                  ${active
                    ? "border-[oklch(0.84_0.20_145/60%)] bg-[oklch(0.84_0.20_145/10%)]"
                    : "border-white/[0.06] bg-white/[0.03]"}`}
                  style={active ? { boxShadow: `0 0 20px -8px ${NEON}` } : undefined}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase tracking-widest ${active ? "text-[oklch(0.84_0.20_145)] font-bold" : "text-muted-foreground"}`}>{d.day}</span>
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

      {/* Today's session */}
      {todayPlan ? (
        <section className="animate-slide-up space-y-3" style={{ animationDelay: ".08s" }}>
          {/* Session header card */}
          <div className="relative rounded-[26px] p-5 overflow-hidden"
            style={{
              background: "linear-gradient(145deg, oklch(0.18 0.02 160), oklch(0.11 0.015 160))",
              border: "1px solid oklch(1 0 0 / 6%)",
            }}>
            <div className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: `linear-gradient(90deg, transparent, ${NEON}, transparent)` }} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{DAYS[todayIdx()]} · Today</div>
                <div className="mt-0.5 text-2xl font-black leading-tight truncate">{todayPlan.focus}</div>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px]">
                  <DifficultyBadge d={todayPlan.difficulty} />
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-muted-foreground capitalize">{todayPlan.workout_type}</span>
                  {todayPlan.muscle_group && (
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-muted-foreground capitalize">{String(todayPlan.muscle_group).replace("_"," ")}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-black tabular-nums" style={{ color: NEON }}>{exercises.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Exercises</div>
              </div>
            </div>

            {/* Big session metrics */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MetricTile label="Duration" value={`${todayPlan.duration_min ?? 30}m`} />
              <MetricTile label="Volume" value={`${totalSets} sets`} />
              <MetricTile label="Est. burn" value={`${todayPlan.calories ?? 0} kcal`} accent />
            </div>

            {/* Live progress */}
            {session && (
              <div className="mt-4 rounded-2xl p-3 border border-[oklch(0.84_0.20_145/25%)]"
                style={{ background: `linear-gradient(135deg, ${NEON_SOFT}, transparent)` }}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: NEON }}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: NEON }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: NEON }} />
                    </span>
                    Live · {elapsedLabel}
                  </div>
                  <div className="tabular-nums font-semibold">{doneSets}/{totalSets} sets</div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${NEON}, oklch(0.92 0.2 130))`, boxShadow: `0 0 10px ${NEON}` }} />
                </div>
              </div>
            )}

            {/* Start / Finish button */}
            {!session ? (
              <button onClick={startSession}
                className="mt-4 w-full h-14 rounded-2xl font-black text-black text-base flex items-center justify-center gap-2 active:scale-[0.98] transition"
                style={{ background: `linear-gradient(135deg, ${NEON}, oklch(0.92 0.2 130))`, boxShadow: `0 12px 30px -8px ${NEON}` }}>
                <Play className="h-5 w-5 fill-black" /> Start Workout
              </button>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => { setSession(null); setRest(null); toast("Session cancelled"); }}
                  className="h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-sm font-semibold flex items-center justify-center gap-1.5">
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button disabled={finishMut.isPending} onClick={() => finishMut.mutate()}
                  className="h-12 rounded-2xl font-black text-black text-sm flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg, ${NEON}, oklch(0.92 0.2 130))`, boxShadow: `0 8px 24px -6px ${NEON}` }}>
                  {finishMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Finish
                </button>
              </div>
            )}
          </div>

          {/* Warm-up */}
          <PhaseCard
            tone="warm"
            icon={Flame}
            title="Warm-up"
            duration="5 min"
            items={[
              "2 min light cardio (jog / jumping jacks)",
              "10 arm circles + 10 leg swings each side",
              "1 set of the first exercise at 40% effort",
            ]}
          />

          {/* Exercises header */}
          <div className="flex items-center justify-between px-1 pt-1">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Dumbbell className="h-4 w-4" style={{ color: NEON }} /> Exercises
            </h3>
            <button onClick={() => {
              const allOpen = exercises.every((_, i) => expanded[i]);
              const next: Record<number, boolean> = {};
              exercises.forEach((_, i) => { next[i] = !allOpen; });
              setExpanded(next);
            }} className="text-[11px] text-muted-foreground hover:text-foreground">
              {exercises.every((_, i) => expanded[i]) ? "Collapse all" : "Expand all"}
            </button>
          </div>

          {/* Full exercise list — every exercise visible */}
          <div className="space-y-2.5">
            {exercises.map((ex: any, i: number) => (
              <ExerciseCard
                key={i}
                idx={i}
                ex={ex}
                open={!!expanded[i]}
                onToggle={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
                session={session}
                onToggleSet={(sIdx) => toggleSet(i, sIdx, Number(ex.rest_sec) || 60)}
                lastDone={lastPerf(ex.name)}
              />
            ))}
            {exercises.length === 0 && (
              <div className="glass rounded-2xl p-6 text-center text-xs text-muted-foreground">
                No exercises in today's plan. Try re-generating.
              </div>
            )}
          </div>

          {/* Cool-down */}
          <PhaseCard
            tone="cool"
            icon={Wind}
            title="Cool-down"
            duration="5 min"
            items={[
              "3 min easy walk to bring HR down",
              "Static stretch worked muscles 30s each",
              "Deep breathing 4-7-8 for 1 min",
            ]}
          />

          {/* AI Tips */}
          {aiPlan?.tips?.length > 0 && (
            <div className="rounded-3xl p-4 border border-white/[0.06]"
              style={{ background: "linear-gradient(140deg, oklch(0.18 0.03 155), oklch(0.12 0.02 160))" }}>
              <div className="flex items-center gap-1.5 text-sm font-bold mb-2">
                <Lightbulb className="h-4 w-4" style={{ color: NEON }} /> Coach's tips
              </div>
              <ul className="space-y-1.5">
                {aiPlan.tips.map((t: string, i: number) => (
                  <li key={i} className="flex gap-2 text-[13px] text-muted-foreground">
                    <span style={{ color: NEON }}>•</span> <span className="flex-1">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <section className="glass rounded-3xl p-6 text-center animate-slide-up">
          <div className="h-14 w-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
            style={{ background: NEON_SOFT }}>
            <Sparkles className="h-6 w-6" style={{ color: NEON }} />
          </div>
          <h3 className="text-lg font-bold">No plan yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Generate a personalized weekly split tuned to your BMI and goal.</p>
          <button onClick={() => setAiOpen(true)}
            className="mt-4 h-12 px-6 rounded-2xl text-black font-black active:scale-95"
            style={{ background: `linear-gradient(135deg, ${NEON}, oklch(0.92 0.2 130))` }}>
            Generate my plan
          </button>
        </section>
      )}

      {/* Personal records */}
      <section className="animate-slide-up" style={{ animationDelay: ".12s" }}>
        <h3 className="text-sm font-bold px-1 mb-2 flex items-center gap-1.5">
          <Medal className="h-4 w-4" style={{ color: NEON }} /> Personal records
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <PrCard label="Longest session" value={prs.longest ? `${prs.longest} min` : "—"} icon={Timer} />
          <PrCard label="Biggest burn" value={prs.hottest ? `${prs.hottest} kcal` : "—"} icon={Flame} />
          <PrCard label="Best week" value={prs.bestWeek ? `${prs.bestWeek} sessions` : "—"} icon={Trophy} />
          <PrCard label="Total sessions" value={String(prs.total)} icon={Award} />
        </div>
      </section>

      {/* Quick log */}
      <section className="animate-slide-up" style={{ animationDelay: ".14s" }}>
        <div className="flex items-center justify-between px-1 mb-2">
          <h3 className="text-sm font-bold">Quick log</h3>
          <button onClick={() => setOpen(true)} className="text-[11px] font-semibold" style={{ color: NEON }}>Custom +</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {types.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => { setType(t.key); setOpen(true); }}
                className="rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-95 transition border border-white/[0.05] bg-white/[0.03]">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${t.color}22` }}>
                  <Icon className="h-4 w-4" style={{ color: t.color }} />
                </div>
                <span className="text-[11px] font-semibold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* History */}
      <section className="animate-slide-up" style={{ animationDelay: ".16s" }}>
        <h3 className="text-sm font-bold px-1 mb-2 flex items-center gap-1.5">
          <History className="h-4 w-4" style={{ color: NEON }} /> Recent
        </h3>
        <div className="space-y-2">
          {todays.map(w => {
            const meta = types.find(t => t.key === w.workout_type) ?? types[0];
            const Icon = meta.icon;
            return (
              <div key={w.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}22` }}>
                  <Icon className="h-4 w-4" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{w.name}</div>
                  <div className="text-[11px] text-muted-foreground">Today · {w.duration_min} min</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold tabular-nums" style={{ color: NEON }}>{w.calories_burned}</div>
                  <div className="text-[10px] text-muted-foreground">kcal</div>
                </div>
                <button onClick={() => del.mutate(w.id)} className="text-muted-foreground/60 hover:text-destructive p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          {workouts.filter(w => new Date(w.logged_at) < today).slice(0, 8).map(w => {
            const meta = types.find(t => t.key === w.workout_type) ?? types[0];
            const Icon = meta.icon;
            return (
              <div key={w.id} className="rounded-2xl p-3 flex items-center gap-3 bg-white/[0.03] border border-white/[0.05]">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}22` }}>
                  <Icon className="h-4 w-4" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{w.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(w.logged_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground tabular-nums">{w.duration_min}m</div>
                  <div className="text-xs font-semibold tabular-nums" style={{ color: NEON }}>{w.calories_burned} kcal</div>
                </div>
              </div>
            );
          })}
          {workouts.length === 0 && (
            <div className="glass rounded-2xl p-4 text-center text-xs text-muted-foreground">No history yet.</div>
          )}
        </div>
      </section>

      {/* Rest timer overlay */}
      {rest && (
        <div className="fixed inset-x-0 z-40 flex justify-center pointer-events-none"
          style={{ bottom: "calc(100px + env(safe-area-inset-bottom))" }}>
          <div className="pointer-events-auto w-[min(420px,calc(100vw-24px))] rounded-2xl p-3 backdrop-blur-xl border animate-slide-up"
            style={{
              background: "oklch(0.10 0.015 160 / 90%)",
              borderColor: "oklch(0.84 0.20 145 / 40%)",
              boxShadow: `0 20px 40px -10px ${NEON}`,
            }}>
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="17" fill="none" stroke="oklch(1 0 0 / 8%)" strokeWidth="3" />
                  <circle cx="20" cy="20" r="17" fill="none" stroke={NEON} strokeWidth="3"
                    strokeDasharray={2 * Math.PI * 17}
                    strokeDashoffset={2 * Math.PI * 17 * (1 - rest.remaining / rest.total)}
                    strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
                </svg>
                <Timer className="h-4 w-4" style={{ color: NEON }} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Rest</div>
                <div className="text-xl font-black tabular-nums" style={{ color: NEON }}>
                  {String(Math.floor(rest.remaining / 60)).padStart(1,"0")}:{String(rest.remaining % 60).padStart(2,"0")}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setRest(r => r ? { ...r, remaining: Math.min(r.total, r.remaining + 15), total: Math.max(r.total, r.remaining + 15) } : null)}
                  className="h-9 px-2 rounded-xl bg-white/[0.06] text-[11px] font-semibold flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" /> +15
                </button>
                <button onClick={() => setRest(null)}
                  className="h-9 px-2 rounded-xl text-black font-bold text-[11px] flex items-center gap-1"
                  style={{ background: NEON }}>
                  <SkipForward className="h-3 w-3" /> Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI generator sheet */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-end justify-center animate-slide-up" onClick={() => setAiOpen(false)}>
          <div className="w-full max-w-[460px] glass-strong rounded-t-[32px] p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-1.5"><Sparkles className="h-4 w-4" style={{ color: NEON }} /> AI workout plan</h3>
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
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[oklch(0.84_0.20_145/60%)]" />
            </Field>
            <div className="text-[11px] text-muted-foreground">
              Personalized to: {profile.gender ?? "—"}, age {profile.age ?? "—"}, BMI {bmi}, goal {profile.physique_goal ?? "—"}.
            </div>
            <button disabled={gen.isPending} onClick={() => gen.mutate()}
              className="w-full h-12 rounded-2xl text-black font-black flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${NEON}, oklch(0.92 0.2 130))` }}>
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
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${type === t.key ? "text-black" : "bg-white/5 text-muted-foreground"}`}
                  style={type === t.key ? { background: NEON } : undefined}>
                  {t.label}
                </button>
              ))}
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Push day)"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[oklch(0.84_0.20_145/60%)]" />
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-semibold tabular-nums">{duration} min</span>
              </div>
              <input type="range" min={5} max={180} step={5} value={duration} onChange={e => setDuration(+e.target.value)}
                className="w-full" style={{ accentColor: NEON }} />
            </div>
            <button disabled={add.isPending} onClick={() => add.mutate()}
              className="w-full h-12 rounded-2xl text-black font-black flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${NEON}, oklch(0.92 0.2 130))` }}>
              {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function useTicker(startedAt?: number) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => force(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return "0:00";
  const s = Math.floor((Date.now() - startedAt) / 1000);
  const m = Math.floor(s / 60), ss = s % 60;
  return `${m}:${String(ss).padStart(2, "0")}`;
}

function Stat({ label, value, sub, icon: Icon, accent }: { label: string; value: string; sub?: string; icon: any; accent: string }) {
  return (
    <div className="rounded-2xl p-2.5 bg-white/[0.04] border border-white/[0.05]">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" style={{ color: accent }} /> {label}
      </div>
      <div className="mt-1 text-xl font-black tabular-nums leading-none">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}

function MetricTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl p-3 bg-black/30 border border-white/[0.05]">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-black tabular-nums" style={accent ? { color: NEON } : undefined}>{value}</div>
    </div>
  );
}

function PrCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-2xl p-3 bg-white/[0.03] border border-white/[0.05] flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: NEON_SOFT }}>
        <Icon className="h-4 w-4" style={{ color: NEON }} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{label}</div>
        <div className="text-sm font-black tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function DifficultyBadge({ d, compact }: { d?: string; compact?: boolean }) {
  const t = difficultyTone(d);
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"}`}
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
      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition
        ${active ? "text-black" : "bg-white/5 text-muted-foreground"}`}
      style={active ? { background: NEON } : undefined}>
      {children}
    </button>
  );
}

function PhaseCard({ tone, icon: Icon, title, duration, items }: {
  tone: "warm" | "cool"; icon: any; title: string; duration: string; items: string[];
}) {
  const color = tone === "warm" ? "oklch(0.82 0.18 50)" : "oklch(0.74 0.15 220)";
  return (
    <div className="rounded-2xl p-4 border border-white/[0.05]"
      style={{ background: `linear-gradient(140deg, ${color}12, transparent 70%)` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <div>
            <div className="text-sm font-bold">{title}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{duration}</div>
          </div>
        </div>
      </div>
      <ul className="space-y-1 pl-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-[12px] text-muted-foreground">
            <span style={{ color }}>›</span> <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExerciseCard({ idx, ex, open, onToggle, session, onToggleSet, lastDone }: {
  idx: number;
  ex: any;
  open: boolean;
  onToggle: () => void;
  session: null | { startedAt: number; completed: Record<string, boolean> };
  onToggleSet: (setIdx: number) => void;
  lastDone: Date | null;
}) {
  const setCount = Number(ex.sets) || 3;
  const sets = Array.from({ length: setCount });
  const muscles = Array.isArray(ex.target_muscles) && ex.target_muscles.length ? ex.target_muscles : inferMuscles(ex.name, ex.focus);
  const doneCount = session ? sets.filter((_, i) => session.completed[`${idx}:${i}`]).length : 0;
  const allDone = session && doneCount === setCount;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300
      ${allDone ? "border-[oklch(0.84_0.20_145/50%)]" : "border-white/[0.06]"}`}
      style={{
        background: allDone
          ? `linear-gradient(140deg, ${NEON_SOFT}, oklch(0.13 0.02 160))`
          : "linear-gradient(140deg, oklch(0.17 0.015 160), oklch(0.13 0.015 160))",
      }}>
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left active:scale-[0.99] transition">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 tabular-nums
          ${allDone ? "text-black" : "text-white"}`}
          style={{
            background: allDone ? NEON : "oklch(1 0 0 / 5%)",
            boxShadow: allDone ? `0 0 16px ${NEON}` : undefined,
          }}>
          {allDone ? <Check className="h-5 w-5" strokeWidth={3} /> : String(idx + 1).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold leading-tight truncate">{ex.name}</div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.06] font-semibold tabular-nums">
              {ex.sets}<span className="text-muted-foreground mx-0.5">×</span>{ex.reps}
            </span>
            {ex.rest_sec && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Timer className="h-2.5 w-2.5" /> {ex.rest_sec}s
              </span>
            )}
            {session && (
              <span className="text-[10px] tabular-nums" style={{ color: NEON }}>
                {doneCount}/{setCount}
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-4 pb-4 space-y-3 animate-slide-up">
          {/* Target muscles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Crosshair className="h-3 w-3 text-muted-foreground" />
            {muscles.map((m: string, i: number) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-muted-foreground uppercase tracking-wider font-semibold">
                {m}
              </span>
            ))}
          </div>

          {/* Set tracker — big numbers */}
          <div className="rounded-xl bg-black/40 border border-white/[0.05] overflow-hidden">
            <div className="grid grid-cols-[42px_1fr_1fr_44px] text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 border-b border-white/[0.04]">
              <div>Set</div>
              <div className="text-center">Reps</div>
              <div className="text-center">Weight</div>
              <div />
            </div>
            {sets.map((_, sIdx) => {
              const done = session?.completed[`${idx}:${sIdx}`];
              return (
                <div key={sIdx}
                  className={`grid grid-cols-[42px_1fr_1fr_44px] items-center px-3 py-2.5 border-b border-white/[0.03] last:border-0 transition
                    ${done ? "bg-[oklch(0.84_0.20_145/10%)]" : ""}`}>
                  <div className="text-base font-black tabular-nums" style={done ? { color: NEON } : undefined}>{sIdx + 1}</div>
                  <div className="text-center text-lg font-bold tabular-nums">{ex.reps}</div>
                  <div className="text-center text-sm text-muted-foreground tabular-nums">
                    <input
                      type="text"
                      placeholder="—"
                      className="w-16 bg-transparent text-center text-base font-bold outline-none focus:text-white"
                    />
                    <span className="text-[10px] ml-0.5">kg</span>
                  </div>
                  <button
                    disabled={!session}
                    onClick={() => onToggleSet(sIdx)}
                    className={`h-8 w-8 mx-auto rounded-lg flex items-center justify-center transition
                      ${done ? "text-black" : "bg-white/[0.05] text-muted-foreground"}
                      ${!session ? "opacity-40 cursor-not-allowed" : "active:scale-90"}`}
                    style={done ? { background: NEON, boxShadow: `0 0 12px ${NEON}` } : undefined}>
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Previous performance */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <History className="h-3 w-3" />
            {lastDone ? (
              <span>Last done <b className="text-foreground">{timeAgo(lastDone)}</b></span>
            ) : (
              <span>No previous record — set the baseline today 🎯</span>
            )}
          </div>

          {/* Coach tip */}
          {ex.tip && (
            <div className="rounded-xl p-3 border flex gap-2"
              style={{ background: NEON_SOFT, borderColor: "oklch(0.84 0.20 145 / 25%)" }}>
              <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: NEON }} />
              <p className="text-[12px] leading-snug">{ex.tip}</p>
            </div>
          )}

          {/* Watch demo */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = ytUrl(ex.name);
              const win = window.open(url, "_blank", "noopener,noreferrer");
              if (!win) window.top ? (window.top.location.href = url) : (window.location.href = url);
            }}
            className="w-full h-11 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center gap-2 text-sm font-bold transition active:scale-[0.98]">
            <PlayCircle className="h-4 w-4" style={{ color: NEON }} />
            Watch Demo <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}

function timeAgo(d: Date) {
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const wks = Math.floor(days / 7);
  if (wks < 4) return `${wks} wk ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
