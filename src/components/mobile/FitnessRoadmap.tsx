import { useMemo } from "react";
import {
  Sparkles, Flame, Dumbbell, Target, TrendingUp, CheckCircle2,
  AlertTriangle, Droplets, Moon, Activity, Wheat, Nut,
} from "lucide-react";

const NEON = "oklch(0.86 0.22 155)"; // neon green
const CYAN = "oklch(0.84 0.14 200)"; // cyan

type Props = {
  gender: string;
  age: number;
  weightKg: number;
  heightCm: number;
  computed: any;
  bmiState: string;
  goal: string;
  goalLabel: string;
  activity: string;
  sleepHours: number;
  waterL: number;
  workoutHabit: string;
  diet: string;
  mealFrequency: number;
  deficiencies: string[];
  medical: string[];
};

function scoreBand(v: number) {
  return v >= 80 ? "Excellent" : v >= 65 ? "Good" : v >= 50 ? "Fair" : "Needs work";
}

export function FitnessRoadmap(p: Props) {
  const s = useMemo(() => {
    const clamp = (n: number) => Math.max(5, Math.min(100, Math.round(n)));

    // Body composition score — best near BMI 22
    const body = clamp(100 - Math.abs(p.computed.bmi - 22) * 7);
    // Activity
    const activityScore = clamp(
      { sedentary: 30, light: 52, moderate: 72, active: 88, athlete: 96 }[p.activity as string] ?? 60,
    );
    // Sleep — best 7.5–8.5h
    const sleep = clamp(100 - Math.abs(p.sleepHours - 8) * 18);
    // Hydration target ~35ml/kg
    const target = (p.weightKg * 0.035);
    const hydration = clamp((p.waterL / target) * 100);
    // Nutrition quality: meal frequency + deficiencies
    const nutrition = clamp(
      80 + (p.mealFrequency >= 4 ? 8 : -6) - p.deficiencies.length * 9 - (p.medical.filter((m) => m !== "None").length * 4),
    );
    // Training consistency
    const training = clamp(
      { "None": 25, "Home workouts": 58, "Gym 3x/wk": 78, "Gym 5x/wk": 92, "Sports": 80, "Yoga": 62 }[p.workoutHabit] ?? 60,
    );
    const overall = Math.round((body + activityScore + sleep + hydration + nutrition + training) / 6);

    const metrics = [
      { key: "Body composition", value: body, icon: Activity },
      { key: "Training consistency", value: training, icon: Dumbbell },
      { key: "Daily activity", value: activityScore, icon: Flame },
      { key: "Nutrition quality", value: nutrition, icon: Wheat },
      { key: "Sleep & recovery", value: sleep, icon: Moon },
      { key: "Hydration", value: hydration, icon: Droplets },
    ];
    const sorted = [...metrics].sort((a, b) => b.value - a.value);
    return {
      overall,
      metrics,
      strengths: sorted.slice(0, 2),
      gaps: sorted.slice(-2).reverse(),
      hydrationTarget: target,
    };
  }, [p]);

  // Realistic 4-week projection: 0.5%/wk loss, 0.25%/wk gain
  const proj = useMemo(() => {
    const cut = p.goal === "weight_loss" || p.goal === "fat_loss";
    const gain = p.goal === "muscle_gain";
    const rate = cut ? -0.005 : gain ? 0.0025 : p.goal === "recomp" ? -0.001 : 0;
    const weeks = [1, 2, 3, 4].map((w) => Number((p.weightKg * (1 + rate * w)).toFixed(1)));
    const targetWeight = weeks[3];
    const bfDrop = cut ? 1.6 : p.goal === "recomp" ? 1.0 : gain ? 0.3 : 0.4;
    const targetBf = Number(Math.max(7, p.computed.body_fat - bfDrop).toFixed(1));
    const targetBmi = Number((targetWeight / Math.pow(p.heightCm / 100, 2)).toFixed(1));
    return { weeks, targetWeight, targetBf, targetBmi };
  }, [p]);

  const timeline = [
    { w: "Week 1", t: "Adapt", d: `Lock ${p.mealFrequency} meals/day and hit ${p.computed.protein}g protein.` },
    { w: "Week 2", t: "Build", d: `Add one session vs. last week; keep sleep at 7.5–8h.` },
    { w: "Week 3", t: "Push", d: `Progressive overload + steady ${p.computed.calories} kcal.` },
    { w: "Week 4", t: "Prove", d: `Re-measure weight, waist & energy. Recalibrate targets.` },
  ];

  const focus = s.gaps.map((g) => g.key);

  return (
    <div className="animate-slide-up relative z-10 space-y-5">
      <div>
        <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: NEON }}>
          <Sparkles className="h-3 w-3" /> AI Screening
        </div>
        <h2 className="text-[28px] font-bold leading-[1.1] tracking-tight">
          Your 4-Week{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${NEON}, ${CYAN})` }}>
            Fitness Roadmap
          </span>
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Evidence-based projection from your metrics, habits and goal — no fantasy transformations.
        </p>
      </div>

      {/* Readiness score */}
      <div className="rounded-3xl p-5 bg-white/[0.03] border border-white/[0.07] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-5">
          <Ring value={s.overall} />
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Readiness score</div>
            <div className="text-lg font-semibold" style={{ color: NEON }}>{scoreBand(s.overall)}</div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {p.goalLabel} • {p.diet} • BMI {p.computed.bmi} ({p.bmiState})
            </p>
          </div>
        </div>
      </div>

      {/* Current vs target */}
      <section>
        <SectionTitle>Current vs 4-week target</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          <Delta label="Weight" now={`${p.weightKg}`} target={`${proj.targetWeight}`} unit="kg" />
          <Delta label="Body fat" now={`${p.computed.body_fat}`} target={`${proj.targetBf}`} unit="%" />
          <Delta label="BMI" now={`${p.computed.bmi}`} target={`${proj.targetBmi}`} unit="" />
        </div>
        <div className="mt-2.5 rounded-2xl p-4 bg-white/[0.03] border border-white/[0.07]">
          <div className="flex items-end justify-between gap-2 h-20">
            {proj.weeks.map((w, i) => {
              const min = Math.min(...proj.weeks, p.weightKg);
              const max = Math.max(...proj.weeks, p.weightKg);
              const pct = max === min ? 60 : 30 + ((w - min) / (max - min)) * 60;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                  <span className="text-[10px] tabular-nums text-muted-foreground">{w}</span>
                  <div className="w-full rounded-t-md" style={{ height: `${pct}%`, background: `linear-gradient(180deg, ${CYAN}, ${NEON})`, opacity: 0.55 + i * 0.15 }} />
                  <span className="text-[10px] text-muted-foreground">W{i + 1}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Projected at a sustainable rate — actual results depend on adherence.</p>
        </div>
      </section>

      {/* Screening breakdown */}
      <section>
        <SectionTitle>Screening breakdown</SectionTitle>
        <div className="rounded-3xl p-4 bg-white/[0.03] border border-white/[0.07] space-y-3.5">
          {s.metrics.map((m) => (
            <div key={m.key}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <m.icon className="h-3.5 w-3.5" /> {m.key}
                </span>
                <span className="font-semibold tabular-nums">{m.value}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${m.value}%`, background: m.value < 55 ? "linear-gradient(90deg, oklch(0.8 0.16 70), oklch(0.72 0.19 40))" : `linear-gradient(90deg, ${CYAN}, ${NEON})` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Strengths & gaps */}
      <div className="grid grid-cols-2 gap-2.5">
        <ListCard title="Strengths" tone="good" icon={CheckCircle2} items={s.strengths.map((x) => `${x.key} · ${x.value}%`)} />
        <ListCard title="Priority gaps" tone="warn" icon={AlertTriangle} items={s.gaps.map((x) => `${x.key} · ${x.value}%`)} />
      </div>

      {/* Macro targets */}
      <section>
        <SectionTitle>Daily macro targets</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <Macro icon={Flame} label="Calories" value={p.computed.calories} unit="kcal" />
          <Macro icon={Dumbbell} label="Protein" value={p.computed.protein} unit="g" />
          <Macro icon={Wheat} label="Carbs" value={p.computed.carbs} unit="g" />
          <Macro icon={Nut} label="Fat" value={p.computed.fat} unit="g" />
        </div>
        <div className="mt-2.5 rounded-2xl px-4 py-3 bg-white/[0.03] border border-white/[0.07] flex items-center gap-2 text-xs text-muted-foreground">
          <Droplets className="h-3.5 w-3.5" style={{ color: CYAN }} />
          Hydration target ~{s.hydrationTarget.toFixed(1)} L/day · Sleep 7.5–8h
        </div>
      </section>

      {/* Timeline */}
      <section>
        <SectionTitle>Week 1 → 4 timeline</SectionTitle>
        <div className="rounded-3xl p-4 bg-white/[0.03] border border-white/[0.07]">
          {timeline.map((t, i) => (
            <div key={t.w} className="flex gap-3 pb-4 last:pb-0 relative">
              {i < timeline.length - 1 && <span className="absolute left-[7px] top-5 bottom-0 w-px bg-white/10" />}
              <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2" style={{ borderColor: NEON, background: i === 0 ? NEON : "transparent" }} />
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{t.w}</div>
                <div className="text-sm font-semibold">{t.t}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Focus this week */}
      <section className="rounded-3xl p-5 bg-white/[0.03] border" style={{ borderColor: "color-mix(in oklab, " + NEON + " 28%, transparent)" }}>
        <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: NEON }}>
          <Target className="h-4 w-4" /> Your focus this week
        </div>
        <ul className="space-y-2">
          {focus.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" style={{ color: CYAN }} />
              Improve <span className="text-foreground font-medium">{f.toLowerCase()}</span> — smallest change, biggest return right now.
            </li>
          ))}
          <li className="flex items-start gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" style={{ color: CYAN }} />
            Hit <span className="text-foreground font-medium">{p.computed.protein}g protein</span> daily across {p.mealFrequency} meals.
          </li>
        </ul>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{children}</h3>;
}

