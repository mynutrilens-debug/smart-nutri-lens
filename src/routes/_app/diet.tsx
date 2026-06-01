import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { foodsQuery, dashboardQuery } from "@/lib/queries";
import { deleteFood, logFood } from "@/lib/food.functions";
import { generateAiPlan } from "@/lib/onboarding.functions";
import { Camera, Sunrise, Sun, Moon, Cookie, Trash2, Sparkles, Loader2, Dumbbell, Zap, GlassWater, Lightbulb, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/diet")({
  component: Diet,
});

const mealMeta: Record<string, { label: string; icon: any; color: string }> = {
  breakfast: { label: "Breakfast", icon: Sunrise, color: "oklch(0.82 0.16 80)" },
  lunch: { label: "Lunch", icon: Sun, color: "oklch(0.84 0.18 145)" },
  dinner: { label: "Dinner", icon: Moon, color: "oklch(0.74 0.22 295)" },
  snack: { label: "Snacks", icon: Cookie, color: "oklch(0.7 0.18 25)" },
};

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

  const plan: any = dash?.profile?.ai_plan;
  const meals = plan?.meals ?? null;
  const mealOrder: { k: string; label: string; icon: any; color: string }[] = [
    { k: "breakfast", label: "Breakfast", icon: Sunrise, color: "oklch(0.82 0.16 80)" },
    { k: "pre_workout", label: "Pre-workout", icon: Zap, color: "oklch(0.78 0.18 60)" },
    { k: "post_workout", label: "Post-workout", icon: Dumbbell, color: "oklch(0.78 0.2 160)" },
    { k: "lunch", label: "Lunch", icon: Sun, color: "oklch(0.84 0.18 145)" },
    { k: "snack", label: "Snack", icon: Cookie, color: "oklch(0.7 0.18 25)" },
    { k: "dinner", label: "Dinner", icon: Moon, color: "oklch(0.74 0.22 295)" },
  ];

  const grouped = (["breakfast", "lunch", "dinner", "snack"] as const).map(t => ({
    type: t,
    items: todays.filter(f => f.meal_type === t),
  }));

  return (
    <div className="px-5 pt-12 pb-8 space-y-5">
      <header className="flex items-center justify-between animate-slide-up">
        <div>
          <p className="text-xs text-muted-foreground">Today</p>
          <h1 className="text-2xl font-bold tracking-tight">Nutrition timeline</h1>
        </div>
        <Link to="/scan" className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-ring active:scale-95">
          <Camera className="h-5 w-5 text-primary-foreground" />
        </Link>
      </header>

      <div className="glass rounded-3xl p-5 grid grid-cols-4 gap-2 text-center animate-slide-up" style={{ animationDelay: ".05s" }}>
        {[
          { l: "kcal", v: totals.calories },
          { l: "Protein", v: `${Math.round(totals.protein)}g` },
          { l: "Carbs", v: `${Math.round(totals.carbs)}g` },
          { l: "Fat", v: `${Math.round(totals.fat)}g` },
        ].map((m, i) => (
          <div key={m.l} className={i === 0 ? "" : "border-l border-white/10"}>
            <div className="text-lg font-bold tabular-nums">{m.v}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{m.l}</div>
          </div>
        ))}
      </div>

      <section className="glass rounded-3xl p-5 space-y-4 animate-slide-up" style={{ animationDelay: ".08s" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Personalized AI plan
            </div>
            {plan?.summary && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{plan.summary}</p>}
            {plan?.bmi && (
              <div className="flex gap-2 mt-2 text-[10px]">
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">BMI {plan.bmi}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground uppercase tracking-wider">{plan.bmi_category}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => genPlan.mutate()}
            disabled={genPlan.isPending}
            className="shrink-0 h-10 px-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold glow-ring flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
          >
            {genPlan.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {plan ? "Regenerate" : "Generate"}
          </button>
        </div>

        {meals && (
          <div className="space-y-2">
            {mealOrder.map(m => {
              const meal = meals[m.k];
              if (!meal) return null;
              const Icon = m.icon;
              return (
                <div key={m.k} className="rounded-2xl bg-white/5 border border-white/5 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${m.color}25` }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                    </div>
                    <span className="text-xs font-semibold">{m.label}</span>
                    {meal.timing && <span className="text-[10px] text-muted-foreground">· {meal.timing}</span>}
                    <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">{meal.calories} kcal</span>
                  </div>
                  <p className="text-xs text-foreground/85 leading-relaxed">{meal.items}</p>
                  <div className="text-[10px] text-muted-foreground tabular-nums mt-1.5">
                    {Math.round(Number(meal.protein_g ?? 0))}P · {Math.round(Number(meal.carbs_g ?? 0))}C · {Math.round(Number(meal.fat_g ?? 0))}F
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {Array.isArray(plan?.shakes) && plan.shakes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold mb-2"><GlassWater className="h-3.5 w-3.5 text-accent" /> Recommended shakes</div>
            <div className="space-y-2">
              {plan.shakes.map((s: any, i: number) => (
                <div key={i} className="rounded-2xl bg-gradient-to-r from-accent/10 to-primary/10 border border-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.when}</span>
                  </div>
                  <p className="text-[11px] text-foreground/80 mt-1 leading-relaxed">{s.ingredients}</p>
                  <div className="text-[10px] text-muted-foreground tabular-nums mt-1">{s.calories} kcal · {s.protein_g}g protein</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(plan?.tips) && plan.tips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold mb-2"><Lightbulb className="h-3.5 w-3.5 text-primary" /> Tips</div>
            <ul className="space-y-1.5">
              {plan.tips.map((t: string, i: number) => (
                <li key={i} className="text-[11px] text-muted-foreground leading-relaxed pl-3 relative">
                  <span className="absolute left-0 top-1.5 h-1 w-1 rounded-full bg-primary" />{t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!plan && !genPlan.isPending && (
          <p className="text-xs text-muted-foreground text-center py-2">Tap Generate to get a personalized plan based on your BMI, goal & preferences.</p>
        )}
      </section>



      <div className="space-y-5">
        {grouped.map((g, gi) => {
          const meta = mealMeta[g.type];
          const Icon = meta.icon;
          const cals = g.items.reduce((a, i) => a + i.calories, 0);
          return (
            <section key={g.type} className="animate-slide-up" style={{ animationDelay: `${.1 + gi * .05}s` }}>
              <div className="flex items-center gap-3 px-1 mb-2">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}25`, boxShadow: `0 0 16px ${meta.color}40` }}>
                  <Icon className="h-4 w-4" style={{ color: meta.color }} />
                </div>
                <h3 className="text-sm font-semibold">{meta.label}</h3>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">{cals} kcal</span>
              </div>
              {g.items.length === 0 ? (
                <Link to="/scan" className="block glass rounded-2xl p-4 text-center text-xs text-muted-foreground border-dashed border-white/10 hover:border-primary/40 transition">
                  + Add {meta.label.toLowerCase()}
                </Link>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-primary/40 via-accent/30 to-transparent" />
                  <div className="space-y-2">
                    {g.items.map(f => (
                      <div key={f.id} className="relative glass rounded-2xl p-3 flex items-center gap-3">
                        <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary glow-ring" />
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/25 to-accent/25 flex items-center justify-center text-xl overflow-hidden shrink-0">
                          {f.image_url ? <img src={f.image_url} className="h-full w-full object-cover" alt="" /> : "🍽️"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{f.name}</div>
                          <div className="text-[11px] text-muted-foreground tabular-nums">
                            {Math.round(Number(f.protein_g))}P · {Math.round(Number(f.carbs_g))}C · {Math.round(Number(f.fat_g))}F
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold tabular-nums">{f.calories}</div>
                          <div className="text-[10px] text-muted-foreground">kcal</div>
                        </div>
                        <button onClick={() => del.mutate(f.id)} className="ml-1 text-muted-foreground/60 hover:text-destructive p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
