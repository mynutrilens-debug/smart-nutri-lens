import { useMemo, useState } from "react";
import { Clock, Flame, ChevronDown, UtensilsCrossed, Search } from "lucide-react";

export type FoodLog = {
  id: string;
  name: string;
  meal_type: string;
  calories: number | null;
  protein_g: number | string | null;
  carbs_g: number | string | null;
  fat_g: number | string | null;
  image_url: string | null;
  notes: string | null;
  logged_at: string;
};

export type Range = "today" | "week" | "month";

const RANGES: { id: Range; label: string; days: number }[] = [
  { id: "today", label: "Today", days: 1 },
  { id: "week", label: "Week", days: 7 },
  { id: "month", label: "Month", days: 30 },
];

const MEAL_TONE: Record<string, string> = {
  breakfast: "text-amber-300 border-amber-300/25 bg-amber-300/10",
  lunch: "text-primary border-primary/25 bg-primary/10",
  dinner: "text-violet-300 border-violet-300/25 bg-violet-300/10",
  snack: "text-cyan-300 border-cyan-300/25 bg-cyan-300/10",
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function prettyDay(key: string) {
  const today = dayKey(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (key === today) return "Today";
  if (key === dayKey(y)) return "Yesterday";
  return new Date(key + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function MealHistory({ foods }: { foods: FoodLog[] }) {
  const [range, setRange] = useState<Range>("week");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)!.days;
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - (days - 1));
    const term = q.trim().toLowerCase();
    return foods
      .filter((f) => new Date(f.logged_at) >= from)
      .filter((f) => (term ? f.name.toLowerCase().includes(term) : true));
  }, [foods, range, q]);

  const groups = useMemo(() => {
    const map = new Map<string, FoodLog[]>();
    for (const f of filtered) {
      const k = dayKey(new Date(f.logged_at));
      map.set(k, [...(map.get(k) ?? []), f]);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const totals = filtered.reduce(
    (a, f) => ({
      kcal: a.kcal + (f.calories ?? 0),
      p: a.p + Number(f.protein_g ?? 0),
      c: a.c + Number(f.carbs_g ?? 0),
      fat: a.fat + Number(f.fat_g ?? 0),
    }),
    { kcal: 0, p: 0, c: 0, fat: 0 },
  );
  const daysSpan = Math.max(1, groups.length);

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-primary" /> Meal history
        </h2>
        <span className="text-[11px] text-muted-foreground tabular-nums">{filtered.length} logs</span>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition ${
              range === r.id ? "bg-primary/15 text-primary border border-primary/25" : "text-muted-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <MiniStat label="kcal" value={totals.kcal} />
        <MiniStat label="protein" value={`${Math.round(totals.p)}g`} />
        <MiniStat label="carbs" value={`${Math.round(totals.c)}g`} />
        <MiniStat label="avg/day" value={Math.round(totals.kcal / daysSpan)} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search meals"
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-[13px] outline-none focus:border-primary/40 transition"
        />
      </div>

      {groups.length === 0 && (
        <p className="text-[12px] text-muted-foreground text-center py-6">No meals logged in this period.</p>
      )}

      <div className="space-y-4">
        {groups.map(([key, items]) => {
          const kcal = items.reduce((a, f) => a + (f.calories ?? 0), 0);
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{prettyDay(key)}</span>
                <span className="text-[10px] tabular-nums text-primary/80">{kcal} kcal</span>
              </div>
              <div className="relative pl-4 space-y-2 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-white/[0.07]">
                {items.map((f) => {
                  const expanded = open === f.id;
                  const tone = MEAL_TONE[f.meal_type] ?? MEAL_TONE.snack;
                  return (
                    <div key={f.id} className="relative">
                      <span className="absolute -left-4 top-5 h-2 w-2 rounded-full bg-primary/70 ring-4 ring-primary/10" />
                      <button
                        onClick={() => setOpen(expanded ? null : f.id)}
                        className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 flex items-center gap-3 active:scale-[0.99] transition"
                      >
                        {f.image_url ? (
                          <img
                            src={f.image_url}
                            alt={f.name}
                            loading="lazy"
                            className="h-11 w-11 rounded-lg object-cover border border-white/10"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
                            <UtensilsCrossed className="h-4 w-4 text-primary/70" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">{f.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                            <span className={`px-1.5 py-0.5 rounded-full border capitalize ${tone}`}>{f.meal_type}</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(f.logged_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[13px] font-semibold tabular-nums flex items-center gap-1 justify-end">
                            <Flame className="h-3 w-3 text-primary" />
                            {f.calories ?? 0}
                          </p>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-muted-foreground ml-auto mt-0.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>
                      <div
                        className="grid transition-[grid-template-rows] duration-300"
                        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
                      >
                        <div className="overflow-hidden">
                          <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <MiniStat label="protein" value={`${Math.round(Number(f.protein_g ?? 0))}g`} />
                              <MiniStat label="carbs" value={`${Math.round(Number(f.carbs_g ?? 0))}g`} />
                              <MiniStat label="fat" value={`${Math.round(Number(f.fat_g ?? 0))}g`} />
                            </div>
                            {f.notes && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Ingredients</p>
                                <div className="flex flex-wrap gap-1">
                                  {f.notes
                                    .split(/[,\n·|]/)
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                    .slice(0, 12)
                                    .map((ing, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-[10px] text-foreground/80"
                                      >
                                        {ing}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              Logged {new Date(f.logged_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 text-center">
      <p className="text-[13px] font-semibold tabular-nums leading-none">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
