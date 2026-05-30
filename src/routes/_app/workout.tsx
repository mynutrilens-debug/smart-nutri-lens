import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { workoutsQuery } from "@/lib/queries";
import { logWorkout, deleteWorkout } from "@/lib/workout.functions";
import { Dumbbell, Heart, Flame, Wind, Activity, Trophy, Plus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/workout")({
  component: Workout,
});

const types = [
  { key: "strength", label: "Strength", icon: Dumbbell, color: "oklch(0.84 0.18 145)", est: 8 },
  { key: "cardio", label: "Cardio", icon: Heart, color: "oklch(0.7 0.22 25)", est: 10 },
  { key: "hiit", label: "HIIT", icon: Flame, color: "oklch(0.82 0.18 50)", est: 13 },
  { key: "yoga", label: "Yoga", icon: Wind, color: "oklch(0.74 0.22 295)", est: 4 },
  { key: "mobility", label: "Mobility", icon: Activity, color: "oklch(0.7 0.15 220)", est: 3 },
  { key: "sports", label: "Sports", icon: Trophy, color: "oklch(0.78 0.18 60)", est: 9 },
] as const;

function Workout() {
  const { data } = useSuspenseQuery(workoutsQuery);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<typeof types[number]["key"]>("strength");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todays = data.filter(w => new Date(w.logged_at) >= today);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekly = data.filter(w => new Date(w.logged_at) >= weekAgo);
  const totalMin = weekly.reduce((a, w) => a + w.duration_min, 0);
  const totalKcal = weekly.reduce((a, w) => a + w.calories_burned, 0);
  const weeklyGoal = 150;

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

  return (
    <div className="px-5 pt-12 pb-8 space-y-5">
      <header className="flex items-center justify-between animate-slide-up">
        <div>
          <p className="text-xs text-muted-foreground">This week</p>
          <h1 className="text-2xl font-bold tracking-tight">Training</h1>
        </div>
        <button onClick={() => setOpen(true)} className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-ring active:scale-95">
          <Plus className="h-5 w-5 text-primary-foreground" />
        </button>
      </header>

      <div className="glass rounded-3xl p-5 animate-slide-up" style={{ animationDelay: ".05s" }}>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Active minutes</div>
            <div className="text-3xl font-bold tabular-nums">{totalMin}<span className="text-base text-muted-foreground"> / {weeklyGoal}</span></div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Burned</div>
            <div className="text-xl font-bold tabular-nums text-accent">{totalKcal} kcal</div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent glow-ring transition-all duration-1000"
            style={{ width: `${Math.min(100, (totalMin / weeklyGoal) * 100)}%` }} />
        </div>
      </div>

      <section className="animate-slide-up" style={{ animationDelay: ".1s" }}>
        <h3 className="text-sm font-semibold px-1 mb-2">Quick start</h3>
        <div className="grid grid-cols-3 gap-3">
          {types.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => { setType(t.key); setOpen(true); }}
                className="glass rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-95 transition">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${t.color}25`, boxShadow: `0 0 18px ${t.color}50` }}>
                  <Icon className="h-5 w-5" style={{ color: t.color }} />
                </div>
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="animate-slide-up" style={{ animationDelay: ".15s" }}>
        <h3 className="text-sm font-semibold px-1 mb-2">Today</h3>
        {todays.length === 0 ? (
          <div className="glass rounded-2xl p-5 text-center text-sm text-muted-foreground">
            No workouts yet — pick one above to start.
          </div>
        ) : (
          <div className="space-y-2">
            {todays.map(w => {
              const meta = types.find(t => t.key === w.workout_type) ?? types[0];
              const Icon = meta.icon;
              return (
                <div key={w.id} className="glass rounded-2xl p-3.5 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}25`, boxShadow: `0 0 14px ${meta.color}50` }}>
                    <Icon className="h-5 w-5" style={{ color: meta.color }} />
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

      <section className="animate-slide-up" style={{ animationDelay: ".2s" }}>
        <h3 className="text-sm font-semibold px-1 mb-2">History</h3>
        <div className="space-y-2">
          {data.filter(w => new Date(w.logged_at) < today).slice(0, 10).map(w => {
            const meta = types.find(t => t.key === w.workout_type) ?? types[0];
            return (
              <div key={w.id} className="glass rounded-2xl p-3 flex items-center gap-3 opacity-90">
                <div className="h-2 w-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{w.name}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(w.logged_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">{w.duration_min}m · {w.calories_burned}kcal</div>
              </div>
            );
          })}
        </div>
      </section>

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
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${type === t.key ? "bg-primary text-primary-foreground glow-ring" : "bg-white/5 text-muted-foreground"}`}>
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
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold glow-ring flex items-center justify-center gap-2">
              {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
