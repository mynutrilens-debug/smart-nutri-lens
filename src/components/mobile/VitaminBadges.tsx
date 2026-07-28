// Displays micronutrient/vitamin details as compact colored chips.
// Used in scan results and AI-suggested meal cards.

export type Micronutrients = Partial<{
  fiber_g: number;
  b12_mcg: number;
  vitamin_d_iu: number;
  iron_mg: number;
  calcium_mg: number;
  magnesium_mg: number;
  zinc_mg: number;
  omega3_mg: number;
  vitamin_c_mg: number;
}>;

// Adult RDA reference values (approximate; used for % daily value badges)
const RDA = {
  fiber_g: 25,
  b12_mcg: 2.4,
  vitamin_d_iu: 800,
  iron_mg: 15,
  calcium_mg: 1000,
  magnesium_mg: 400,
  zinc_mg: 10,
  omega3_mg: 500,
  vitamin_c_mg: 90,
} as const;

const META: {
  key: keyof Micronutrients;
  label: string;
  unit: string;
  color: string;
}[] = [
  { key: "fiber_g",      label: "Fiber",   unit: "g",   color: "#22C55E" },
  { key: "b12_mcg",      label: "B12",     unit: "mcg", color: "#F472B6" },
  { key: "vitamin_d_iu", label: "D3",      unit: "IU",  color: "#FBBF24" },
  { key: "iron_mg",      label: "Iron",    unit: "mg",  color: "#EF4444" },
  { key: "calcium_mg",   label: "Calcium", unit: "mg",  color: "#E0F2FE" },
  { key: "magnesium_mg", label: "Mg",      unit: "mg",  color: "#A78BFA" },
  { key: "zinc_mg",      label: "Zinc",    unit: "mg",  color: "#38BDF8" },
  { key: "omega3_mg",    label: "Omega-3", unit: "mg",  color: "#60A5FA" },
  { key: "vitamin_c_mg", label: "Vit C",   unit: "mg",  color: "#F97316" },
];

function fmt(v: number) {
  if (v >= 100) return Math.round(v).toString();
  if (v >= 10) return v.toFixed(0);
  return v.toFixed(1).replace(/\.0$/, "");
}

export function VitaminBadges({
  micros,
  title = "Vitamins & minerals",
  compact = false,
}: {
  micros?: Micronutrients | null;
  title?: string;
  compact?: boolean;
}) {
  if (!micros) return null;
  const items = META.filter((m) => Number(micros[m.key] ?? 0) > 0);
  if (items.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {!compact && (
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </div>
      )}
      <div className={`flex flex-wrap ${compact ? "gap-1" : "gap-1.5"}`}>
        {items.map((m) => {
          const v = Number(micros[m.key] ?? 0);
          const rda = RDA[m.key as keyof typeof RDA];
          const pct = rda ? Math.min(999, Math.round((v / rda) * 100)) : null;
          return (
            <span
              key={m.key}
              title={pct !== null ? `${pct}% of RDA` : undefined}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] tabular-nums"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: m.color, boxShadow: `0 0 6px ${m.color}` }}
              />
              <span className="font-semibold" style={{ color: m.color }}>
                {m.label}
              </span>
              <span className="text-foreground/80">
                {fmt(v)}
                <span className="text-muted-foreground/70 ml-0.5">{m.unit}</span>
              </span>
              {pct !== null && (
                <span className="text-[9px] text-muted-foreground/70">
                  · {pct}%
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
