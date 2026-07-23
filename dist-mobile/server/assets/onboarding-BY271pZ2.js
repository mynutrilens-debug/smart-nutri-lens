import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { d as dashboardQuery } from "./queries-DQC1c2F_.js";
import { s as saveOnboarding, g as generateAiPlan } from "./onboarding.functions-BQXgSjBg.js";
import { Sparkles, User, Activity, Flame, Check, Target, Apple, Heart, ShieldAlert, ArrowLeft, ArrowRight, Loader2, Zap, TrendingUp, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { R as Route } from "./router-D-2d6VGp.js";
import "./auth-middleware-B4NMxYBh.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "./server-BadC42R4.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "./food.functions-C13l6RKQ.js";
import "zod";
import "./client-BMbiJotd.js";
import "@capacitor/core";
const bodyMale = "/assets/body-male-BDJFjmaI.jpg";
const bodyFemale = "/assets/body-female-Xz_egDQn.jpg";
function WheelPicker({
  min,
  max,
  step = 1,
  value,
  onChange,
  unit,
  visible = 1,
  itemHeight = 40,
  formatter
}) {
  const ref = useRef(null);
  const settleTimer = useRef(null);
  const lastEmitted = useRef(value);
  const items = [];
  for (let v = min; v <= max + 1e-9; v += step) {
    items.push(Math.round(v * 1e3) / 1e3);
  }
  const indexOf = (v) => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < items.length; i++) {
      const d = Math.abs(items[i] - v);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (Math.abs(lastEmitted.current - value) < step / 2) return;
    const idx = indexOf(value);
    el.scrollTo({ top: idx * itemHeight, behavior: "smooth" });
    lastEmitted.current = value;
  }, [value]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = indexOf(value) * itemHeight;
  }, []);
  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const idx = Math.round(el.scrollTop / itemHeight);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      const v = items[clamped];
      if (v !== lastEmitted.current) {
        lastEmitted.current = v;
        onChange(v);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(8);
        }
      }
      const target = clamped * itemHeight;
      if (Math.abs(el.scrollTop - target) > 0.5) {
        el.scrollTo({ top: target, behavior: "smooth" });
      }
    }, 90);
  }, [items, itemHeight, onChange]);
  const padding = visible * itemHeight;
  const totalHeight = (visible * 2 + 1) * itemHeight;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "relative w-full select-none overflow-hidden",
      style: { height: totalHeight },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "pointer-events-none absolute left-2 right-2 rounded-xl border border-[var(--primary)]/55 bg-[var(--primary)]/10 shadow-[0_0_24px_-6px_var(--primary)]",
            style: { top: visible * itemHeight, height: itemHeight }
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "pointer-events-none absolute inset-x-0 top-0 z-10",
            style: {
              height: padding,
              background: "linear-gradient(to bottom, var(--background) 0%, transparent 100%)"
            }
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "pointer-events-none absolute inset-x-0 bottom-0 z-10",
            style: {
              height: padding,
              background: "linear-gradient(to top, var(--background) 0%, transparent 100%)"
            }
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref,
            onScroll: handleScroll,
            className: "h-full overflow-y-scroll scrollbar-hide",
            style: {
              scrollSnapType: "y mandatory",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch"
            },
            children: [
              /* @__PURE__ */ jsx("div", { style: { height: padding } }),
              items.map((v, i) => {
                const isActive = Math.abs(v - value) < step / 2;
                return /* @__PURE__ */ jsxs(
                  "div",
                  {
                    style: { height: itemHeight, scrollSnapAlign: "center" },
                    className: `flex items-center justify-center tabular-nums transition-all duration-150 ${isActive ? "text-xl font-bold text-[var(--primary)] scale-110" : "text-sm text-muted-foreground/60"}`,
                    children: [
                      formatter ? formatter(v) : v,
                      isActive && unit && /* @__PURE__ */ jsx("span", { className: "ml-1.5 text-xs font-medium text-muted-foreground", children: unit })
                    ]
                  },
                  i
                );
              }),
              /* @__PURE__ */ jsx("div", { style: { height: padding } })
            ]
          }
        )
      ]
    }
  );
}
const ACTIVITY = [{
  v: "sedentary",
  l: "Sedentary",
  d: "Little to no exercise"
}, {
  v: "light",
  l: "Light",
  d: "1–2 days/week"
}, {
  v: "moderate",
  l: "Moderate",
  d: "3–5 days/week"
}, {
  v: "active",
  l: "Active",
  d: "6–7 days/week"
}, {
  v: "athlete",
  l: "Athlete",
  d: "Twice daily"
}];
const GOALS = [{
  v: "weight_loss",
  l: "Weight Loss",
  emoji: "🔥"
}, {
  v: "fat_loss",
  l: "Fat Loss",
  emoji: "💧"
}, {
  v: "muscle_gain",
  l: "Muscle Gain",
  emoji: "💪"
}, {
  v: "recomp",
  l: "Recomposition",
  emoji: "⚡"
}, {
  v: "maintenance",
  l: "Maintenance",
  emoji: "🌿"
}];
const DIETS = ["Non-Veg (No Beef)", "Non-Veg", "Vegetarian", "Eggetarian", "Vegan", "Keto", "Diabetic-Friendly", "High-Protein", "Low-Carb", "Mediterranean", "Jain", "Pescatarian"];
const REGIONS = ["India", "Global", "Middle East", "East Asia", "Europe", "Americas"];
const INDIAN_CUISINES = ["Maharashtrian", "Kerala", "Tamil", "Rajasthani", "Punjabi", "Bengali", "Gujarati", "South Indian", "North Indian", "Hyderabadi", "Goan"];
const COMMON_ALLERGIES = ["Peanuts", "Tree nuts", "Dairy", "Eggs", "Gluten", "Soy", "Shellfish", "Fish"];
const COMMON_MEDICAL = ["Diabetes", "Hypertension", "PCOS", "Thyroid", "Cholesterol", "Asthma", "None"];
function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const {
    data: dash
  } = useQuery(dashboardQuery);
  const profile = dash?.profile;
  const {
    edit
  } = Route.useSearch();
  useEffect(() => {
    if (profile?.onboarded_at && !edit) navigate({
      to: "/home",
      replace: true
    });
  }, [profile?.onboarded_at, edit, navigate]);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(26);
  const [unitH, setUnitH] = useState("cm");
  const [height, setHeight] = useState(175);
  const [unitW, setUnitW] = useState("kg");
  const [weight, setWeight] = useState(72);
  const [activity, setActivity] = useState("moderate");
  const [goal, setGoal] = useState("muscle_gain");
  const [diet, setDiet] = useState("Non-Veg (No Beef)");
  const [region, setRegion] = useState("India");
  const [cuisine, setCuisine] = useState("Maharashtrian");
  const [allergies, setAllergies] = useState([]);
  const [medical, setMedical] = useState([]);
  const heightCm = unitH === "cm" ? height : Math.round(height * 30.48);
  const weightKg = unitW === "kg" ? weight : Math.round(weight * 0.4536);
  const computed = useMemo(() => {
    const bmr = gender === "male" ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5 : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    const mult = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      athlete: 1.9
    }[activity];
    const tdee = bmr * mult;
    let cal = tdee;
    if (goal === "weight_loss" || goal === "fat_loss") cal -= 500;
    if (goal === "muscle_gain") cal += 300;
    const protein = Math.round(weightKg * (goal === "muscle_gain" ? 2 : 1.8));
    const fat = Math.round(cal * 0.25 / 9);
    const carbs = Math.max(50, Math.round((cal - protein * 4 - fat * 9) / 4));
    const bmi = weightKg / Math.pow(heightCm / 100, 2);
    const bf = gender === "male" ? 1.2 * bmi + 0.23 * age - 16.2 : 1.2 * bmi + 0.23 * age - 5.4;
    const after_bf = Math.max(8, bf - (goal === "weight_loss" || goal === "fat_loss" ? 4 : 2));
    const after_w = goal === "weight_loss" || goal === "fat_loss" ? weightKg - 4 : goal === "muscle_gain" ? weightKg + 3 : weightKg - 1;
    return {
      calories: Math.round(cal),
      protein,
      fat,
      carbs,
      bmi: Number(bmi.toFixed(1)),
      body_fat: Number(Math.max(8, Math.min(40, bf)).toFixed(1)),
      after_bf: Number(after_bf.toFixed(1)),
      after_weight: Number(after_w.toFixed(1)),
      muscle: Number((gender === "male" ? 45 - bf * 0.3 : 38 - bf * 0.3).toFixed(0)),
      water: 55
    };
  }, [gender, age, heightCm, weightKg, activity, goal]);
  const bmiState = computed.bmi < 18.5 ? "Underweight" : computed.bmi < 25 ? "Healthy" : computed.bmi < 30 ? "Overweight" : "Obese";
  const save = useMutation({
    mutationFn: async () => {
      await saveOnboarding({
        data: {
          display_name: name || void 0,
          gender,
          age,
          height_cm: heightCm,
          weight_kg: weightKg,
          activity_level: activity,
          physique_goal: goal,
          diet_preference: diet,
          region,
          cuisine: region === "India" ? cuisine : "",
          allergies,
          medical_conditions: medical
        }
      });
      generateAiPlan().catch(() => {
      });
      await qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
    },
    onSuccess: () => {
      toast.success("Your journey starts now");
      navigate({
        to: "/home",
        replace: true
      });
    },
    onError: (e) => toast.error(e.message ?? "Failed to save")
  });
  const TOTAL = 6;
  const next = () => setStep((s) => Math.min(TOTAL, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen pb-32 px-5 pt-10 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full blur-3xl opacity-30", style: {
      background: "oklch(0.72 0.22 240)"
    } }),
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full blur-3xl opacity-25", style: {
      background: "oklch(0.78 0.18 210)"
    } }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 mb-6", children: Array.from({
      length: TOTAL + 1
    }).map((_, i) => /* @__PURE__ */ jsx("div", { className: `h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-gradient-to-r from-[oklch(0.82_0.16_215)] to-[oklch(0.62_0.26_260)]" : "bg-white/10"}` }, i)) }),
    step === 0 && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { icon: Sparkles, children: "Welcome" }),
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold leading-tight", children: [
        "Let's Start Your ",
        /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-[oklch(0.82_0.16_215)] to-[oklch(0.62_0.26_260)] bg-clip-text text-transparent", children: "Transformation" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "A few quick questions and your AI coach will craft a plan only for you." }),
      /* @__PURE__ */ jsx("label", { className: "block mt-6 text-xs text-muted-foreground", children: "Your name" }),
      /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "What should we call you?", className: "mt-1 w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-[oklch(0.72_0.22_240)]/60" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsx(Choice, { active: gender === "male", onClick: () => setGender("male"), icon: User, label: "Male", ariaLabel: "Select male" }),
        /* @__PURE__ */ jsx(Choice, { active: gender === "female", onClick: () => setGender("female"), icon: User, label: "Female", ariaLabel: "Select female" })
      ] }),
      /* @__PURE__ */ jsx("label", { className: "block mt-6 text-xs text-muted-foreground", children: "Age" }),
      /* @__PURE__ */ jsx("div", { className: "mt-1 glass rounded-2xl p-2", children: /* @__PURE__ */ jsx(WheelPicker, { min: 13, max: 90, value: age, onChange: setAge, unit: "yrs" }) })
    ] }),
    step === 1 && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { icon: Activity, children: "Body metrics" }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Your body" }),
      /* @__PURE__ */ jsx(UnitField, { label: "Height", unit: unitH, setUnit: (u) => setUnitH(u), units: ["cm", "ft"], value: height, onChange: setHeight, min: unitH === "cm" ? 120 : 4, max: unitH === "cm" ? 220 : 7, step: unitH === "cm" ? 1 : 0.1 }),
      /* @__PURE__ */ jsx(UnitField, { label: "Weight", unit: unitW, setUnit: (u) => setUnitW(u), units: ["kg", "lbs"], value: weight, onChange: setWeight, min: unitW === "kg" ? 35 : 80, max: unitW === "kg" ? 200 : 440, step: 1 }),
      /* @__PURE__ */ jsxs("p", { className: "mt-4 text-xs text-muted-foreground", children: [
        "BMI ",
        /* @__PURE__ */ jsx("span", { className: "text-foreground font-semibold", children: computed.bmi }),
        " • ",
        /* @__PURE__ */ jsx("span", { className: "text-[oklch(0.78_0.18_210)]", children: bmiState })
      ] })
    ] }),
    step === 2 && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { icon: Flame, children: "Activity level" }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "How active are you?" }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-2", children: ACTIVITY.map((a) => /* @__PURE__ */ jsx("button", { onClick: () => setActivity(a.v), "aria-pressed": activity === a.v, className: `relative w-full text-left glass rounded-2xl p-4 border-2 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.72_0.22_240)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] ${activity === a.v ? "z-10 border-[oklch(0.72_0.22_240)] bg-[oklch(0.72_0.22_240/0.22)] shadow-[0_0_0_4px_oklch(0.72_0.22_240/0.18),0_12px_30px_-12px_oklch(0.72_0.22_240/0.8)]" : "border-white/10 hover:border-white/20"}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold", children: a.l }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: a.d })
        ] }),
        activity === a.v && /* @__PURE__ */ jsx("span", { className: "inline-flex h-6 w-6 items-center justify-center rounded-full bg-[oklch(0.72_0.22_240)] text-primary-foreground shadow-md animate-scale-in", children: /* @__PURE__ */ jsx(Check, { className: "h-3.5 w-3.5", strokeWidth: 3, "aria-hidden": "true" }) })
      ] }) }, a.v)) })
    ] }),
    step === 3 && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { icon: Target, children: "Your goal" }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "What's your physique goal?" }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-2 gap-3", children: GOALS.map((g) => /* @__PURE__ */ jsxs("button", { onClick: () => setGoal(g.v), "aria-pressed": goal === g.v, className: `relative glass rounded-2xl p-4 text-left border-2 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.72_0.22_240)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] ${goal === g.v ? "z-10 -translate-y-0.5 scale-[1.02] border-[oklch(0.72_0.22_240)] bg-[oklch(0.72_0.22_240/0.22)] shadow-[0_0_0_4px_oklch(0.72_0.22_240/0.18),0_12px_30px_-12px_oklch(0.72_0.22_240/0.8)]" : "border-white/10 hover:border-white/20"}`, children: [
        goal === g.v && /* @__PURE__ */ jsx("span", { className: "absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.72_0.22_240)] text-primary-foreground shadow-md animate-scale-in", children: /* @__PURE__ */ jsx(Check, { className: "h-3 w-3", strokeWidth: 3 }) }),
        /* @__PURE__ */ jsx("div", { className: `text-2xl transition-transform ${goal === g.v ? "scale-110" : ""}`, "aria-hidden": "true", children: g.emoji }),
        /* @__PURE__ */ jsx("div", { className: "mt-1.5 font-semibold text-sm", children: g.l })
      ] }, g.v)) })
    ] }),
    step === 4 && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { icon: Apple, children: "Diet & allergies" }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Your food world" }),
      /* @__PURE__ */ jsx("label", { className: "block mt-5 text-xs text-muted-foreground", children: "Region" }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: REGIONS.map((r) => /* @__PURE__ */ jsx(Chip, { active: region === r, onClick: () => setRegion(r), children: r }, r)) }),
      region === "India" && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("label", { className: "block mt-5 text-xs text-muted-foreground", children: "Regional cuisine" }),
        /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: INDIAN_CUISINES.map((c) => /* @__PURE__ */ jsx(Chip, { active: cuisine === c, onClick: () => setCuisine(c), children: c }, c)) })
      ] }),
      /* @__PURE__ */ jsx("label", { className: "block mt-5 text-xs text-muted-foreground", children: "Diet preference" }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: DIETS.map((d) => /* @__PURE__ */ jsx(Chip, { active: diet === d, onClick: () => setDiet(d), children: d }, d)) }),
      /* @__PURE__ */ jsx("label", { className: "block mt-5 text-xs text-muted-foreground", children: "Allergies (tap any)" }),
      /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: COMMON_ALLERGIES.map((a) => /* @__PURE__ */ jsx(Chip, { active: allergies.includes(a), onClick: () => toggle(allergies, a, setAllergies), children: a }, a)) })
    ] }),
    step === 5 && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { icon: Heart, children: "Medical" }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Any health conditions?" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "We'll adapt your plan accordingly." }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: COMMON_MEDICAL.map((m) => /* @__PURE__ */ jsx(Chip, { active: medical.includes(m), onClick: () => toggle(medical, m, setMedical), icon: ShieldAlert, children: m }, m)) })
    ] }),
    step === 6 && /* @__PURE__ */ jsx(TransformationPreview, { gender, weightKg, heightCm, computed, bmiState, goal }),
    /* @__PURE__ */ jsx("div", { className: "fixed bottom-0 left-0 right-0 z-50 px-5 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent", style: {
      paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)"
    }, children: /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto flex gap-3", children: [
      step > 0 && /* @__PURE__ */ jsxs("button", { onClick: back, className: "glass rounded-2xl px-5 py-3.5 flex items-center gap-1.5 text-sm", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back"
      ] }),
      step < TOTAL ? /* @__PURE__ */ jsxs("button", { onClick: next, style: {
        background: "var(--gradient-hero)"
      }, className: "flex-1 rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 text-primary-foreground glow-ring", children: [
        "Continue ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
      ] }) : /* @__PURE__ */ jsx("button", { disabled: save.isPending, onClick: () => save.mutate(), style: {
        background: "var(--gradient-hero)"
      }, className: "flex-1 rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 text-primary-foreground glow-ring disabled:opacity-70", children: save.isPending ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
        " Building your plan…"
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4" }),
        " Let's Start My Journey"
      ] }) })
    ] }) })
  ] });
}
function toggle(arr, v, set) {
  set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
}
function Card({
  children
}) {
  return /* @__PURE__ */ jsx("div", { className: "animate-slide-up relative z-10", children });
}
function Eyebrow({
  icon: Icon,
  children
}) {
  return /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[oklch(0.78_0.18_210)] mb-3", children: [
    /* @__PURE__ */ jsx(Icon, { className: "h-3 w-3" }),
    " ",
    children
  ] });
}
function Choice({
  active,
  onClick,
  icon: Icon,
  label,
  ariaLabel
}) {
  return /* @__PURE__ */ jsxs("button", { onClick, "aria-pressed": active, "aria-label": ariaLabel, className: `relative glass rounded-2xl p-4 flex flex-col items-center gap-2 border-2 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.72_0.22_240)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] ${active ? "z-10 -translate-y-0.5 scale-[1.02] border-[oklch(0.72_0.22_240)] bg-[oklch(0.72_0.22_240/0.22)] shadow-[0_0_0_4px_oklch(0.72_0.22_240/0.18),0_12px_30px_-12px_oklch(0.72_0.22_240/0.8)]" : "border-white/10 hover:border-white/20"}`, children: [
    active && /* @__PURE__ */ jsx("span", { className: "absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.72_0.22_240)] text-primary-foreground shadow-md animate-scale-in", children: /* @__PURE__ */ jsx(Check, { className: "h-3 w-3", strokeWidth: 3 }) }),
    /* @__PURE__ */ jsx(Icon, { className: `h-6 w-6 transition-transform ${active ? "text-[oklch(0.82_0.16_215)] scale-110" : ""}`, "aria-hidden": "true" }),
    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: label })
  ] });
}
function Chip({
  active,
  onClick,
  children,
  icon: Icon
}) {
  return /* @__PURE__ */ jsxs("button", { onClick, className: `px-4 py-2 rounded-full text-sm border transition-all inline-flex items-center gap-1.5 ${active ? "bg-gradient-to-r from-[oklch(0.82_0.16_215)] to-[oklch(0.62_0.26_260)] text-primary-foreground border-transparent" : "glass border-white/10"}`, children: [
    Icon && /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5" }),
    " ",
    children
  ] });
}
function UnitField({
  label,
  unit,
  setUnit,
  units,
  value,
  onChange,
  min,
  max,
  step
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mt-5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-1 bg-white/5 rounded-full p-1", children: units.map((u) => /* @__PURE__ */ jsx("button", { onClick: () => setUnit(u), className: `px-3 py-0.5 text-xs rounded-full transition-all ${unit === u ? "bg-white/15 text-foreground" : "text-muted-foreground"}`, children: u }, u)) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "glass rounded-2xl p-2", children: /* @__PURE__ */ jsx(WheelPicker, { min, max, step, value, onChange, unit, formatter: step < 1 ? (v) => v.toFixed(1) : void 0 }) })
  ] });
}
function TransformationPreview({
  gender,
  weightKg,
  heightCm,
  computed,
  bmiState,
  goal
}) {
  const img = gender === "male" ? bodyMale : bodyFemale;
  const goalLabel = GOALS.find((g) => g.v === goal)?.l ?? "Your goal";
  return /* @__PURE__ */ jsxs("div", { className: "animate-slide-up relative z-10 space-y-5", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Eyebrow, { icon: Sparkles, children: "AI Analysis" }),
      /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold leading-tight", children: [
        "Your Body ",
        /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-[oklch(0.82_0.16_215)] to-[oklch(0.62_0.26_260)] bg-clip-text text-transparent", children: "Transformation" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "4-week prediction based on your profile & science" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsx(BodyCard, { label: "NOW", img, weight: weightKg, bf: computed.body_fat, bmi: computed.bmi, state: bmiState }),
      /* @__PURE__ */ jsx(BodyCard, { label: "AFTER 4 WEEKS", img, weight: computed.after_weight, bf: computed.after_bf, bmi: Number((computed.after_weight / Math.pow(heightCm / 100, 2)).toFixed(1)), state: "On track", glow: true })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "glass rounded-2xl p-4 flex items-center gap-3 border border-[oklch(0.72_0.22_240)]/30", children: [
      /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.82_0.16_215)] to-[oklch(0.62_0.26_260)] flex items-center justify-center glow-ring", children: /* @__PURE__ */ jsx(Target, { className: "h-5 w-5 text-primary-foreground" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "Your goal" }),
        /* @__PURE__ */ jsx("div", { className: "font-semibold", children: goalLabel })
      ] }),
      /* @__PURE__ */ jsx(TrendingUp, { className: "ml-auto h-5 w-5 text-[oklch(0.78_0.18_210)]" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold mb-2 text-muted-foreground", children: "Daily targets" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsx(Stat, { icon: Flame, label: "Calories", value: computed.calories, unit: "kcal" }),
        /* @__PURE__ */ jsx(Stat, { icon: Dumbbell, label: "Protein", value: computed.protein, unit: "g" }),
        /* @__PURE__ */ jsx(Stat, { label: "Carbs", value: computed.carbs, unit: "g" }),
        /* @__PURE__ */ jsx(Stat, { label: "Fat", value: computed.fat, unit: "g" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "glass rounded-3xl p-5", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold mb-3", children: "Body Composition" }),
      /* @__PURE__ */ jsx(Meter, { label: "Muscle Mass", value: computed.muscle }),
      /* @__PURE__ */ jsx(Meter, { label: "Body Fat", value: Math.round(computed.body_fat), warn: true }),
      /* @__PURE__ */ jsx(Meter, { label: "Water", value: computed.water })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "glass rounded-3xl p-5 border border-[oklch(0.72_0.22_240)]/30", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-[oklch(0.78_0.18_210)] mb-1.5", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
        " AI Insight"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: "Consistency beats intensity. Hit your protein daily, train 4× this week, and you'll see real change by day 28. Your transformation starts the moment you tap below." })
    ] })
  ] });
}
function BodyCard({
  label,
  img,
  weight,
  bf,
  bmi,
  state,
  glow
}) {
  return /* @__PURE__ */ jsxs("div", { className: `glass rounded-3xl p-3 overflow-hidden relative ${glow ? "border border-[oklch(0.72_0.22_240)]/40 shadow-[0_0_30px_oklch(0.72_0.22_240/0.25)]" : ""}`, children: [
    /* @__PURE__ */ jsx("div", { className: `text-[10px] uppercase tracking-widest mb-1 ${glow ? "text-[oklch(0.78_0.18_210)]" : "text-muted-foreground"}`, children: label }),
    /* @__PURE__ */ jsxs("div", { className: "relative aspect-[3/4] rounded-2xl overflow-hidden bg-black/30", children: [
      /* @__PURE__ */ jsx("img", { src: img, alt: label, className: `w-full h-full object-cover ${glow ? "" : "grayscale-[40%] brightness-90"}` }),
      glow && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 ring-2 ring-[oklch(0.72_0.22_240)]/40 rounded-2xl shadow-[inset_0_0_40px_oklch(0.72_0.22_240/0.3)]" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-2 grid grid-cols-2 gap-1 text-[11px]", children: [
      /* @__PURE__ */ jsx(Mini, { label: "Weight", v: `${weight}kg` }),
      /* @__PURE__ */ jsx(Mini, { label: "BF", v: `${bf}%` }),
      /* @__PURE__ */ jsx(Mini, { label: "BMI", v: `${bmi}` }),
      /* @__PURE__ */ jsx(Mini, { label: "", v: state, accent: glow })
    ] })
  ] });
}
function Mini({
  label,
  v,
  accent
}) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white/5 rounded-lg px-2 py-1", children: [
    label && /* @__PURE__ */ jsx("div", { className: "text-[9px] text-muted-foreground uppercase", children: label }),
    /* @__PURE__ */ jsx("div", { className: `font-semibold ${accent ? "text-[oklch(0.78_0.18_210)]" : ""}`, children: v })
  ] });
}
function Stat({
  icon: Icon,
  label,
  value,
  unit
}) {
  return /* @__PURE__ */ jsxs("div", { className: "glass rounded-2xl p-3.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
      Icon && /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5" }),
      " ",
      label
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-baseline gap-1", children: [
      /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold tabular-nums", children: value }),
      /* @__PURE__ */ jsx("span", { className: "text-[11px] text-muted-foreground", children: unit })
    ] })
  ] });
}
function Meter({
  label,
  value,
  warn
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-3 last:mb-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs mb-1", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: label }),
      /* @__PURE__ */ jsxs("span", { className: "font-semibold tabular-nums", children: [
        value,
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "h-1.5 bg-white/5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full transition-all", style: {
      width: `${Math.min(100, value)}%`,
      background: warn ? "linear-gradient(90deg, oklch(0.78 0.16 60), oklch(0.7 0.2 30))" : "linear-gradient(90deg, oklch(0.82 0.16 215), oklch(0.62 0.26 260))"
    } }) })
  ] });
}
export {
  Onboarding as component
};
