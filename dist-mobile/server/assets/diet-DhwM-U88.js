import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { f as foodsQuery, d as dashboardQuery } from "./queries-DQC1c2F_.js";
import { d as deleteFood, a as logFood } from "./food.functions-C13l6RKQ.js";
import { g as generateAiPlan } from "./onboarding.functions-BQXgSjBg.js";
import { ChefHat, X, Loader2, Youtube, Clock, Flame, UtensilsCrossed, Sparkles, ArrowRightLeft, Lightbulb, Camera, ChevronDown, GlassWater, Sunrise, Zap, Dumbbell, Sun, Cookie, Moon, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { S as Sheet, a as SheetContent, b as SheetTitle } from "./sheet-WM_CB9Ob.js";
import { c as createSsrRpc } from "./router-D-2d6VGp.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as createServerFn } from "./server-BadC42R4.js";
import "@radix-ui/react-dialog";
import "class-variance-authority";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "./client-BMbiJotd.js";
import "@supabase/supabase-js";
import "@capacitor/core";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
const RecipeInput = z.object({
  meal_key: z.string().min(1).max(40),
  meal_name: z.string().min(1).max(200),
  meal_items: z.string().max(600).optional().default(""),
  calories: z.number().optional().default(0),
  protein_g: z.number().optional().default(0),
  carbs_g: z.number().optional().default(0),
  fat_g: z.number().optional().default(0)
});
const generateRecipe = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => RecipeInput.parse(d)).handler(createSsrRpc("5b5777832605e1f58e39b65dfba8f6a1334f48df5cf5b856eacc8845123ac28f"));
function RecipeSheet({
  open,
  onOpenChange,
  mealKey,
  mealName,
  meal
}) {
  const [recipe, setRecipe] = useState(null);
  const gen = useMutation({
    mutationFn: () => generateRecipe({ data: {
      meal_key: mealKey,
      meal_name: mealName,
      meal_items: String(meal?.items ?? ""),
      calories: Math.round(Number(meal?.calories ?? 0)),
      protein_g: Math.round(Number(meal?.protein_g ?? 0)),
      carbs_g: Math.round(Number(meal?.carbs_g ?? 0)),
      fat_g: Math.round(Number(meal?.fat_g ?? 0))
    } }),
    onSuccess: (data) => setRecipe(data)
  });
  useEffect(() => {
    if (open && !recipe && !gen.isPending && !gen.isError) gen.mutate();
  }, [open]);
  const handleOpenChange = (v) => {
    onOpenChange(v);
    if (!v) setTimeout(() => {
      setRecipe(null);
      gen.reset();
    }, 250);
  };
  const ytUrl = recipe?.youtube_query ? `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.youtube_query)}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${mealName} healthy recipe`)}`;
  return /* @__PURE__ */ jsx(Sheet, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxs(
    SheetContent,
    {
      side: "bottom",
      className: "bg-zinc-950 border-t border-emerald-500/20 text-white p-0 h-[92vh] rounded-t-3xl overflow-hidden flex flex-col",
      children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center pt-2.5 pb-1 shrink-0", children: /* @__PURE__ */ jsx("div", { className: "h-1.5 w-12 rounded-full bg-white/15" }) }),
        /* @__PURE__ */ jsxs("div", { className: "px-5 pt-2 pb-3 flex items-start gap-3 shrink-0 border-b border-white/5", children: [
          /* @__PURE__ */ jsx("div", { className: "h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-700/10 border border-emerald-500/30 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(ChefHat, { className: "h-5 w-5 text-emerald-400" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx(SheetTitle, { className: "text-base font-semibold text-white leading-tight truncate", children: recipe?.title ?? mealName }),
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-zinc-400 mt-0.5 truncate", children: [
              recipe?.cuisine ?? "Personalized recipe",
              " · matches your plan"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleOpenChange(false),
              className: "h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center active:scale-95",
              children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4 text-zinc-300" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-4 space-y-4", children: [
          gen.isPending && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 gap-3 animate-fade-in", children: [
            /* @__PURE__ */ jsx("div", { className: "h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-5 w-5 text-emerald-400 animate-spin" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-zinc-200", children: "Crafting your recipe…" }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-zinc-500", children: "Tuned to your diet, cuisine & goal" })
          ] }),
          gen.isError && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-center animate-fade-in", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-red-300 mb-3", children: gen.error?.message ?? "Couldn't load recipe" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => gen.mutate(),
                className: "h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold active:scale-95",
                children: "Try again"
              }
            )
          ] }),
          recipe && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-fade-in", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const win = window.open(ytUrl, "_blank", "noopener,noreferrer");
                  if (!win) window.top ? window.top.location.href = ytUrl : window.location.href = ytUrl;
                },
                className: "block w-full text-left rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-red-500/20 via-zinc-900 to-zinc-950 relative group active:scale-[0.99] transition",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "aspect-video flex items-center justify-center relative", children: [
                    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.25),transparent_60%)]" }),
                    /* @__PURE__ */ jsx("div", { className: "h-14 w-14 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] group-active:scale-95 transition", children: /* @__PURE__ */ jsx(Youtube, { className: "h-6 w-6 text-white fill-white" }) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 flex items-center justify-between border-t border-white/5", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold text-white", children: "Watch Tutorial" }),
                      /* @__PURE__ */ jsx("div", { className: "text-[10px] text-zinc-400 truncate max-w-[220px]", children: recipe.youtube_query })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-red-400 uppercase tracking-wider", children: "Open" })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: [
              { icon: Clock, label: "Prep", val: `${recipe.prep_min ?? 0}m` },
              { icon: Flame, label: "Cook", val: `${recipe.cook_min ?? 0}m` },
              { icon: UtensilsCrossed, label: "Serves", val: recipe.servings ?? 1 },
              { icon: Sparkles, label: "kcal", val: recipe.calories ?? meal.calories ?? 0 }
            ].map((s, i) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/5 border border-white/5 p-2.5 text-center", children: [
              /* @__PURE__ */ jsx(s.icon, { className: "h-3.5 w-3.5 text-emerald-400 mx-auto mb-1" }),
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: s.label }),
              /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold tabular-nums", children: s.val })
            ] }, i)) }),
            recipe.macros && /* @__PURE__ */ jsx("div", { className: "rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-700/5 border border-emerald-500/15 p-3 flex justify-around text-center", children: [
              { l: "Protein", v: recipe.macros.protein_g, c: "text-emerald-400" },
              { l: "Carbs", v: recipe.macros.carbs_g, c: "text-amber-400" },
              { l: "Fat", v: recipe.macros.fat_g, c: "text-rose-400" }
            ].map((m, i) => /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: `text-base font-bold tabular-nums ${m.c}`, children: [
                Math.round(Number(m.v ?? 0)),
                "g"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: m.l })
            ] }, i)) }),
            Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "h-1 w-4 rounded-full bg-emerald-400" }),
                " Ingredients"
              ] }),
              /* @__PURE__ */ jsx("ul", { className: "rounded-2xl bg-white/[0.03] border border-white/5 divide-y divide-white/5", children: recipe.ingredients.map((ing, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3 px-3 py-2.5", children: [
                /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-sm text-white leading-tight", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-medium", children: ing.item }),
                    ing.qty && /* @__PURE__ */ jsxs("span", { className: "text-zinc-400", children: [
                      " — ",
                      ing.qty
                    ] })
                  ] }),
                  ing.note && /* @__PURE__ */ jsx("div", { className: "text-[11px] text-zinc-500 mt-0.5", children: ing.note })
                ] })
              ] }, i)) })
            ] }),
            Array.isArray(recipe.steps) && recipe.steps.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "h-1 w-4 rounded-full bg-emerald-400" }),
                " Method"
              ] }),
              /* @__PURE__ */ jsx("ol", { className: "space-y-2", children: recipe.steps.map((s, i) => /* @__PURE__ */ jsxs(
                "li",
                {
                  className: "flex gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-3 animate-slide-up",
                  style: { animationDelay: `${i * 0.03}s` },
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "h-6 w-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center justify-center shrink-0", children: i + 1 }),
                    /* @__PURE__ */ jsx("p", { className: "text-[13px] text-zinc-200 leading-relaxed flex-1", children: s })
                  ]
                },
                i
              )) })
            ] }),
            Array.isArray(recipe.alternatives) && recipe.alternatives.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(ArrowRightLeft, { className: "h-3.5 w-3.5 text-emerald-400" }),
                " Healthy swaps"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-2", children: recipe.alternatives.map((a, i) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/15 p-3", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold text-emerald-300", children: a.swap }),
                a.why && /* @__PURE__ */ jsx("div", { className: "text-[11px] text-zinc-400 mt-0.5 leading-relaxed", children: a.why })
              ] }, i)) })
            ] }),
            Array.isArray(recipe.tips) && recipe.tips.length > 0 && /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Lightbulb, { className: "h-3.5 w-3.5 text-amber-400" }),
                " Chef tips"
              ] }),
              /* @__PURE__ */ jsx("ul", { className: "space-y-1.5", children: recipe.tips.map((t, i) => /* @__PURE__ */ jsxs("li", { className: "text-[12px] text-zinc-300 leading-relaxed pl-3 relative", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute left-0 top-1.5 h-1 w-1 rounded-full bg-amber-400" }),
                t
              ] }, i)) })
            ] }),
            recipe.nutrition_notes && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/15 p-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1", children: "Why this fits your plan" }),
              /* @__PURE__ */ jsx("p", { className: "text-[12px] text-zinc-200 leading-relaxed", children: recipe.nutrition_notes })
            ] })
          ] })
        ] })
      ]
    }
  ) });
}
function cleanQuery(name, items) {
  const base = (name || items || "healthy meal").toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9\s&+-]/g, " ").replace(/\s+/g, " ").trim().split(/[,.•·]/)[0]?.trim().split(" ").slice(0, 6).join(" ");
  return base || "healthy meal";
}
const LS_PREFIX = "mealthumb:v1:";
const LS_INDEX_KEY = "mealthumb:v1:index";
const MAX_ENTRIES = 60;
const memCache = /* @__PURE__ */ new Map();
function lsGet(key) {
  try {
    return localStorage.getItem(LS_PREFIX + key);
  } catch {
    return null;
  }
}
function lsSet(key, value) {
  try {
    localStorage.setItem(LS_PREFIX + key, value);
    const idxRaw = localStorage.getItem(LS_INDEX_KEY);
    const idx = idxRaw ? JSON.parse(idxRaw) : [];
    const filtered = idx.filter((k) => k !== key);
    filtered.push(key);
    while (filtered.length > MAX_ENTRIES) {
      const evict = filtered.shift();
      if (evict) localStorage.removeItem(LS_PREFIX + evict);
    }
    localStorage.setItem(LS_INDEX_KEY, JSON.stringify(filtered));
  } catch {
    try {
      localStorage.removeItem(LS_INDEX_KEY);
    } catch {
    }
  }
}
async function urlToDataUrl(url) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size > 25e4) return null;
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
function MealThumb({
  name,
  items,
  fallbackColor,
  FallbackIcon,
  size = 64
}) {
  const query = useMemo(() => cleanQuery(name, items), [name, items]);
  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < query.length; i++) h = h * 31 + query.charCodeAt(i) | 0;
    return Math.abs(h);
  }, [query]);
  const remoteUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `professional food photography of ${query}, top-down, on dark plate, moody lighting, appetizing, high detail, 4k`
  )}?width=256&height=256&nologo=true&seed=${seed}`;
  const initial = memCache.get(query) ?? lsGet(query) ?? remoteUrl;
  const [src, setSrc] = useState(initial);
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    const cached = memCache.get(query) ?? lsGet(query);
    if (cached) {
      memCache.set(query, cached);
      setSrc(cached);
      setErrored(false);
      return;
    }
    setSrc(remoteUrl);
    setErrored(false);
    let cancelled = false;
    (async () => {
      const dataUrl = await urlToDataUrl(remoteUrl);
      if (cancelled || !dataUrl) return;
      memCache.set(query, dataUrl);
      lsSet(query, dataUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [query, remoteUrl]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "rounded-full overflow-hidden shrink-0 relative border border-white/10 shadow-[0_6px_16px_rgba(0,0,0,0.45)]",
      style: {
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${fallbackColor}25, ${fallbackColor}08)`
      },
      children: !errored ? /* @__PURE__ */ jsx(
        "img",
        {
          src,
          alt: name,
          loading: "lazy",
          decoding: "async",
          onError: () => setErrored(true),
          className: "w-full h-full object-cover"
        }
      ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsx(FallbackIcon, { className: "h-6 w-6", style: { color: fallbackColor } }) })
    }
  );
}
const mealMeta = {
  breakfast: {
    label: "Breakfast",
    icon: Sunrise,
    color: "oklch(0.82 0.16 80)"
  },
  lunch: {
    label: "Lunch",
    icon: Sun,
    color: "oklch(0.84 0.18 145)"
  },
  dinner: {
    label: "Dinner",
    icon: Moon,
    color: "oklch(0.74 0.22 295)"
  },
  snack: {
    label: "Snacks",
    icon: Cookie,
    color: "oklch(0.7 0.18 25)"
  }
};
function meal_name(key, meal) {
  if (meal?.name) return String(meal.name).slice(0, 200);
  const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const first = String(meal?.items ?? "").split(/[,.•·]/)[0]?.trim();
  return first ? `${label}: ${first.slice(0, 160)}` : label;
}
const MACROS = [{
  key: "calories",
  label: "Calories",
  unit: "kcal",
  color: "#4ADE80"
}, {
  key: "protein",
  label: "Protein",
  unit: "g",
  color: "#22D3EE"
}, {
  key: "carbs",
  label: "Carbs",
  unit: "g",
  color: "#A78BFA"
}, {
  key: "fat",
  label: "Fat",
  unit: "g",
  color: "#F59E0B"
}];
function MacroBars({
  totals,
  goals
}) {
  return /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 animate-slide-up", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5 text-emerald-400" }),
        /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold", children: "Today's macros" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: "Live" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: MACROS.map((m) => {
      const consumed = Math.round(Number(totals[m.key] ?? 0));
      const goal = Math.max(1, Math.round(Number(goals[m.key] ?? 1)));
      const pct = Math.min(100, consumed / goal * 100);
      const remaining = Math.max(0, goal - consumed);
      return /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full", style: {
              background: m.color,
              boxShadow: `0 0 8px ${m.color}`
            } }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] font-medium", children: m.label })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-[11px] tabular-nums text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { className: "text-foreground font-semibold", children: consumed }),
            " / ",
            goal,
            " ",
            m.unit,
            /* @__PURE__ */ jsx("span", { className: "ml-1.5 text-[10px]", style: {
              color: remaining > 0 ? m.color : "#4ADE80"
            }, children: remaining > 0 ? `· ${remaining} left` : "· ✓" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-white/[0.04] overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full transition-all duration-700 ease-out", style: {
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${m.color}, ${m.color}dd)`,
          boxShadow: `0 0 10px ${m.color}80`
        } }) })
      ] }, m.key);
    }) })
  ] });
}
function Diet() {
  const {
    data
  } = useSuspenseQuery(foodsQuery);
  const {
    data: dash
  } = useQuery(dashboardQuery);
  const qc = useQueryClient();
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const todays = data.filter((f) => new Date(f.logged_at) >= today);
  const totals = todays.reduce((a, f) => ({
    calories: a.calories + f.calories,
    protein: a.protein + Number(f.protein_g),
    carbs: a.carbs + Number(f.carbs_g),
    fat: a.fat + Number(f.fat_g)
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [recipeFor, setRecipeFor] = useState(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const del = useMutation({
    mutationFn: (id) => deleteFood({
      data: {
        id
      }
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["foods"]
      });
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
      toast.success("Removed");
    }
  });
  const genPlan = useMutation({
    mutationFn: () => generateAiPlan(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
      toast.success("Personalized plan ready");
    },
    onError: (e) => toast.error(e.message ?? "Could not generate plan")
  });
  const logMeal = useMutation({
    mutationFn: (input) => {
      const map = {
        breakfast: "breakfast",
        lunch: "lunch",
        dinner: "dinner",
        snack: "snack",
        pre_workout: "snack",
        post_workout: "snack"
      };
      const name = meal_name(input.mealKey, input.meal);
      return logFood({
        data: {
          name,
          meal_type: map[input.mealKey] ?? "snack",
          calories: Math.round(Number(input.meal.calories ?? 0)),
          protein_g: Math.round(Number(input.meal.protein_g ?? 0)),
          carbs_g: Math.round(Number(input.meal.carbs_g ?? 0)),
          fat_g: Math.round(Number(input.meal.fat_g ?? 0)),
          notes: (input.meal.items ?? "").toString().slice(0, 500)
        }
      });
    },
    // Optimistic update so progress bars & logged badge update instantly
    onMutate: async (input) => {
      await qc.cancelQueries({
        queryKey: ["foods"]
      });
      const prev = qc.getQueryData(["foods"]) ?? [];
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        name: meal_name(input.mealKey, input.meal),
        meal_type: ["breakfast", "lunch", "dinner"].includes(input.mealKey) ? input.mealKey : "snack",
        calories: Math.round(Number(input.meal.calories ?? 0)),
        protein_g: Math.round(Number(input.meal.protein_g ?? 0)),
        carbs_g: Math.round(Number(input.meal.carbs_g ?? 0)),
        fat_g: Math.round(Number(input.meal.fat_g ?? 0)),
        logged_at: (/* @__PURE__ */ new Date()).toISOString(),
        image_url: null
      };
      qc.setQueryData(["foods"], [optimistic, ...prev]);
      return {
        prev
      };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["foods"], ctx.prev);
      toast.error(e.message ?? "Could not log");
    },
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: ["foods"]
      });
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
    },
    onSuccess: () => toast.success("Logged")
  });
  const plan = dash?.profile?.ai_plan;
  const meals = plan?.meals ?? null;
  const mealOrder = [{
    k: "breakfast",
    label: "Breakfast",
    icon: Sunrise,
    color: "#F59E0B"
  }, {
    k: "pre_workout",
    label: "Pre-workout",
    icon: Zap,
    color: "#FBBF24"
  }, {
    k: "post_workout",
    label: "Post-workout",
    icon: Dumbbell,
    color: "#4ADE80"
  }, {
    k: "lunch",
    label: "Lunch",
    icon: Sun,
    color: "#84CC16"
  }, {
    k: "snack",
    label: "Snack",
    icon: Cookie,
    color: "#F97316"
  }, {
    k: "dinner",
    label: "Dinner",
    icon: Moon,
    color: "#A78BFA"
  }];
  const loggedNames = new Set(todays.map((f) => f.name?.toLowerCase().trim()).filter(Boolean));
  const isMealLogged = (key, meal) => loggedNames.has(meal_name(key, meal).toLowerCase().trim());
  const planGeneratedToday = (() => {
    const d = dash?.profile?.ai_plan_generated_at;
    if (!d) return false;
    const last = new Date(d);
    const n = /* @__PURE__ */ new Date();
    return last.getUTCFullYear() === n.getUTCFullYear() && last.getUTCMonth() === n.getUTCMonth() && last.getUTCDate() === n.getUTCDate();
  })();
  const grouped = ["breakfast", "lunch", "dinner", "snack"].map((t) => ({
    type: t,
    items: todays.filter((f) => f.meal_type === t)
  }));
  return /* @__PURE__ */ jsxs("div", { className: "px-5 pt-12 pb-8 space-y-4", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between animate-slide-up", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground", children: "Today" }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Nutrition" })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/scan", className: "h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.4)] active:scale-95", children: /* @__PURE__ */ jsx(Camera, { className: "h-5 w-5 text-black" }) })
    ] }),
    /* @__PURE__ */ jsx(MacroBars, { totals, goals: {
      calories: dash?.profile?.daily_calorie_goal ?? 2200,
      protein: dash?.profile?.protein_goal_g ?? 140,
      carbs: dash?.profile?.carbs_goal_g ?? 250,
      fat: dash?.profile?.fat_goal_g ?? 70
    } }),
    /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 animate-slide-up", style: {
      animationDelay: ".05s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-sm font-semibold", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5 text-emerald-400" }),
            " AI Plan",
            plan?.bmi && /* @__PURE__ */ jsxs("span", { className: "ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-semibold tabular-nums", children: [
              "BMI ",
              plan.bmi
            ] })
          ] }),
          plan?.summary && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2", children: plan.summary })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => {
          if (planGeneratedToday) {
            toast.info("Today's plan is already set.");
            return;
          }
          genPlan.mutate();
        }, disabled: genPlan.isPending || planGeneratedToday, className: "shrink-0 h-9 px-3 rounded-xl bg-emerald-500 text-black text-[11px] font-bold shadow-[0_0_16px_rgba(74,222,128,0.4)] flex items-center gap-1 active:scale-95 disabled:opacity-40", children: [
          genPlan.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
          planGeneratedToday ? "Today" : "Generate"
        ] })
      ] }),
      plan && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => setWhyOpen((v) => !v), className: "w-full flex items-center justify-between text-[11px] font-semibold text-emerald-400/90 hover:text-emerald-400 py-1.5 border-t border-white/[0.04]", children: [
          /* @__PURE__ */ jsx("span", { children: "Why this plan?" }),
          /* @__PURE__ */ jsx(ChevronDown, { className: `h-3.5 w-3.5 transition-transform ${whyOpen ? "rotate-180" : ""}` })
        ] }),
        whyOpen && /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-1 animate-fade-in", children: [
          plan.bmi_category && /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-foreground/80", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Category: " }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold uppercase tracking-wider text-[10px]", children: plan.bmi_category })
          ] }),
          Array.isArray(plan.tips) && plan.tips.length > 0 && /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: plan.tips.map((t, i) => /* @__PURE__ */ jsxs("li", { className: "text-[11px] text-muted-foreground leading-relaxed pl-3 relative", children: [
            /* @__PURE__ */ jsx("span", { className: "absolute left-0 top-1.5 h-1 w-1 rounded-full bg-emerald-400" }),
            t
          ] }, i)) }),
          Array.isArray(plan?.shakes) && plan.shakes.length > 0 && /* @__PURE__ */ jsxs("div", { className: "pt-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5", children: [
              /* @__PURE__ */ jsx(GlassWater, { className: "h-3 w-3 text-emerald-400" }),
              " Recommended shakes"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: plan.shakes.map((s, i) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white/[0.03] border border-white/5 p-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold", children: s.name }),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: s.when })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground mt-0.5 leading-relaxed", children: s.ingredients })
            ] }, i)) })
          ] })
        ] })
      ] }),
      !plan && !genPlan.isPending && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-muted-foreground text-center py-1", children: "Tap Generate for a personalized plan." })
    ] }),
    meals && /* @__PURE__ */ jsxs("section", { className: "space-y-2 animate-slide-up", style: {
      animationDelay: ".08s"
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-1", children: [
        /* @__PURE__ */ jsx(Lightbulb, { className: "h-3 w-3 text-emerald-400" }),
        /* @__PURE__ */ jsx("h3", { className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground", children: "Suggested meals" })
      ] }),
      mealOrder.map((m) => {
        const meal = meals[m.k];
        if (!meal) return null;
        const Icon = m.icon;
        const logged = isMealLogged(m.k, meal);
        const isExpanded = expandedMeal === m.k;
        return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden transition-all duration-200 hover:border-emerald-400/20", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setExpandedMeal(isExpanded ? null : m.k), className: "w-full p-3 text-left", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: m.label }),
                meal.timing && /* @__PURE__ */ jsxs("span", { className: "text-[9px] text-muted-foreground/60", children: [
                  "· ",
                  meal.timing
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-[13px] font-semibold text-foreground truncate mt-0.5", children: meal.name || meal_name(m.k, meal) }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1 text-[10px] tabular-nums text-muted-foreground", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-emerald-400 font-semibold", children: [
                  meal.calories,
                  " kcal"
                ] }),
                /* @__PURE__ */ jsx("span", { children: "·" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  Math.round(Number(meal.protein_g ?? 0)),
                  "P"
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  Math.round(Number(meal.carbs_g ?? 0)),
                  "C"
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  Math.round(Number(meal.fat_g ?? 0)),
                  "F"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(MealThumb, { name: meal.name || meal_name(m.k, meal), items: meal.items, fallbackColor: m.color, FallbackIcon: Icon, size: 64 }),
            /* @__PURE__ */ jsx(ChevronDown, { className: `h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}` })
          ] }) }),
          isExpanded && /* @__PURE__ */ jsx("div", { className: "px-3 pb-3 animate-fade-in", children: /* @__PURE__ */ jsx("p", { className: "text-[11px] text-foreground/80 leading-relaxed pl-[42px]", children: meal.items }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-3 pb-3 pl-[54px]", children: [
            /* @__PURE__ */ jsxs("button", { onClick: (e) => {
              e.stopPropagation();
              setRecipeFor({
                key: m.k,
                name: meal_name(m.k, meal),
                meal
              });
            }, className: "h-7 px-2.5 rounded-full bg-white/5 border border-white/10 text-foreground/90 text-[10px] font-semibold flex items-center gap-1 active:scale-95 hover:bg-white/10 transition", children: [
              /* @__PURE__ */ jsx(ChefHat, { className: "h-3 w-3 text-emerald-400" }),
              " Recipe"
            ] }),
            logged ? /* @__PURE__ */ jsxs("span", { className: "h-7 px-2.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 border border-emerald-500/30", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-3 w-3" }),
              " Logged"
            ] }) : /* @__PURE__ */ jsxs("button", { onClick: (e) => {
              e.stopPropagation();
              logMeal.mutate({
                mealKey: m.k,
                meal
              });
            }, disabled: logMeal.isPending, className: "h-7 px-2.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center gap-1 active:scale-95 disabled:opacity-60 shadow-[0_0_12px_rgba(74,222,128,0.3)]", children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" }),
              " Log"
            ] })
          ] })
        ] }, m.k);
      })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: grouped.map((g, gi) => {
      const meta = mealMeta[g.type];
      const Icon = meta.icon;
      const cals = g.items.reduce((a, i) => a + i.calories, 0);
      return /* @__PURE__ */ jsxs("section", { className: "animate-slide-up", style: {
        animationDelay: `${0.1 + gi * 0.04}s`
      }, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-1 mb-2", children: [
          /* @__PURE__ */ jsx("div", { className: "h-6 w-6 rounded-lg flex items-center justify-center", style: {
            background: `${meta.color}20`
          }, children: /* @__PURE__ */ jsx(Icon, { className: "h-3 w-3", style: {
            color: meta.color
          } }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-[11px] font-semibold uppercase tracking-wider", children: meta.label }),
          /* @__PURE__ */ jsxs("span", { className: "ml-auto text-[11px] text-muted-foreground tabular-nums", children: [
            cals,
            " kcal"
          ] })
        ] }),
        g.items.length === 0 ? /* @__PURE__ */ jsxs(Link, { to: "/scan", className: "block rounded-xl p-3 text-center text-[11px] text-muted-foreground border border-dashed border-white/10 hover:border-emerald-400/40 transition", children: [
          "+ Add ",
          meta.label.toLowerCase()
        ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: g.items.map((f) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-white/[0.03] border border-white/[0.05] p-2.5 flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 flex items-center justify-center text-lg overflow-hidden shrink-0", children: f.image_url ? /* @__PURE__ */ jsx("img", { src: f.image_url, className: "h-full w-full object-cover", alt: "" }) : "🍽️" }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[13px] font-medium truncate", children: f.name }),
            /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground tabular-nums", children: [
              Math.round(Number(f.protein_g)),
              "P · ",
              Math.round(Number(f.carbs_g)),
              "C · ",
              Math.round(Number(f.fat_g)),
              "F"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[13px] font-semibold tabular-nums text-emerald-400", children: f.calories }),
            /* @__PURE__ */ jsx("div", { className: "text-[9px] text-muted-foreground", children: "kcal" })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => del.mutate(f.id), className: "text-muted-foreground/60 hover:text-destructive p-1", children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }) })
        ] }, f.id)) })
      ] }, g.type);
    }) }),
    recipeFor && /* @__PURE__ */ jsx(RecipeSheet, { open: !!recipeFor, onOpenChange: (v) => {
      if (!v) setRecipeFor(null);
    }, mealKey: recipeFor.key, mealName: recipeFor.name, meal: recipeFor.meal })
  ] });
}
export {
  Diet as component
};
