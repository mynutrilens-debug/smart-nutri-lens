import { Sparkles } from "lucide-react";

type Totals = { calories: number; protein: number; carbs: number; fat: number };

const RINGS = [
  { key: "calories", label: "Calories", unit: "kcal", from: "#FF7A18", to: "#FFB347", glow: "#FF8A3C" },
  { key: "protein",  label: "Protein",  unit: "g",    from: "#FF2E63", to: "#FF6FA1", glow: "#FF4E84" },
  { key: "carbs",    label: "Carbs",    unit: "g",    from: "#8B5CF6", to: "#D946EF", glow: "#A855F7" },
  { key: "fat",      label: "Fat",      unit: "g",    from: "#10B981", to: "#5EEAD4", glow: "#34D399" },
] as const;

export function MacroRings({
  totals, goals, insight,
}: {
  totals: Totals; goals: Totals; insight?: string | null;
}) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 16;
  const gap = 6;
  const radii = [
    size / 2 - stroke / 2 - 4,
    size / 2 - stroke / 2 - 4 - (stroke + gap),
    size / 2 - stroke / 2 - 4 - (stroke + gap) * 2,
    size / 2 - stroke / 2 - 4 - (stroke + gap) * 3,
  ];

  const pcts = RINGS.map((r) => {
    const consumed = Number(totals[r.key as keyof Totals] ?? 0);
    const goal = Math.max(1, Number(goals[r.key as keyof Totals] ?? 1));
    return { ...r, consumed: Math.round(consumed), goal: Math.round(goal), pct: Math.min(150, (consumed / goal) * 100) };
  });

  const score = Math.round(
    pcts.reduce((a, r) => a + Math.min(100, r.pct), 0) / 4
  );

  return (
    <section className="rounded-[28px] border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl p-5 overflow-hidden relative animate-slide-up">
      <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">AI Nutrition</p>
          <h2 className="text-sm font-semibold mt-0.5">Today's macros</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>
        </div>
      </div>

      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <defs>
            {pcts.map((r) => (
              <linearGradient key={r.key} id={`g-${r.key}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={r.from} />
                <stop offset="100%" stopColor={r.to} />
              </linearGradient>
            ))}
            <filter id="ringGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {pcts.map((r, i) => {
            const radius = radii[i];
            const c = 2 * Math.PI * radius;
            const off = c - (Math.min(100, r.pct) / 100) * c;
            return (
              <g key={r.key}>
                <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
                <circle
                  cx={cx} cy={cy} r={radius} fill="none"
                  stroke={`url(#g-${r.key})`} strokeWidth={stroke} strokeLinecap="round"
                  strokeDasharray={c} strokeDashoffset={off}
                  filter="url(#ringGlow)"
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }}
                />
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
          <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">AI Score</p>
          <p className="text-4xl font-bold tabular-nums bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent leading-none mt-1">{score}</p>
          <p className="text-[10px] text-muted-foreground mt-1">/ 100</p>
          {insight && (
            <p className="text-[10px] text-foreground/70 leading-snug mt-2 line-clamp-3">{insight}</p>
          )}
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-2 mt-5">
        {pcts.map((r) => {
          const remaining = Math.max(0, r.goal - r.consumed);
          return (
            <div key={r.key} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${r.from}, ${r.to})`, boxShadow: `0 0 10px ${r.glow}99` }}
                />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.label}</span>
                <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">{Math.round(Math.min(100, r.pct))}%</span>
              </div>
              <div className="flex items-baseline gap-1 mt-1.5">
                <span className="text-lg font-bold tabular-nums">{r.consumed}</span>
                <span className="text-[10px] text-muted-foreground">/ {r.goal} {r.unit}</span>
              </div>
              <div className="mt-1.5">
                {remaining > 0 ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
                    style={{
                      background: `linear-gradient(135deg, ${r.from}22, ${r.to}22)`,
                      color: r.glow,
                      border: `1px solid ${r.glow}55`,
                      boxShadow: `0 0 12px ${r.glow}55, inset 0 0 6px ${r.glow}33`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: r.glow, boxShadow: `0 0 6px ${r.glow}` }}
                    />
                    {remaining} {r.unit} left
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: "linear-gradient(135deg, #10b98122, #5eead422)",
                      color: "#5eead4",
                      border: "1px solid #34d39955",
                      boxShadow: "0 0 12px #34d39955",
                    }}
                  >
                    ✓ Goal reached
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
