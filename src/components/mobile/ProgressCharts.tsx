import { useEffect, useState } from "react";

const NEON = "oklch(0.82 0.18 150)";
const CYAN = "oklch(0.85 0.13 200)";

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setM(true), 40);
    return () => clearTimeout(t);
  }, []);
  return m;
}

/** Smooth area line chart */
export function LineChart({
  data,
  height = 56,
  color = NEON,
  id,
}: {
  data: number[];
  height?: number;
  color?: string;
  id: string;
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-[11px] text-muted-foreground" style={{ height }}>
        Not enough data yet
      </div>
    );
  }
  const w = 320;
  const pad = 5;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g-${id})`} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: 1200, strokeDashoffset: 0, animation: "dashIn 1.1s ease-out" }}
      />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.8" fill={color} />
    </svg>
  );
}

/** Vertical bars with day labels */
export function BarChart({
  data,
  labels,
  height = 64,
  color = "primary",
  goal,
}: {
  data: number[];
  labels?: string[];
  height?: number;
  color?: "primary" | "cyan" | "amber" | "violet";
  goal?: number;
}) {
  const mounted = useMounted();
  const max = Math.max(goal ?? 0, ...data, 1);
  const tone = {
    primary: "from-primary/50 to-primary",
    cyan: "from-cyan-400/40 to-cyan-300",
    amber: "from-amber-400/40 to-amber-300",
    violet: "from-violet-400/40 to-violet-300",
  }[color];
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
          <div
            className={`w-full rounded-md bg-gradient-to-t ${v > 0 ? tone : "from-white/[0.03] to-white/[0.05]"}`}
            style={{
              height: mounted ? `${Math.max(v > 0 ? 8 : 4, (v / max) * 100)}%` : "4%",
              transition: `height .7s cubic-bezier(.2,.8,.2,1) ${i * 40}ms`,
            }}
          />
          {labels && <span className="text-[9px] text-muted-foreground/70">{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

/** Circular score ring */
export function ScoreRing({
  pct,
  size = 92,
  stroke = 8,
  label,
  value,
  color = NEON,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  label?: string;
  value?: string;
  color?: string;
}) {
  const mounted = useMounted();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={mounted ? c - (p / 100) * c : c}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums leading-none">{value ?? `${Math.round(p)}%`}</span>
        {label && <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">{label}</span>}
      </div>
    </div>
  );
}

export const CHART_COLORS = { NEON, CYAN };
