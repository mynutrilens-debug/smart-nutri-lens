import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { generateRecipe } from "@/lib/recipe.functions";
import { Loader2, Clock, Flame, ChefHat, Youtube, Sparkles, ArrowRightLeft, Lightbulb, UtensilsCrossed, X } from "lucide-react";

type Meal = {
  name?: string;
  items?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
};

export function RecipeSheet({
  open, onOpenChange, mealKey, mealName, meal,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mealKey: string;
  mealName: string;
  meal: Meal;
}) {
  const [recipe, setRecipe] = useState<any>(null);

  const gen = useMutation({
    mutationFn: () => generateRecipe({ data: {
      meal_key: mealKey,
      meal_name: mealName,
      meal_items: String(meal?.items ?? ""),
      calories: Math.round(Number(meal?.calories ?? 0)),
      protein_g: Math.round(Number(meal?.protein_g ?? 0)),
      carbs_g: Math.round(Number(meal?.carbs_g ?? 0)),
      fat_g: Math.round(Number(meal?.fat_g ?? 0)),
    }}),
    onSuccess: (data) => setRecipe(data),
  });

  useEffect(() => {
    if (open && !recipe && !gen.isPending && !gen.isError) gen.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(() => { setRecipe(null); gen.reset(); }, 250);
  };

  const ytUrl = recipe?.youtube_query
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.youtube_query)}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${mealName} healthy recipe`)}`;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-zinc-950 border-t border-emerald-500/20 text-white p-0 h-[92vh] rounded-t-3xl overflow-hidden flex flex-col"
      >
        {/* Grabber */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-white/15" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3 flex items-start gap-3 shrink-0 border-b border-white/5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-700/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ChefHat className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <SheetTitle className="text-base font-semibold text-white leading-tight truncate">
              {recipe?.title ?? mealName}
            </SheetTitle>
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
              {recipe?.cuisine ?? "Personalized recipe"} · matches your plan
            </p>
          </div>
          <button
            onClick={() => handleOpenChange(false)}
            className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-95"
          >
            <X className="h-4 w-4 text-zinc-300" />
          </button>
        </div>

        {/* Scroll body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-4 space-y-4">
          {gen.isPending && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
              </div>
              <p className="text-sm font-medium text-zinc-200">Crafting your recipe…</p>
              <p className="text-[11px] text-zinc-500">Tuned to your diet, cuisine & goal</p>
            </div>
          )}

          {gen.isError && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-center animate-fade-in">
              <p className="text-sm text-red-300 mb-3">{(gen.error as any)?.message ?? "Couldn't load recipe"}</p>
              <button
                onClick={() => gen.mutate()}
                className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold active:scale-95"
              >
                Try again
              </button>
            </div>
          )}

          {recipe && (
            <div className="space-y-4 animate-fade-in">
              {/* YouTube CTA */}
              <a
                href={ytUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-red-500/20 via-zinc-900 to-zinc-950 relative group active:scale-[0.99] transition"
              >
                <div className="aspect-video flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.25),transparent_60%)]" />
                  <div className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] group-active:scale-95 transition">
                    <Youtube className="h-6 w-6 text-white fill-white" />
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
                  <div>
                    <div className="text-xs font-semibold text-white">Watch Tutorial</div>
                    <div className="text-[10px] text-zinc-400 truncate max-w-[220px]">{recipe.youtube_query}</div>
                  </div>
                  <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Open</span>
                </div>
              </a>

              {/* Meta */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: Clock, label: "Prep", val: `${recipe.prep_min ?? 0}m` },
                  { icon: Flame, label: "Cook", val: `${recipe.cook_min ?? 0}m` },
                  { icon: UtensilsCrossed, label: "Serves", val: recipe.servings ?? 1 },
                  { icon: Sparkles, label: "kcal", val: recipe.calories ?? meal.calories ?? 0 },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl bg-white/5 border border-white/5 p-2.5 text-center">
                    <s.icon className="h-3.5 w-3.5 text-emerald-400 mx-auto mb-1" />
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{s.label}</div>
                    <div className="text-sm font-semibold tabular-nums">{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Macros */}
              {recipe.macros && (
                <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-700/5 border border-emerald-500/15 p-3 flex justify-around text-center">
                  {[
                    { l: "Protein", v: recipe.macros.protein_g, c: "text-emerald-400" },
                    { l: "Carbs", v: recipe.macros.carbs_g, c: "text-amber-400" },
                    { l: "Fat", v: recipe.macros.fat_g, c: "text-rose-400" },
                  ].map((m, i) => (
                    <div key={i}>
                      <div className={`text-base font-bold tabular-nums ${m.c}`}>{Math.round(Number(m.v ?? 0))}g</div>
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{m.l}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Ingredients */}
              {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="h-1 w-4 rounded-full bg-emerald-400" /> Ingredients
                  </h3>
                  <ul className="rounded-2xl bg-white/[0.03] border border-white/5 divide-y divide-white/5">
                    {recipe.ingredients.map((ing: any, i: number) => (
                      <li key={i} className="flex items-start gap-3 px-3 py-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white leading-tight">
                            <span className="font-medium">{ing.item}</span>
                            {ing.qty && <span className="text-zinc-400"> — {ing.qty}</span>}
                          </div>
                          {ing.note && <div className="text-[11px] text-zinc-500 mt-0.5">{ing.note}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Steps */}
              {Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="h-1 w-4 rounded-full bg-emerald-400" /> Method
                  </h3>
                  <ol className="space-y-2">
                    {recipe.steps.map((s: string, i: number) => (
                      <li
                        key={i}
                        className="flex gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-3 animate-slide-up"
                        style={{ animationDelay: `${i * 0.03}s` }}
                      >
                        <div className="h-6 w-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-[13px] text-zinc-200 leading-relaxed flex-1">{s}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Alternatives */}
              {Array.isArray(recipe.alternatives) && recipe.alternatives.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-400" /> Healthy swaps
                  </h3>
                  <div className="space-y-2">
                    {recipe.alternatives.map((a: any, i: number) => (
                      <div key={i} className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/15 p-3">
                        <div className="text-xs font-semibold text-emerald-300">{a.swap}</div>
                        {a.why && <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{a.why}</div>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Tips */}
              {Array.isArray(recipe.tips) && recipe.tips.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Chef tips
                  </h3>
                  <ul className="space-y-1.5">
                    {recipe.tips.map((t: string, i: number) => (
                      <li key={i} className="text-[12px] text-zinc-300 leading-relaxed pl-3 relative">
                        <span className="absolute left-0 top-1.5 h-1 w-1 rounded-full bg-amber-400" />{t}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {recipe.nutrition_notes && (
                <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/15 p-3">
                  <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Why this fits your plan</div>
                  <p className="text-[12px] text-zinc-200 leading-relaxed">{recipe.nutrition_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
