import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Clock,
  Flame,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Search,
  CalendarDays,
  X,
  Loader2,
} from "lucide-react";
import { getMealMonth } from "@/lib/progress.functions";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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

const MEAL_TONE: Record<string, string> = {
  breakfast: "text-amber-300 border-amber-300/25 bg-amber-300/10",
  lunch: "text-primary border-primary/25 bg-primary/10",
  dinner: "text-violet-300 border-violet-300/25 bg-violet-300/10",
  snack: "text-cyan-300 border-cyan-300/25 bg-cyan-300/10",
};

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;
const FILTERS = [
  { id: "all", label: "All" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snacks" },
] as const;

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthKey(d: Date) {
  return dayKey(d).slice(0, 7);
}

function shiftDay(key: string, delta: number) {
  const d = new Date(key + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return dayKey(d);
}

function prettyDay(key: string) {
  const today = dayKey(new Date());
  if (key === today) return "Today";
  if (key === shiftDay(today, -1)) return "Yesterday";
  return new Date(key + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function MealHistory({ foods }: { foods: FoodLog[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [selected, setSelected] = useState<string | null>(null);

  const month = monthKey(cursor);
  const fetchMonth = useServerFn(getMealMonth);
  const seed = useMemo(
    () => foods.filter((f) => dayKey(new Date(f.logged_at)).startsWith(month)),
    [foods, month],
  );

  const { data, isFetching } = useQuery({
    queryKey: ["meal-month", month],
    queryFn: () => fetchMonth({ data: { month } }),
    staleTime: 60_000,
    placeholderData: { month, foods: seed as FoodLog[] },
  });

  const monthFoods = (data?.foods ?? seed) as FoodLog[];
  const term = q.trim().toLowerCase();

  const visible = useMemo(
    () =>
      monthFoods
        .filter((f) => (filter === "all" ? true : (f.meal_type || "snack") === filter))
        .filter((f) => (term ? f.name.toLowerCase().includes(term) : true)),
    [monthFoods, filter, term],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, FoodLog[]>();
    for (const f of visible) {
      const k = dayKey(new Date(f.logged_at));
      map.set(k, [...(map.get(k) ?? []), f]);
    }
    return map;
  }, [visible]);

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const lead = first.getDay();
    const out: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let i = 1; i <= daysInMonth; i++) out.push(dayKey(new Date(cursor.getFullYear(), cursor.getMonth(), i)));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [cursor]);

  const todayKey = dayKey(new Date());
  const monthTotals = visible.reduce(
    (a, f) => ({ kcal: a.kcal + (f.calories ?? 0), p: a.p + Number(f.protein_g ?? 0) }),
    { kcal: 0, p: 0 },
  );
  const loggedDays = byDay.size;
  const isCurrentMonth = month === todayKey.slice(0, 7);

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" /> Meal history
          {isFetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </h2>
        <span className="text-[11px] text-muted-foreground tabular-nums">{visible.length} logs</span>
      </div>

      {/* month nav */}
      <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-2 py-1.5">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="h-7 w-7 rounded-lg grid place-items-center text-muted-foreground active:scale-95 transition"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[13px] font-semibold">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
        <button
          disabled={isCurrentMonth}
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="h-7 w-7 rounded-lg grid place-items-center text-muted-foreground disabled:opacity-25 active:scale-95 transition"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* calendar */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-[9px] uppercase tracking-wider text-muted-foreground py-1">
            {d}
          </span>
        ))}
        {cells.map((key, i) => {
          if (!key) return <span key={`e${i}`} />;
          const items = byDay.get(key) ?? [];
          const mains = new Set(items.map((f) => f.meal_type).filter((m) => m !== "snack"));
          const state =
            items.length === 0 ? "none" : mains.size >= 3 ? "full" : "partial";
          const future = key > todayKey;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              disabled={future}
              onClick={() => setSelected(key)}
              className={`relative aspect-square rounded-xl border text-[12px] font-medium tabular-nums flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                future
                  ? "border-transparent text-muted-foreground/25"
                  : state === "full"
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : state === "partial"
                      ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                      : "border-white/[0.06] bg-white/[0.02] text-muted-foreground"
              } ${isToday ? "ring-1 ring-primary/60" : ""}`}
            >
              {Number(key.slice(-2))}
              {!future && (
                <span
                  className={`h-1 w-1 rounded-full ${
                    state === "full"
                      ? "bg-primary"
                      : state === "partial"
                        ? "bg-amber-300"
                        : "bg-white/15"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3 text-[9px] text-muted-foreground">
        <Legend cls="bg-primary" label="Complete" />
        <Legend cls="bg-amber-300" label="Partial" />
        <Legend cls="bg-white/20" label="Missed" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="days logged" value={loggedDays} />
        <MiniStat label="avg kcal" value={loggedDays ? Math.round(monthTotals.kcal / loggedDays) : 0} />
        <MiniStat label="protein" value={`${Math.round(monthTotals.p)}g`} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search meals this month"
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-[13px] outline-none focus:border-primary/40 transition"
        />
      </div>

      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition ${
              filter === f.id
                ? "bg-primary/15 text-primary border-primary/25"
                : "text-muted-foreground border-white/[0.07] bg-white/[0.02]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {term && (
        <div className="space-y-1">
          {visible.length === 0 && (
            <p className="text-[12px] text-muted-foreground text-center py-3">No matches this month.</p>
          )}
          {visible.slice(0, 8).map((f) => (
            <button
              key={f.id}
              onClick={() => setSelected(dayKey(new Date(f.logged_at)))}
              className="w-full flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left"
            >
              <span className="text-[12px] truncate">{f.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                {prettyDay(dayKey(new Date(f.logged_at)))}
              </span>
            </button>
          ))}
        </div>
      )}

      <DaySheet
        dayKeyValue={selected}
        onClose={() => setSelected(null)}
        onChangeDay={(k) => setSelected(k)}
        filter={filter}
        seedFoods={foods}
      />
    </section>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-1.5 w-1.5 rounded-full ${cls}`} /> {label}
    </span>
  );
}

function DaySheet({
  dayKeyValue,
  onClose,
  onChangeDay,
  filter,
  seedFoods,
}: {
  dayKeyValue: string | null;
  onClose: () => void;
  onChangeDay: (k: string) => void;
  filter: string;
  seedFoods: FoodLog[];
}) {
  const fetchMonth = useServerFn(getMealMonth);
  const month = dayKeyValue ? dayKeyValue.slice(0, 7) : "";
  const [open, setOpen] = useState<string | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [slide, setSlide] = useState<"l" | "r" | null>(null);

  useEffect(() => setOpen(null), [dayKeyValue]);

  const { data } = useQuery({
    queryKey: ["meal-month", month],
    queryFn: () => fetchMonth({ data: { month } }),
    enabled: !!month,
    staleTime: 60_000,
    placeholderData: {
      month,
      foods: seedFoods.filter((f) => dayKey(new Date(f.logged_at)).startsWith(month)) as FoodLog[],
    },
  });

  const items = useMemo(() => {
    if (!dayKeyValue) return [];
    return ((data?.foods ?? []) as FoodLog[])
      .filter((f) => dayKey(new Date(f.logged_at)) === dayKeyValue)
      .filter((f) => (filter === "all" ? true : (f.meal_type || "snack") === filter))
      .sort((a, b) => (a.logged_at < b.logged_at ? -1 : 1));
  }, [data, dayKeyValue, filter]);

  const totals = items.reduce(
    (a, f) => ({
      kcal: a.kcal + (f.calories ?? 0),
      p: a.p + Number(f.protein_g ?? 0),
      c: a.c + Number(f.carbs_g ?? 0),
      fat: a.fat + Number(f.fat_g ?? 0),
    }),
    { kcal: 0, p: 0, c: 0, fat: 0 },
  );

  const today = dayKey(new Date());
  const go = (delta: number) => {
    if (!dayKeyValue) return;
    const next = shiftDay(dayKeyValue, delta);
    if (next > today) return;
    setSlide(delta > 0 ? "l" : "r");
    onChangeDay(next);
    window.setTimeout(() => setSlide(null), 220);
  };

  return (
    <Sheet open={!!dayKeyValue} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-3xl border-white/[0.08] bg-background/95 backdrop-blur-xl p-0 overflow-hidden [&>button]:hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={() => go(-1)}
            className="h-8 w-8 rounded-lg grid place-items-center text-muted-foreground active:scale-95"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-[14px] font-semibold">{dayKeyValue ? prettyDay(dayKeyValue) : ""}</p>
            <p className="text-[10px] text-muted-foreground tabular-nums">
              {items.length} meals · {totals.kcal} kcal
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => go(1)}
              disabled={!dayKeyValue || dayKeyValue >= today}
              className="h-8 w-8 rounded-lg grid place-items-center text-muted-foreground disabled:opacity-25 active:scale-95"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg grid place-items-center text-muted-foreground active:scale-95"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-2 grid grid-cols-4 gap-2">
          <MiniStat label="kcal" value={totals.kcal} />
          <MiniStat label="protein" value={`${Math.round(totals.p)}g`} />
          <MiniStat label="carbs" value={`${Math.round(totals.c)}g`} />
          <MiniStat label="fat" value={`${Math.round(totals.fat)}g`} />
        </div>

        <div
          onTouchStart={(e) => {
            touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            const s = touch.current;
            touch.current = null;
            if (!s) return;
            const dx = e.changedTouches[0].clientX - s.x;
            const dy = e.changedTouches[0].clientY - s.y;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
          }}
          className={`h-[calc(85vh-150px)] overflow-y-auto px-4 pb-24 space-y-4 transition-all duration-200 ${
            slide === "l" ? "translate-x-2 opacity-70" : slide === "r" ? "-translate-x-2 opacity-70" : ""
          }`}
        >
          {items.length === 0 && (
            <p className="text-[12px] text-muted-foreground text-center py-10">No meals logged on this day.</p>
          )}

          {MEAL_ORDER.map((type) => {
            const group = items.filter((f) => (f.meal_type || "snack") === type);
            if (!group.length) return null;
            const kcal = group.reduce((a, f) => a + (f.calories ?? 0), 0);
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground capitalize">
                    {type}
                  </span>
                  <span className="text-[10px] tabular-nums text-primary/80">{kcal} kcal</span>
                </div>
                <div className="space-y-2">
                  {group.map((f) => (
                    <MealCard
                      key={f.id}
                      food={f}
                      expanded={open === f.id}
                      onToggle={() => setOpen(open === f.id ? null : f.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MealCard({ food: f, expanded, onToggle }: { food: FoodLog; expanded: boolean; onToggle: () => void }) {
  const tone = MEAL_TONE[f.meal_type] ?? MEAL_TONE.snack;
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 flex items-center gap-3 active:scale-[0.99] transition"
      >
        {f.image_url ? (
          <img
            src={f.image_url}
            alt={f.name}
            loading="lazy"
            className="h-12 w-12 rounded-lg object-cover border border-white/10"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
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
      <div className="grid transition-[grid-template-rows] duration-300" style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}>
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
            <p className="text-[10px] text-muted-foreground">Logged {new Date(f.logged_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
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
