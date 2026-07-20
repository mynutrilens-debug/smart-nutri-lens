import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useSuspenseQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { dashboardQuery } from "@/lib/queries";
import { MacroRings } from "@/components/mobile/MacroRings";
import {
  Flame, Sparkles, Trophy, Plus, Loader2, Zap, Target, CheckCircle2,
  Circle, Camera, Dumbbell, Droplet, Scale, TrendingUp, ChevronRight, Crown, Users,
} from "lucide-react";
import { generateInsight } from "@/lib/scan.functions";
import { listMySquads } from "@/lib/squad.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/home")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(dashboardQuery);
  const qc = useQueryClient();
  const profile = data.profile;
  const squadsFn = useServerFn(listMySquads);
  const { data: squads = [] } = useQuery({ queryKey: ["squads"], queryFn: () => squadsFn(), staleTime: 60_000 });

  useEffect(() => {
    if (profile && !profile.onboarded_at) navigate({ to: "/onboarding", replace: true });
  }, [profile, navigate]);

  const greet = (() => {
    const h = new Date().getHours();
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
    fat: profile?.fat_goal_g ?? 70,
  };

  // XP & level (client-derived)
  const mealsLogged = data.recentFoods.length;
  const xp = streak * 50 + mealsLogged * 25 + (burned > 0 ? 100 : 0);
  const level = Math.floor(xp / 500) + 1;
  const xpInto = xp % 500;
  const xpPct = (xpInto / 500) * 100;

  // Countdown
  const startDate = profile?.onboarded_at ? new Date(profile.onboarded_at) : null;
  const targetDate = startDate ? new Date(startDate.getTime() + 12 * 7 * 86400000) : null;
  const daysLeft = targetDate ? Math.max(0, Math.ceil((targetDate.getTime() - Date.now()) / 86400000)) : null;
  const weekNum = startDate ? Math.min(12, Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (7 * 86400000)))) : 1;

  // Transformation %
  const startW = Number(profile?.weight_kg ?? 0);
  const targetW = Number(profile?.target_weight_kg ?? 0);
  const transformPct = startW && targetW && startW !== targetW
    ? Math.min(100, Math.max(0, Math.round((Math.abs(startW - startW) / Math.abs(startW - targetW)) * 100)))
    : 0;

  // Daily missions
  const mealTypes = new Set(data.recentFoods.map((f) => f.meal_type));
  const proteinHit = totals.protein >= goals.protein * 0.9;
  const missions = [
    { id: "scan", label: "Log a meal", done: mealsLogged > 0, xp: 25, icon: Camera, to: "/scan" as const },
    { id: "protein", label: `Hit ${goals.protein}g protein`, done: proteinHit, xp: 50, icon: Flame, to: "/diet" as const },
    { id: "workout", label: "Complete a workout", done: burned > 0, xp: 100, icon: Dumbbell, to: "/workout" as const },
    { id: "weight", label: "Log weight", done: (data.weights ?? []).some((w) => new Date(w.logged_at).toDateString() === new Date().toDateString()), xp: 25, icon: Scale, to: "/profile" as const },
    { id: "dinner", label: "Log dinner", done: mealTypes.has("dinner"), xp: 25, icon: Plus, to: "/scan" as const },
  ];
  const missionsDone = missions.filter((m) => m.done).length;

  // Insight derivations
  const calRemaining = Math.max(0, goal - totals.calories);
  const proteinRemaining = Math.max(0, goals.protein - totals.protein);
  const nutritionScore = Math.round(
    (Math.min(100, (totals.calories / goal) * 100) +
      Math.min(100, (totals.protein / goals.protein) * 100) +
      Math.min(100, (totals.carbs / goals.carbs) * 100) +
      Math.min(100, (totals.fat / goals.fat) * 100)) / 4
  );

  const insightText = data.insight?.content
    ?? (mealsLogged === 0
      ? `Start strong — scan your first meal to unlock ${calRemaining} kcal of fuel.`
      : `${proteinRemaining}g protein and ${calRemaining} kcal left. A grilled chicken bowl would close the gap.`);

  const insightMut = useMutation({
    mutationFn: () => generateInsight(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Fresh insight ready"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Suggestions when no meals
  const suggestions = useMemo(() => ([
    { emoji: "🥗", name: "Greek chicken bowl", kcal: 520, p: 42 },
    { emoji: "🍳", name: "Protein scramble", kcal: 380, p: 32 },
    { emoji: "🥤", name: "Whey + banana", kcal: 280, p: 30 },
  ]), []);

  return (
    <div className="px-5 pt-12 pb-28 space-y-5 relative">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      {/* Header */}
      <header className="relative flex items-center justify-between animate-slide-up">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{greet}</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">
            {profile?.display_name ?? "Athlete"} <span className="inline-block animate-pulse">👋</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-2xl px-3 py-1.5 border border-amber-400/20 bg-gradient-to-br from-amber-500/15 to-orange-500/5 backdrop-blur-xl flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-300" />
            <span className="text-sm font-bold tabular-nums text-amber-200">{streak}</span>
          </div>
          <div className="rounded-2xl px-3 py-1.5 border border-violet-400/20 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/5 backdrop-blur-xl flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-violet-300" />
            <span className="text-sm font-bold tabular-nums text-violet-200">Lv {level}</span>
          </div>
        </div>
      </header>

      {/* XP bar + countdown */}
      <section className="relative rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-4 animate-slide-up" style={{ animationDelay: ".05s" }}>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-300" /> {xp} XP · Level {level}</span>
          {daysLeft !== null && <span className="text-cyan-300/90">Week {weekNum}/12 · {daysLeft}d left</span>}
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-1000"
            style={{
              width: `${xpPct}%`,
              background: "linear-gradient(90deg,#fbbf24,#f97316,#ec4899)",
              boxShadow: "0 0 16px rgba(251,191,36,0.5)",
            }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 tabular-nums">{500 - xpInto} XP to Level {level + 1}</p>
      </section>

      {/* MacroRings */}
      <div className="animate-slide-up" style={{ animationDelay: ".1s" }}>
        <MacroRings totals={totals} goals={goals} insight={`${calRemaining} kcal left · ${proteinRemaining}g protein to go`} />
      </div>

      {/* Eaten / Burned / Net */}
      <section className="grid grid-cols-3 gap-2 animate-slide-up" style={{ animationDelay: ".15s" }}>
        {[
          { label: "Eaten", val: totals.calories, tone: "text-foreground" },
          { label: "Burned", val: burned, tone: "text-emerald-300" },
          { label: "Net", val: totals.calories - burned, tone: "text-cyan-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-bold tabular-nums mt-0.5 ${s.tone}`}>{Math.round(s.val)}</p>
          </div>
        ))}
      </section>

      {/* Daily missions */}
      <section className="relative rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-5 animate-slide-up" style={{ animationDelay: ".2s" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Daily missions</p>
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mt-0.5"><Target className="h-4 w-4 text-fuchsia-300" /> {missionsDone}/{missions.length} complete</h3>
          </div>
          <div className="text-[10px] tabular-nums text-amber-200 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full">
            +{missions.filter(m => !m.done).reduce((a, m) => a + m.xp, 0)} XP
          </div>
        </div>
        <div className="space-y-2">
          {missions.map((m) => {
            const Icon = m.done ? CheckCircle2 : m.icon;
            return (
              <Link key={m.id} to={m.to} className={`flex items-center gap-3 rounded-2xl p-3 border transition-all ${
                m.done
                  ? "border-emerald-400/20 bg-emerald-500/[0.06]"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] active:scale-[.99]"
              }`}>
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                  m.done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-foreground/70"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${m.done ? "line-through text-muted-foreground" : ""}`}>{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">+{m.xp} XP</p>
                </div>
                {!m.done && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                {m.done && <Circle className="h-4 w-4 text-emerald-300 fill-emerald-300" />}
              </Link>
            );
          })}
        </div>
      </section>

      {/* AI Coach actionable */}
      <section className="relative rounded-3xl border border-white/[0.06] bg-gradient-to-br from-violet-500/[0.08] via-white/[0.02] to-cyan-500/[0.06] backdrop-blur-xl p-5 overflow-hidden animate-slide-up" style={{ animationDelay: ".25s" }}>
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">AI Nutrition Coach</h3>
              <button
                onClick={() => insightMut.mutate()}
                disabled={insightMut.isPending}
                className="text-[10px] uppercase tracking-wider text-cyan-300 flex items-center gap-1"
              >
                {insightMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
              </button>
            </div>
            <p className="text-sm text-foreground/80 mt-1 leading-relaxed">{insightText}</p>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Score</p>
                <p className="text-base font-bold tabular-nums text-emerald-300">{nutritionScore}</p>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Protein left</p>
                <p className="text-base font-bold tabular-nums text-rose-300">{proteinRemaining}g</p>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Cal left</p>
                <p className="text-base font-bold tabular-nums text-amber-300">{calRemaining}</p>
              </div>
            </div>

            <Link to="/scan" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-cyan-200">
              Get next-step meal <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Today's meals OR motivational empty */}
      <section className="animate-slide-up" style={{ animationDelay: ".3s" }}>
        <div className="flex items-center justify-between px-1 mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Flame className="h-4 w-4 text-orange-300" /> Today's fuel</h3>
          <Link to="/diet" className="text-[11px] text-cyan-300">See all</Link>
        </div>

        {data.recentFoods.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-5 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.4)] animate-pulse">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-semibold mt-3">Your transformation starts with one scan</p>
            <p className="text-xs text-muted-foreground mt-1">Snap a meal to unlock +25 XP and a personalized macro breakdown.</p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-left">
              {suggestions.map((s) => (
                <Link key={s.name} to="/scan" className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2.5 hover:bg-white/[0.06] transition-colors">
                  <div className="text-xl">{s.emoji}</div>
                  <p className="text-[11px] font-medium truncate mt-1">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">{s.kcal} kcal · {s.p}g P</p>
                </Link>
              ))}
            </div>

            <Link to="/scan" className="mt-4 inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 text-white font-semibold py-3 text-sm shadow-[0_0_24px_rgba(139,92,246,0.45)]">
              <Camera className="h-4 w-4" /> Scan your first meal
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recentFoods.map((f) => (
              <div key={f.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-3.5 flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-400/30 to-violet-500/30 flex items-center justify-center text-lg">🍽️</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{f.name}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">{f.meal_type}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">{f.calories}</div>
                  <div className="text-[10px] text-muted-foreground">kcal</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Transformation countdown card */}
      {targetW > 0 && (
        <section className="relative rounded-3xl border border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.08] via-white/[0.02] to-cyan-500/[0.06] backdrop-blur-xl p-5 overflow-hidden animate-slide-up" style={{ animationDelay: ".35s" }}>
          <div className="absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_24px_rgba(52,211,153,0.45)]">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Transformation</p>
              <p className="text-lg font-bold mt-0.5">{transformPct}% toward {targetW}kg</p>
              <p className="text-[11px] text-muted-foreground">{daysLeft}d left · Week {weekNum} of 12</p>
            </div>
            <Link to="/profile" className="text-cyan-300"><ChevronRight className="h-5 w-5" /></Link>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-1000"
              style={{ width: `${transformPct}%`, background: "linear-gradient(90deg,#34d399,#22d3ee,#a78bfa)" }}
            />
          </div>
        </section>
      )}
    </div>
  );
}
