import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardQuery } from "@/lib/queries";
import { logWeight, updateProfile } from "@/lib/weight.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame, Scale, Loader2, Save, Sparkles, TrendingDown, TrendingUp, Target,
  Droplets, Activity, Trophy, Plus, Minus, Edit3, Check, LogOut, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { MacroRings } from "@/components/mobile/MacroRings";
import { TransformationRing } from "@/components/mobile/TransformationRing";

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
  const [water, setWater] = useState(5); // glasses, local UI state

  const startWeight = data.weights[0]?.weight_kg ?? p?.weight_kg ?? 0;
  const currentWeight = Number(p?.weight_kg ?? startWeight);
  const targetWeight = Number(p?.target_weight_kg ?? Math.max(50, currentWeight - 5));
  const heightM = (Number(p?.height_cm ?? 170)) / 100;
  const bmi = heightM > 0 ? currentWeight / (heightM * heightM) : 0;
  const bmiLabel = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";
  const bmiTone = bmi < 18.5 ? "text-sky-300" : bmi < 25 ? "text-emerald-300" : bmi < 30 ? "text-amber-300" : "text-rose-300";

  const weekChange = useMemo(() => {
    const w = data.weights;
    if (w.length < 2) return 0;
    return Number(w[w.length - 1].weight_kg) - Number(w[0].weight_kg);
  }, [data.weights]);

  const totalDelta = Math.abs(startWeight - targetWeight) || 1;
  const progressedDelta = Math.abs(startWeight - currentWeight);
  const transformPct = Math.min(100, Math.round((progressedDelta / totalDelta) * 100));

  const proteinPct = Math.min(100, Math.round((data.totals.protein / Math.max(1, protein)) * 100));
  const caloriePct = Math.min(100, Math.round((data.totals.calories / Math.max(1, cal)) * 100));
  const waterPct = Math.min(100, (water / 8) * 100);
  const adherencePct = Math.round((proteinPct + caloriePct + waterPct) / 3);
  const workoutScore = data.burned > 200 ? 100 : Math.round((data.burned / 200) * 100);
  const healthScore = Math.round((proteinPct * 0.25 + caloriePct * 0.25 + waterPct * 0.2 + workoutScore * 0.2 + 80 * 0.1));

  // Program timeline — 12 week default
  const onboardedAt = p?.onboarded_at ? new Date(p.onboarded_at) : null;
  const weeksIn = onboardedAt ? Math.max(1, Math.min(12, Math.ceil((Date.now() - onboardedAt.getTime()) / (7 * 86400000)))) : 1;

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
      {/* ── Transformation header ───────────────────────────── */}
      <header className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-5 animate-slide-up">
        <div className="absolute -top-16 -right-20 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-base font-semibold">
            {(p?.display_name ?? "U")[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold truncate">{p?.display_name ?? "Athlete"}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-muted-foreground uppercase tracking-wider">
                {p?.physique_goal ?? "Recomp"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Week {weeksIn} of 12 · {bmiLabel}</p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Signed out");
              navigate({ to: "/login" });
            }}
            className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-bold tabular-nums text-amber-200">{p?.streak_count ?? 0}</span>
          </div>
        </div>

        {/* Transformation ring */}
        <div className="relative mt-4 pb-8">
          <TransformationRing
            startWeight={startWeight}
            currentWeight={currentWeight}
            targetWeight={targetWeight}
            bmi={bmi}
            bmiLabel={bmiLabel}
            week={weeksIn}
            totalWeeks={12}
          />
        </div>
      </header>


      {/* ── Health score ring ───────────────────────────────── */}
      <section className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-5 animate-slide-up" style={{ animationDelay: ".04s" }}>
        <div className="flex items-center gap-4">
          <ScoreRing value={healthScore} />
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Health score</p>
            <p className="text-2xl font-semibold mt-0.5">{healthScore}<span className="text-sm text-muted-foreground">/100</span></p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">Calories, protein, water, training & recovery combined.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <MiniStat label="Adherence" value={`${adherencePct}%`} icon={<Target className="h-3 w-3" />} />
          <MiniStat label="Workouts" value={`${data.burned}`} suffix="kcal" icon={<Activity className="h-3 w-3" />} />
          <MiniStat label="Streak" value={`${p?.streak_count ?? 0}`} suffix="d" icon={<Trophy className="h-3 w-3" />} />
        </div>
      </section>

      {/* ── AI Coach insight ────────────────────────────────── */}
      <section className="rounded-[24px] border border-white/[0.06] bg-gradient-to-br from-primary/[0.06] to-transparent p-4 animate-slide-up" style={{ animationDelay: ".08s" }}>
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">AI Coach</p>
            <p className="text-sm mt-1 leading-relaxed text-foreground/90">
              {data.insight?.content ?? `You're ${transformPct}% to your target. Hit ${protein}g protein and 8 glasses of water today to keep your streak alive.`}
            </p>
          </div>
        </div>
      </section>

      {/* ── Weight tracker ──────────────────────────────────── */}
      <section className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".12s" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Weight</h2>
          </div>
          <div className={`flex items-center gap-1 text-xs ${weekChange <= 0 ? "text-emerald-300" : "text-amber-300"}`}>
            {weekChange <= 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            <span className="tabular-nums font-medium">{weekChange >= 0 ? "+" : ""}{weekChange.toFixed(1)} kg</span>
            <span className="text-muted-foreground">/ wk</span>
          </div>
        </div>

        <Sparkline data={data.weights.map(w => Number(w.weight_kg))} />

        <div className="flex gap-2 mt-3">
          <div className="flex-1 relative">
            <input
              type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="Log today's weight"
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm outline-none focus:border-primary/50 transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
          </div>
          <button
            onClick={() => wlog.mutate()} disabled={!weight || wlog.isPending}
            className="px-5 rounded-2xl bg-white text-black font-semibold text-sm flex items-center gap-2 disabled:opacity-40 active:scale-[0.98] transition"
          >
            {wlog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
        </div>
      </section>

      {/* ── Water tracker ───────────────────────────────────── */}
      <section className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4 animate-slide-up" style={{ animationDelay: ".14s" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-sky-300" />
            <h2 className="text-sm font-semibold">Water</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWater(w => Math.max(0, w - 1))} className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95"><Minus className="h-3.5 w-3.5" /></button>
            <span className="text-sm font-semibold tabular-nums w-12 text-center">{water}/8</span>
            <button onClick={() => setWater(w => Math.min(12, w + 1))} className="h-8 w-8 rounded-full bg-sky-400/15 border border-sky-400/30 flex items-center justify-center active:scale-95"><Plus className="h-3.5 w-3.5 text-sky-200" /></button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-8 gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`h-7 rounded-md border transition-all ${i < water ? "bg-gradient-to-b from-sky-400/40 to-sky-500/20 border-sky-400/40" : "bg-white/[0.02] border-white/5"}`} />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">{Math.round(waterPct)}% of daily hydration goal</p>
      </section>

      {/* ── Macro rings (Apple Fitness style) ───────────────── */}
      <MacroRings
        totals={data.totals}
        goals={{ calories: cal, protein, carbs, fat }}
        insight={data.insight?.content ?? `${Math.max(0, cal - data.totals.calories)} kcal & ${Math.max(0, protein - Math.round(data.totals.protein))}g protein left today.`}
      />

      {/* ── Macro goal editor ───────────────────────────────── */}
      <section className="space-y-3 animate-slide-up" style={{ animationDelay: ".18s" }}>
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold">Adjust goals</h2>
          {(cal !== (p?.daily_calorie_goal ?? cal) || protein !== (p?.protein_goal_g ?? protein) || carbs !== (p?.carbs_goal_g ?? carbs) || fat !== (p?.fat_goal_g ?? fat)) && (
            <button disabled={save.isPending} onClick={() => save.mutate()} className="text-xs font-semibold text-primary flex items-center gap-1">
              {save.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MacroCard label="Calories" value={cal} unit="kcal" consumed={data.totals.calories} accent="from-orange-400 to-amber-400" editing={editing === "calories"} onEdit={() => setEditing(editing === "calories" ? null : "calories")} onChange={v => setCal(v)} min={800} max={5000} step={50} />
          <MacroCard label="Protein" value={protein} unit="g" consumed={Math.round(data.totals.protein)} accent="from-rose-400 to-pink-400" editing={editing === "protein"} onEdit={() => setEditing(editing === "protein" ? null : "protein")} onChange={v => setProtein(v)} min={30} max={400} step={5} />
          <MacroCard label="Carbs" value={carbs} unit="g" consumed={Math.round(data.totals.carbs)} accent="from-violet-400 to-fuchsia-400" editing={editing === "carbs"} onEdit={() => setEditing(editing === "carbs" ? null : "carbs")} onChange={v => setCarbs(v)} min={30} max={800} step={5} />
          <MacroCard label="Fat" value={fat} unit="g" consumed={Math.round(data.totals.fat)} accent="from-emerald-400 to-teal-400" editing={editing === "fat"} onEdit={() => setEditing(editing === "fat" ? null : "fat")} onChange={v => setFat(v)} min={20} max={300} step={2} />
        </div>
      </section>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 30; const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, value) / 100) * c;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="oklch(1 0 0 / 6%)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="url(#hsGrad)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }} />
        <defs>
          <linearGradient id="hsGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.18 145)" />
            <stop offset="100%" stopColor="oklch(0.72 0.22 240)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-base font-bold tabular-nums">{value}</div>
    </div>
  );
}

function MiniStat({ label, value, suffix, icon }: { label: string; value: string; suffix?: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/5 px-3 py-2.5">
      <div className="flex items-center gap-1 text-muted-foreground text-[10px] uppercase tracking-wider">{icon}{label}</div>
      <p className="text-sm font-semibold mt-1 tabular-nums">{value}{suffix && <span className="text-[10px] text-muted-foreground ml-0.5">{suffix}</span>}</p>
    </div>
  );
}

function MacroCard({
  label, value, unit, consumed, accent, editing, onEdit, onChange, min, max, step,
}: {
  label: string; value: number; unit: string; consumed: number; accent: string;
  editing: boolean; onEdit: () => void; onChange: (v: number) => void;
  min: number; max: number; step: number;
}) {
  const pct = Math.min(100, Math.round((consumed / Math.max(1, value)) * 100));
  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <button onClick={onEdit} className="h-6 w-6 rounded-full hover:bg-white/5 flex items-center justify-center">
          {editing ? <Check className="h-3 w-3 text-primary" /> : <Edit3 className="h-3 w-3 text-muted-foreground" />}
        </button>
      </div>
      {editing ? (
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => onChange(Math.max(min, value - step))} className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95"><Minus className="h-3 w-3" /></button>
          <span className="flex-1 text-center text-lg font-semibold tabular-nums">{value}</span>
          <button onClick={() => onChange(Math.min(max, value + step))} className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95"><Plus className="h-3 w-3" /></button>
        </div>
      ) : (
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums">{consumed}</span>
          <span className="text-xs text-muted-foreground">/ {value} {unit}</span>
        </div>
      )}
      <div className="h-1 rounded-full bg-white/5 mt-3 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${accent}`} style={{ width: `${pct}%`, transition: "width .6s ease" }} />
      </div>
    </div>
  );
}

function ProgressTile({ label, pct, tone }: { label: string; pct: number; tone: "emerald" | "primary" }) {
  const grad = tone === "emerald" ? "from-emerald-400/20 to-emerald-400/0" : "from-primary/20 to-primary/0";
  const text = tone === "emerald" ? "text-emerald-300" : "text-primary";
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-gradient-to-br ${grad} p-3`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold tabular-nums mt-1 ${text}`}>{pct}%</p>
      <div className="h-1 rounded-full bg-white/5 mt-2 overflow-hidden">
        <div className={`h-full rounded-full bg-current ${text}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) {
    return <div className="h-16 mt-3 flex items-center justify-center text-[11px] text-muted-foreground">Log at least 2 weights to see trend</div>;
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
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16 mt-3" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.22 240 / 35%)" />
          <stop offset="100%" stopColor="oklch(0.72 0.22 240 / 0%)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spGrad)" />
      <path d={d} fill="none" stroke="oklch(0.78 0.18 215)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 2.5 : 1.5} fill="oklch(0.82 0.16 215)" />
      ))}
    </svg>
  );
}
