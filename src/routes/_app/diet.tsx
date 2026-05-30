import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { foodsQuery } from "@/lib/queries";
import { deleteFood } from "@/lib/food.functions";
import { Camera, Sunrise, Sun, Moon, Cookie, Trash2 } from "lucide-react";
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