function Ring({ value }: { value: number }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="url(#roadmapGrad)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} />
        <defs>
          <linearGradient id="roadmapGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={CYAN} />
            <stop offset="100%" stopColor={NEON} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function Delta({ label, now, target, unit }: { label: string; now: string; target: string; unit: string }) {
  return (
    <div className="rounded-2xl p-3 bg-white/[0.03] border border-white/[0.07]">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-muted-foreground tabular-nums line-through decoration-white/25">{now}{unit}</div>
      <div className="text-lg font-bold tabular-nums" style={{ color: NEON }}>{target}{unit}</div>
    </div>
  );
}

function Macro({ icon: Icon, label, value, unit }: any) {
  return (
    <div className="rounded-2xl p-3.5 bg-white/[0.03] border border-white/[0.07]">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" style={{ color: CYAN }} /> {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        <span className="text-[11px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function ListCard({ title, items, tone, icon: Icon }: any) {
  const color = tone === "good" ? NEON : "oklch(0.8 0.16 70)";
  return (
    <div className="rounded-2xl p-3.5 bg-white/[0.03] border border-white/[0.07]">
      <div className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color }}>
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((i: string) => (
          <li key={i} className="text-[11px] text-muted-foreground leading-snug">{i}</li>
        ))}
      </ul>
    </div>
  );
}
