import { useEffect, useState } from "react";

export function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = Math.min(100, goal > 0 ? (consumed / goal) * 100 : 0);
  const r = 84;
  const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);

  useEffect(() => {
    const t = setTimeout(() => setOffset(c - (pct / 100) * c), 60);
    return () => clearTimeout(t);
  }, [pct, c]);

  const remaining = Math.max(0, goal - consumed);

  return (
    <div className="relative h-56 w-56 mx-auto">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl animate-pulse-glow" />
      <svg viewBox="0 0 200 200" className="relative h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.85 0.2 145)" />
            <stop offset="100%" stopColor="oklch(0.74 0.22 295)" />
          </linearGradient>
          <filter id="ringGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx="100" cy="100" r={r} stroke="oklch(1 0 0 / 8%)" strokeWidth="14" fill="none" />
        <circle cx="100" cy="100" r={r} stroke="url(#ringGrad)" strokeWidth="14" fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          filter="url(#ringGlow)"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Remaining</span>
        <span className="text-5xl font-bold tabular-nums mt-1">{remaining}</span>
        <span className="text-xs text-muted-foreground mt-1">of {goal} kcal</span>
        <span className="mt-2 text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10">{Math.round(pct)}% consumed</span>
      </div>
    </div>
  );
}
