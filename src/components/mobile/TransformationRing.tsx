type Props = {
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  bmi: number;
  bmiLabel: string;
  week: number;
  totalWeeks: number;
};

export function TransformationRing({
  startWeight, currentWeight, targetWeight, bmi, bmiLabel, week, totalWeeks,
}: Props) {
  const totalDelta = Math.abs(startWeight - targetWeight) || 1;
  const progressedDelta = Math.abs(startWeight - currentWeight);
  const pct = Math.min(100, Math.round((progressedDelta / totalDelta) * 100));
  const weekPct = Math.min(100, Math.round((week / Math.max(1, totalWeeks)) * 100));

  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r1 = 100;
  const r2 = 82;
  const stroke = 14;
  const stroke2 = 8;
  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;
  const off1 = c1 - (pct / 100) * c1;
  const off2 = c2 - (weekPct / 100) * c2;

  const tone =
    bmi < 18.5 ? "text-sky-300" :
    bmi < 25   ? "text-emerald-300" :
    bmi < 30   ? "text-amber-300" : "text-rose-300";

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="trGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="trGrad2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <filter id="trGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r1} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <circle cx={cx} cy={cy} r={r1} fill="none" stroke="url(#trGrad)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c1} strokeDashoffset={off1} filter="url(#trGlow)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }} />
        <circle cx={cx} cy={cy} r={r2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke2} />
        <circle cx={cx} cy={cy} r={r2} fill="none" stroke="url(#trGrad2)" strokeWidth={stroke2} strokeLinecap="round"
          strokeDasharray={c2} strokeDashoffset={off2}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Now</p>
        <p className="text-4xl font-bold tabular-nums bg-gradient-to-b from-cyan-200 via-violet-200 to-emerald-200 bg-clip-text text-transparent leading-none mt-0.5">
          {currentWeight.toFixed(1)}
        </p>
        <p className="text-[10px] text-muted-foreground">kg</p>
        <div className="flex items-center gap-1.5 mt-2 text-[10px]">
          <span className="tabular-nums font-semibold text-foreground/90">{pct}%</span>
          <span className="text-muted-foreground">transformed</span>
        </div>
        <p className={`text-[10px] mt-0.5 ${tone}`}>BMI {bmi.toFixed(1)} · {bmiLabel}</p>
        <p className="text-[10px] text-amber-300/90 mt-0.5">Week {week} / {totalWeeks}</p>
      </div>

      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-4 text-center w-[260px] justify-between px-2">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Start</p>
          <p className="text-sm font-semibold tabular-nums">{startWeight.toFixed(1)}<span className="text-[10px] text-muted-foreground ml-0.5">kg</span></p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Target</p>
          <p className="text-sm font-semibold tabular-nums text-emerald-300">{targetWeight.toFixed(1)}<span className="text-[10px] text-muted-foreground ml-0.5">kg</span></p>
        </div>
      </div>
    </div>
  );
}
