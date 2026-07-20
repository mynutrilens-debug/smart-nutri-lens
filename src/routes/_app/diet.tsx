import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { foodsQuery, dashboardQuery } from "@/lib/queries";
import { deleteFood, logFood } from "@/lib/food.functions";
import { generateAiPlan } from "@/lib/onboarding.functions";
import { Camera, Sunrise, Sun, Moon, Cookie, Trash2, Sparkles, Loader2, Dumbbell, Zap, GlassWater, Lightbulb, Plus, Check, ChefHat, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { RecipeSheet } from "@/components/mobile/RecipeSheet";
import { MealThumb } from "@/components/mobile/MealThumb";
import { useState } from "react";

export const Route = createFileRoute("/_app/diet")({
  component: Diet,
});

const mealMeta: Record<string, { label: string; icon: any; color: string }> = {
  breakfast: { label: "Breakfast", icon: Sunrise, color: "oklch(0.82 0.16 80)" },
  lunch: { label: "Lunch", icon: Sun, color: "oklch(0.84 0.18 145)" },
  dinner: { label: "Dinner", icon: Moon, color: "oklch(0.74 0.22 295)" },
  snack: { label: "Snacks", icon: Cookie, color: "oklch(0.7 0.18 25)" },
};

function meal_name(key: string, meal: any) {
  if (meal?.name) return String(meal.name).slice(0, 200);
  const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const first = String(meal?.items ?? "").split(/[,.•·]/)[0]?.trim();
  return first ? `${label}: ${first.slice(0, 160)}` : label;
}

const MACROS = [
  { key: "calories", label: "Calories", unit: "kcal", color: "#4ADE80" },
  { key: "protein",  label: "Protein",  unit: "g",    color: "#22D3EE" },
  { key: "carbs",    label: "Carbs",    unit: "g",    color: "#A78BFA" },
  { key: "fat",      label: "Fat",      unit: "g",    color: "#F59E0B" },
] as const;

function MacroBars({ totals, goals }: { totals: any; goals: any }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <h2 className="text-sm font-semibold">Today's macros</h2>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>
      </div>
      <div className="space-y-2.5">
        {MACROS.map((m) => {
          const consumed = Math.round(Number(totals[m.key] ?? 0));
          const goal = Math.max(1, Math.round(Number(goals[m.key] ?? 1)));
          const pct = Math.min(100, (consumed / goal) * 100);
          const remaining = Math.max(0, goal - consumed);
          return (
            <div key={m.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
                  <span className="text-[11px] font-medium">{m.label}</span>
                </div>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  <span className="text-foreground font-semibold">{consumed}</span> / {goal} {m.unit}
                  <span className="ml-1.5 text-[10px]" style={{ color: remaining > 0 ? m.color : "#4ADE80" }}>
                    {remaining > 0 ? `· ${remaining} left` : "· ✓"}
                  </span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${m.color}, ${m.color}dd)`,
                    boxShadow: `0 0 10px ${m.color}80`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Diet() {
  const { data } = useSuspenseQuery(foodsQuery);
  const { data: dash } = useQuery(dashboardQuery);
  const qc = useQueryClient();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todays = data.filter(f => new Date(f.logged_at) >= today);

  const totals = todays.reduce((a, f) => ({
    calories: a.calories + f.calories,
    protein: a.protein + Number(f.protein_g),
    carbs: a.carbs + Number(f.carbs_g),
    fat: a.fat + Number(f.fat_g),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const [recipeFor, setRecipeFor] = useState<{ key: string; name: string; meal: any } | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => deleteFood({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["foods"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Removed");
    },
  });

  const genPlan = useMutation({
    mutationFn: () => generateAiPlan(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Personalized plan ready");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not generate plan"),
  });

  const logMeal = useMutation({
    mutationFn: (input: { mealKey: string; meal: any }) => {
      const map: Record<string, "breakfast" | "lunch" | "dinner" | "snack"> = {
        breakfast: "breakfast", lunch: "lunch", dinner: "dinner",
        snack: "snack", pre_workout: "snack", post_workout: "snack",
      };
      const name = meal_name(input.mealKey, input.meal);
      return logFood({ data: {
        name,
        meal_type: map[input.mealKey] ?? "snack",
        calories: Math.round(Number(input.meal.calories ?? 0)),
        protein_g: Math.round(Number(input.meal.protein_g ?? 0)),
        carbs_g: Math.round(Number(input.meal.carbs_g ?? 0)),
        fat_g: Math.round(Number(input.meal.fat_g ?? 0)),
        notes: (input.meal.items ?? "").toString().slice(0, 500),
      }});
    },
    // Optimistic update so progress bars & logged badge update instantly
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["foods"] });
      const prev = qc.getQueryData<any[]>(["foods"]) ?? [];
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        name: meal_name(input.mealKey, input.meal),
        meal_type: (["breakfast","lunch","dinner"].includes(input.mealKey) ? input.mealKey : "snack"),
        calories: Math.round(Number(input.meal.calories ?? 0)),
        protein_g: Math.round(Number(input.meal.protein_g ?? 0)),
        carbs_g: Math.round(Number(input.meal.carbs_g ?? 0)),
        fat_g: Math.round(Number(input.meal.fat_g ?? 0)),
        logged_at: new Date().toISOString(),
        image_url: null,
      };
      qc.setQueryData(["foods"], [optimistic, ...prev]);
      return { prev };
    },
    onError: (e: any, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["foods"], ctx.prev);
      toast.error(e.message ?? "Could not log");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["foods"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onSuccess: () => toast.success("Logged"),
  });

  const plan: any = dash?.profile?.ai_plan;
  const meals = plan?.meals ?? null;
  const mealOrder: { k: string; label: string; icon: any; color: string }[] = [
    { k: "breakfast", label: "Breakfast", icon: Sunrise, color: "#F59E0B" },
    { k: "pre_workout", label: "Pre-workout", icon: Zap, color: "#FBBF24" },
    { k: "post_workout", label: "Post-workout", icon: Dumbbell, color: "#4ADE80" },
    { k: "lunch", label: "Lunch", icon: Sun, color: "#84CC16" },
    { k: "snack", label: "Snack", icon: Cookie, color: "#F97316" },
    { k: "dinner", label: "Dinner", icon: Moon, color: "#A78BFA" },
  ];

  const loggedNames = new Set(todays.map(f => f.name?.toLowerCase().trim()).filter(Boolean));
  const isMealLogged = (key: string, meal: any) => loggedNames.has(meal_name(key, meal).toLowerCase().trim());

  const planGeneratedToday = (() => {
    const d = dash?.profile?.ai_plan_generated_at;
    if (!d) return false;
    const last = new Date(d); const n = new Date();
    return last.getUTCFullYear() === n.getUTCFullYear() && last.getUTCMonth() === n.getUTCMonth() && last.getUTCDate() === n.getUTCDate();
  })();

  const grouped = (["breakfast", "lunch", "dinner", "snack"] as const).map(t => ({
    type: t,
    items: todays.filter(f => f.meal_type === t),
  }));

  return (
    <div className="px-5 pt-12 pb-8 space-y-4">
      <header className="flex items-center justify-between animate-slide-up">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Today</p>
          <h1 className="text-2xl font-bold tracking-tight">Nutrition</h1>
        </div>
        <Link to="/scan" className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.4)] active:scale-95">
          <Camera className="h-5 w-5 text-black" />
        </Link>
      </header>

      <MacroBars
        totals={totals}
        goals={{
          calories: dash?.profile?.daily_calorie_goal ?? 2200,
          protein: dash?.profile?.protein_goal_g ?? 140,
          carbs: dash?.profile?.carbs_goal_g ?? 250,
          fat: dash?.profile?.fat_goal_g ?? 70,
        }}
      />

      {/* AI Plan summary card */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 animate-slide-up" style={{ animationDelay: ".05s" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> AI Plan
              {plan?.bmi && (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-semibold tabular-nums">
                  BMI {plan.bmi}
                </span>
              )}
            </div>
            {plan?.summary && (
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{plan.summary}</p>
            )}
          </div>
          <button
            onClick={() => {
              if (planGeneratedToday) { toast.info("Today's plan is already set."); return; }
              genPlan.mutate();
            }}
            disabled={genPlan.isPending || planGeneratedToday}
            className="shrink-0 h-9 px-3 rounded-xl bg-emerald-500 text-black text-[11px] font-bold shadow-[0_0_16px_rgba(74,222,128,0.4)] flex items-center gap-1 active:scale-95 disabled:opacity-40"
          >
            {genPlan.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {planGeneratedToday ? "Today" : "Generate"}
          </button>
        </div>

        {plan && (
          <>
            <button
              onClick={() => setWhyOpen(v => !v)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-emerald-400/90 hover:text-emerald-400 py-1.5 border-t border-white/[0.04]"
            >
              <span>Why this plan?</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${whyOpen ? "rotate-180" : ""}`} />
            </button>
            {whyOpen && (
              <div className="space-y-2 pt-1 animate-fade-in">
                {plan.bmi_category && (
                  <p className="text-[11px] text-foreground/80">
                    <span className="text-muted-foreground">Category: </span>
                    <span className="font-semibold uppercase tracking-wider text-[10px]">{plan.bmi_category}</span>
                  </p>
                )}
                {Array.isArray(plan.tips) && plan.tips.length > 0 && (
                  <ul className="space-y-1">
                    {plan.tips.map((t: string, i: number) => (
                      <li key={i} className="text-[11px] text-muted-foreground leading-relaxed pl-3 relative">
                        <span className="absolute left-0 top-1.5 h-1 w-1 rounded-full bg-emerald-400" />{t}
                      </li>
                    ))}
                  </ul>
                )}
                {Array.isArray(plan?.shakes) && plan.shakes.length > 0 && (
                  <div className="pt-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      <GlassWater className="h-3 w-3 text-emerald-400" /> Recommended shakes
                    </div>
                    <div className="space-y-1.5">
                      {plan.shakes.map((s: any, i: number) => (
                        <div key={i} className="rounded-lg bg-white/[0.03] border border-white/5 p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold">{s.name}</span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.when}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{s.ingredients}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!plan && !genPlan.isPending && (
          <p className="text-[11px] text-muted-foreground text-center py-1">Tap Generate for a personalized plan.</p>
        )}
      </section>

      {/* Suggested meals — compact */}
      {meals && (
        <section className="space-y-2 animate-slide-up" style={{ animationDelay: ".08s" }}>
          <div className="flex items-center gap-1.5 px-1">
            <Lightbulb className="h-3 w-3 text-emerald-400" />
            <h3 className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Suggested meals</h3>
          </div>
          {mealOrder.map(m => {
            const meal = meals[m.k];
            if (!meal) return null;
            const Icon = m.icon;
            const logged = isMealLogged(m.k, meal);
            const isExpanded = expandedMeal === m.k;
            return (
              <div
                key={m.k}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden transition-all duration-200 hover:border-emerald-400/20"
              >
                <button
                  onClick={() => setExpandedMeal(isExpanded ? null : m.k)}
                  className="w-full p-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</span>
                        {meal.timing && <span className="text-[9px] text-muted-foreground/60">· {meal.timing}</span>}
                      </div>
                      <p className="text-[13px] font-semibold text-foreground truncate mt-0.5">
                        {meal.name || meal_name(m.k, meal)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] tabular-nums text-muted-foreground">
                        <span className="text-emerald-400 font-semibold">{meal.calories} kcal</span>
                        <span>·</span>
                        <span>{Math.round(Number(meal.protein_g ?? 0))}P</span>
                        <span>{Math.round(Number(meal.carbs_g ?? 0))}C</span>
                        <span>{Math.round(Number(meal.fat_g ?? 0))}F</span>
                      </div>
                    </div>
                    <MealThumb name={meal.name || meal_name(m.k, meal)} items={meal.items} fallbackColor={m.color} FallbackIcon={Icon} size={64} />
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 animate-fade-in">
                    <p className="text-[11px] text-foreground/80 leading-relaxed pl-[42px]">{meal.items}</p>
                  </div>
                )}

                <div className="flex items-center gap-1.5 px-3 pb-3 pl-[54px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); setRecipeFor({ key: m.k, name: meal_name(m.k, meal), meal }); }}
                    className="h-7 px-2.5 rounded-full bg-white/5 border border-white/10 text-foreground/90 text-[10px] font-semibold flex items-center gap-1 active:scale-95 hover:bg-white/10 transition"
                  >
                    <ChefHat className="h-3 w-3 text-emerald-400" /> Recipe
                  </button>
                  {logged ? (
                    <span className="h-7 px-2.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 border border-emerald-500/30">
                      <Check className="h-3 w-3" /> Logged
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); logMeal.mutate({ mealKey: m.k, meal }); }}
                      disabled={logMeal.isPending}
                      className="h-7 px-2.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center gap-1 active:scale-95 disabled:opacity-60 shadow-[0_0_12px_rgba(74,222,128,0.3)]"
                    >
                      <Plus className="h-3 w-3" /> Log
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Logged today timeline */}
      <div className="space-y-4">
        {grouped.map((g, gi) => {
          const meta = mealMeta[g.type];
          const Icon = meta.icon;
          const cals = g.items.reduce((a, i) => a + i.calories, 0);
          return (
            <section key={g.type} className="animate-slide-up" style={{ animationDelay: `${.1 + gi * .04}s` }}>
              <div className="flex items-center gap-2 px-1 mb-2">
                <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}20` }}>
                  <Icon className="h-3 w-3" style={{ color: meta.color }} />
                </div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider">{meta.label}</h3>
                <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{cals} kcal</span>
              </div>
              {g.items.length === 0 ? (
                <Link to="/scan" className="block rounded-xl p-3 text-center text-[11px] text-muted-foreground border border-dashed border-white/10 hover:border-emerald-400/40 transition">
                  + Add {meta.label.toLowerCase()}
                </Link>
              ) : (
                <div className="space-y-1.5">
                  {g.items.map(f => (
                    <div key={f.id} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-2.5 flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 flex items-center justify-center text-lg overflow-hidden shrink-0">
                        {f.image_url ? <img src={f.image_url} className="h-full w-full object-cover" alt="" /> : "🍽️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{f.name}</div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {Math.round(Number(f.protein_g))}P · {Math.round(Number(f.carbs_g))}C · {Math.round(Number(f.fat_g))}F
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[13px] font-semibold tabular-nums text-emerald-400">{f.calories}</div>
                        <div className="text-[9px] text-muted-foreground">kcal</div>
                      </div>
                      <button onClick={() => del.mutate(f.id)} className="text-muted-foreground/60 hover:text-destructive p-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {recipeFor && (
        <RecipeSheet
          open={!!recipeFor}
          onOpenChange={(v) => { if (!v) setRecipeFor(null); }}
          mealKey={recipeFor.key}
          mealName={recipeFor.name}
          meal={recipeFor.meal}
        />
      )}
    </div>
  );
}
