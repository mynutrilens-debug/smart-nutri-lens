import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardQuery } from "@/lib/queries";
import { saveOnboarding, generateAiPlan } from "@/lib/onboarding.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, ArrowLeft, Loader2, Sparkles, Flame, Dumbbell, Heart,
  Activity, Target, Apple, ShieldAlert, User, Check, Zap, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import bodyMale from "@/assets/body-male.jpg";
import bodyFemale from "@/assets/body-female.jpg";
import { WheelPicker } from "@/components/mobile/WheelPicker";

export const Route = createFileRoute("/_app/onboarding")({
  component: Onboarding,
  validateSearch: (s: Record<string, unknown>) => ({ edit: s.edit ? 1 : undefined }),
});

type Gender = "male" | "female";
type Activity = "sedentary" | "light" | "moderate" | "active" | "athlete";
type Goal = "weight_loss" | "fat_loss" | "muscle_gain" | "maintenance" | "recomp";

const ACTIVITY: { v: Activity; l: string; d: string }[] = [
  { v: "sedentary", l: "Sedentary", d: "Little to no exercise" },
  { v: "light", l: "Light", d: "1–2 days/week" },
  { v: "moderate", l: "Moderate", d: "3–5 days/week" },
  { v: "active", l: "Active", d: "6–7 days/week" },
  { v: "athlete", l: "Athlete", d: "Twice daily" },
];

const GOALS: { v: Goal; l: string; emoji: string }[] = [
  { v: "weight_loss", l: "Weight Loss", emoji: "🔥" },
  { v: "fat_loss", l: "Fat Loss", emoji: "💧" },
  { v: "muscle_gain", l: "Muscle Gain", emoji: "💪" },
  { v: "recomp", l: "Recomposition", emoji: "⚡" },
  { v: "maintenance", l: "Maintenance", emoji: "🌿" },
];

const DIETS = [
  "Non-Veg (No Beef)", "Non-Veg", "Vegetarian", "Eggetarian", "Vegan",
  "Keto", "Diabetic-Friendly", "High-Protein", "Low-Carb", "Mediterranean",
  "Jain", "Pescatarian",
];
const REGIONS = ["India", "Global", "Middle East", "East Asia", "Europe", "Americas"];
const INDIAN_CUISINES = ["Maharashtrian", "Kerala", "Tamil", "Rajasthani", "Punjabi", "Bengali", "Gujarati", "South Indian", "North Indian", "Hyderabadi", "Goan"];
const COMMON_ALLERGIES = ["Peanuts", "Tree nuts", "Dairy", "Eggs", "Gluten", "Soy", "Shellfish", "Fish"];
const COMMON_MEDICAL = ["Diabetes", "Hypertension", "PCOS", "Thyroid", "Cholesterol", "Asthma", "None"];

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: dash } = useQuery(dashboardQuery);
  const profile = dash?.profile;

  const { edit } = Route.useSearch();
  // If already onboarded and not in edit mode, skip to home
  useEffect(() => {
    if (profile?.onboarded_at && !edit) navigate({ to: "/home", replace: true });
  }, [profile?.onboarded_at, edit, navigate]);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.display_name ?? "");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState(26);
  const [unitH, setUnitH] = useState<"cm" | "ft">("cm");
  const [height, setHeight] = useState(175);
  const [unitW, setUnitW] = useState<"kg" | "lbs">("kg");
  const [weight, setWeight] = useState(72);
  const [activity, setActivity] = useState<Activity>("moderate");
  const [goal, setGoal] = useState<Goal>("muscle_gain");
  const [diet, setDiet] = useState("Non-Veg (No Beef)");
  const [region, setRegion] = useState("India");
  const [cuisine, setCuisine] = useState("Maharashtrian");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medical, setMedical] = useState<string[]>([]);

  const heightCm = unitH === "cm" ? height : Math.round(height * 30.48);
  const weightKg = unitW === "kg" ? weight : Math.round(weight * 0.4536);

  const computed = useMemo(() => {
    const bmr = gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9 }[activity];
    const tdee = bmr * mult;
    let cal = tdee;
    if (goal === "weight_loss" || goal === "fat_loss") cal -= 500;
    if (goal === "muscle_gain") cal += 300;
    const protein = Math.round(weightKg * (goal === "muscle_gain" ? 2.0 : 1.8));
    const fat = Math.round((cal * 0.25) / 9);
    const carbs = Math.max(50, Math.round((cal - protein * 4 - fat * 9) / 4));
    const bmi = weightKg / Math.pow(heightCm / 100, 2);
    const bf = gender === "male" ? 1.2 * bmi + 0.23 * age - 16.2 : 1.2 * bmi + 0.23 * age - 5.4;
    const after_bf = Math.max(8, bf - (goal === "weight_loss" || goal === "fat_loss" ? 4 : 2));
    const after_w = goal === "weight_loss" || goal === "fat_loss"
      ? weightKg - 4 : goal === "muscle_gain" ? weightKg + 3 : weightKg - 1;
    return {
      calories: Math.round(cal),
      protein, fat, carbs,
      bmi: Number(bmi.toFixed(1)),
      body_fat: Number(Math.max(8, Math.min(40, bf)).toFixed(1)),
      after_bf: Number(after_bf.toFixed(1)),
      after_weight: Number(after_w.toFixed(1)),
      muscle: Number((gender === "male" ? 45 - bf * 0.3 : 38 - bf * 0.3).toFixed(0)),
      water: 55,
    };
  }, [gender, age, heightCm, weightKg, activity, goal]);

  const bmiState = computed.bmi < 18.5 ? "Underweight"
    : computed.bmi < 25 ? "Healthy"
    : computed.bmi < 30 ? "Overweight" : "Obese";

  const save = useMutation({
    mutationFn: async () => {
      await saveOnboarding({ data: {
        display_name: name || undefined,
        gender, age, height_cm: heightCm, weight_kg: weightKg,
        activity_level: activity, physique_goal: goal,
        diet_preference: diet,
        region,
        cuisine: region === "India" ? cuisine : "",
        allergies, medical_conditions: medical,
      }});
      // Fire and forget — plan can finish in background
      generateAiPlan().catch(() => {});
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onSuccess: () => {
      toast.success("Your journey starts now");
      navigate({ to: "/home", replace: true });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save"),
  });

  const TOTAL = 6;
  const next = () => setStep((s) => Math.min(TOTAL, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="min-h-screen pb-32 px-5 pt-10 relative overflow-hidden">
      {/* ambient */}
      <div className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full blur-3xl opacity-30"
        style={{ background: "oklch(0.72 0.22 240)" }} />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full blur-3xl opacity-25"
        style={{ background: "oklch(0.78 0.18 210)" }} />

      {/* progress */}
      <div className="flex items-center gap-1.5 mb-6">
        {Array.from({ length: TOTAL + 1 }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-gradient-to-r from-[oklch(0.82_0.16_215)] to-[oklch(0.62_0.26_260)]" : "bg-white/10"}`} />
        ))}
      </div>

      {step === 0 && (
        <Card>
          <Eyebrow icon={Sparkles}>Welcome</Eyebrow>
          <h1 className="text-3xl font-bold leading-tight">Let's Start Your <span className="bg-gradient-to-r from-[oklch(0.82_0.16_215)] to-[oklch(0.62_0.26_260)] bg-clip-text text-transparent">Transformation</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">A few quick questions and your AI coach will craft a plan only for you.</p>

          <label className="block mt-6 text-xs text-muted-foreground">Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?"
            className="mt-1 w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-[oklch(0.72_0.22_240)]/60" />

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Choice active={gender === "male"} onClick={() => setGender("male")} icon={User} label="Male" ariaLabel="Select male" />
            <Choice active={gender === "female"} onClick={() => setGender("female")} icon={User} label="Female" ariaLabel="Select female" />
          </div>

          <label className="block mt-6 text-xs text-muted-foreground">Age</label>
          <div className="mt-1 glass rounded-2xl p-2">
            <WheelPicker min={13} max={90} value={age} onChange={setAge} unit="yrs" />
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <Eyebrow icon={Activity}>Body metrics</Eyebrow>
          <h2 className="text-2xl font-bold">Your body</h2>

          <UnitField label="Height" unit={unitH} setUnit={(u: string) => setUnitH(u as "cm" | "ft")} units={["cm", "ft"]}
            value={height} onChange={setHeight} min={unitH === "cm" ? 120 : 4} max={unitH === "cm" ? 220 : 7} step={unitH === "cm" ? 1 : 0.1} />
          <UnitField label="Weight" unit={unitW} setUnit={(u: string) => setUnitW(u as "kg" | "lbs")} units={["kg", "lbs"]}
            value={weight} onChange={setWeight} min={unitW === "kg" ? 35 : 80} max={unitW === "kg" ? 200 : 440} step={1} />

          <p className="mt-4 text-xs text-muted-foreground">BMI <span className="text-foreground font-semibold">{computed.bmi}</span> • <span className="text-[oklch(0.78_0.18_210)]">{bmiState}</span></p>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <Eyebrow icon={Flame}>Activity level</Eyebrow>
          <h2 className="text-2xl font-bold">How active are you?</h2>
          <div className="mt-4 space-y-2">
            {ACTIVITY.map((a) => (
              <button key={a.v} onClick={() => setActivity(a.v)} aria-pressed={activity === a.v}
                className={`relative w-full text-left glass rounded-2xl p-4 border-2 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.72_0.22_240)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] ${activity === a.v ? "z-10 border-[oklch(0.72_0.22_240)] bg-[oklch(0.72_0.22_240/0.22)] shadow-[0_0_0_4px_oklch(0.72_0.22_240/0.18),0_12px_30px_-12px_oklch(0.72_0.22_240/0.8)]" : "border-white/10 hover:border-white/20"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{a.l}</div>
                    <div className="text-xs text-muted-foreground">{a.d}</div>
                  </div>
                  {activity === a.v && (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[oklch(0.72_0.22_240)] text-primary-foreground shadow-md animate-scale-in">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <Eyebrow icon={Target}>Your goal</Eyebrow>
          <h2 className="text-2xl font-bold">What's your physique goal?</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {GOALS.map((g) => (
              <button key={g.v} onClick={() => setGoal(g.v)} aria-pressed={goal === g.v}
                className={`relative glass rounded-2xl p-4 text-left border-2 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.72_0.22_240)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] ${goal === g.v ? "z-10 -translate-y-0.5 scale-[1.02] border-[oklch(0.72_0.22_240)] bg-[oklch(0.72_0.22_240/0.22)] shadow-[0_0_0_4px_oklch(0.72_0.22_240/0.18),0_12px_30px_-12px_oklch(0.72_0.22_240/0.8)]" : "border-white/10 hover:border-white/20"}`}>
                {goal === g.v && (
                  <span className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.72_0.22_240)] text-primary-foreground shadow-md animate-scale-in">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                <div className={`text-2xl transition-transform ${goal === g.v ? "scale-110" : ""}`} aria-hidden="true">{g.emoji}</div>
                <div className="mt-1.5 font-semibold text-sm">{g.l}</div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <Eyebrow icon={Apple}>Diet & allergies</Eyebrow>
          <h2 className="text-2xl font-bold">Your food world</h2>

          <label className="block mt-5 text-xs text-muted-foreground">Region</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <Chip key={r} active={region === r} onClick={() => setRegion(r)}>{r}</Chip>
            ))}
          </div>

          {region === "India" && (
            <>
              <label className="block mt-5 text-xs text-muted-foreground">Regional cuisine</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {INDIAN_CUISINES.map((c) => (
                  <Chip key={c} active={cuisine === c} onClick={() => setCuisine(c)}>{c}</Chip>
                ))}
              </div>
            </>
          )}

          <label className="block mt-5 text-xs text-muted-foreground">Diet preference</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIETS.map((d) => (
              <Chip key={d} active={diet === d} onClick={() => setDiet(d)}>{d}</Chip>
            ))}
          </div>

          <label className="block mt-5 text-xs text-muted-foreground">Allergies (tap any)</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((a) => (
              <Chip key={a} active={allergies.includes(a)} onClick={() => toggle(allergies, a, setAllergies)}>{a}</Chip>
            ))}
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <Eyebrow icon={Heart}>Medical</Eyebrow>
          <h2 className="text-2xl font-bold">Any health conditions?</h2>
          <p className="mt-1 text-sm text-muted-foreground">We'll adapt your plan accordingly.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {COMMON_MEDICAL.map((m) => (
              <Chip key={m} active={medical.includes(m)} onClick={() => toggle(medical, m, setMedical)} icon={ShieldAlert}>{m}</Chip>
            ))}
          </div>
        </Card>
      )}

      {step === 6 && (
        <TransformationPreview
          gender={gender} weightKg={weightKg} heightCm={heightCm}
          computed={computed} bmiState={bmiState} goal={goal}
        />
      )}

      {/* Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-5 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
        <div className="max-w-md mx-auto flex gap-3">
          {step > 0 && (
            <button onClick={back} className="glass rounded-2xl px-5 py-3.5 flex items-center gap-1.5 text-sm">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          {step < TOTAL ? (
            <button onClick={next}
              style={{ background: "var(--gradient-hero)" }}
              className="flex-1 rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 text-primary-foreground glow-ring">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button disabled={save.isPending} onClick={() => save.mutate()}
              style={{ background: "var(--gradient-hero)" }}
              className="flex-1 rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 text-primary-foreground glow-ring disabled:opacity-70">
              {save.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Building your plan…</> : <><Zap className="h-4 w-4" /> Let's Start My Journey</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function toggle<T extends string>(arr: T[], v: T, set: (n: T[]) => void) {
  set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="animate-slide-up relative z-10">{children}</div>;
}
function Eyebrow({ icon: Icon, children }: any) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[oklch(0.78_0.18_210)] mb-3">
      <Icon className="h-3 w-3" /> {children}
    </div>
  );
}
function Choice({ active, onClick, icon: Icon, label, ariaLabel }: any) {
  return (
    <button onClick={onClick} aria-pressed={active} aria-label={ariaLabel}
      className={`relative glass rounded-2xl p-4 flex flex-col items-center gap-2 border-2 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.72_0.22_240)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] ${active ? "z-10 -translate-y-0.5 scale-[1.02] border-[oklch(0.72_0.22_240)] bg-[oklch(0.72_0.22_240/0.22)] shadow-[0_0_0_4px_oklch(0.72_0.22_240/0.18),0_12px_30px_-12px_oklch(0.72_0.22_240/0.8)]" : "border-white/10 hover:border-white/20"}`}>
      {active && (
        <span className="absolute top-2 right-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.72_0.22_240)] text-primary-foreground shadow-md animate-scale-in">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
      <Icon className={`h-6 w-6 transition-transform ${active ? "text-[oklch(0.82_0.16_215)] scale-110" : ""}`} aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
function Chip({ active, onClick, children, icon: Icon }: any) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm border transition-all inline-flex items-center gap-1.5 ${active ? "bg-gradient-to-r from-[oklch(0.82_0.16_215)] to-[oklch(0.62_0.26_260)] text-primary-foreground border-transparent" : "glass border-white/10"}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />} {children}
    </button>
  );
}
function UnitField({ label, unit, setUnit, units, value, onChange, min, max, step }: any) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex gap-1 bg-white/5 rounded-full p-1">
          {units.map((u: string) => (
            <button key={u} onClick={() => setUnit(u)}
              className={`px-3 py-0.5 text-xs rounded-full transition-all ${unit === u ? "bg-white/15 text-foreground" : "text-muted-foreground"}`}>{u}</button>
          ))}
        </div>
      </div>
      <div className="glass rounded-2xl p-2">
        <WheelPicker
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          unit={unit}
          formatter={step < 1 ? (v: number) => v.toFixed(1) : undefined}
        />
      </div>
    </div>
  );
}

function TransformationPreview({ gender, weightKg, heightCm, computed, bmiState, goal }: any) {
  const img = gender === "male" ? bodyMale : bodyFemale;
  const goalLabel = GOALS.find((g) => g.v === goal)?.l ?? "Your goal";
  return (
    <div className="animate-slide-up relative z-10 space-y-5">
      <div>
        <Eyebrow icon={Sparkles}>AI Analysis</Eyebrow>
        <h2 className="text-3xl font-bold leading-tight">Your Body <span className="bg-gradient-to-r from-[oklch(0.82_0.16_215)] to-[oklch(0.62_0.26_260)] bg-clip-text text-transparent">Transformation</span></h2>
        <p className="mt-1 text-sm text-muted-foreground">4-week prediction based on your profile & science</p>
      </div>

      {/* Before / After */}
      <div className="grid grid-cols-2 gap-3">
        <BodyCard label="NOW" img={img} weight={weightKg} bf={computed.body_fat} bmi={computed.bmi} state={bmiState} />
        <BodyCard label="AFTER 4 WEEKS" img={img} weight={computed.after_weight} bf={computed.after_bf}
          bmi={Number((computed.after_weight / Math.pow(heightCm / 100, 2)).toFixed(1))} state="On track" glow />
      </div>

      {/* Goal banner */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-[oklch(0.72_0.22_240)]/30">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.82_0.16_215)] to-[oklch(0.62_0.26_260)] flex items-center justify-center glow-ring">
          <Target className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Your goal</div>
          <div className="font-semibold">{goalLabel}</div>
        </div>
        <TrendingUp className="ml-auto h-5 w-5 text-[oklch(0.78_0.18_210)]" />
      </div>

      {/* Daily targets */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Daily targets</h3>
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={Flame} label="Calories" value={computed.calories} unit="kcal" />
          <Stat icon={Dumbbell} label="Protein" value={computed.protein} unit="g" />
          <Stat label="Carbs" value={computed.carbs} unit="g" />
          <Stat label="Fat" value={computed.fat} unit="g" />
        </div>
      </div>

      {/* Body comp */}
      <div className="glass rounded-3xl p-5">
        <h3 className="text-sm font-semibold mb-3">Body Composition</h3>
        <Meter label="Muscle Mass" value={computed.muscle} />
        <Meter label="Body Fat" value={Math.round(computed.body_fat)} warn />
        <Meter label="Water" value={computed.water} />
      </div>

      {/* AI insight */}
      <div className="glass rounded-3xl p-5 border border-[oklch(0.72_0.22_240)]/30">
        <div className="flex items-center gap-2 text-sm font-semibold text-[oklch(0.78_0.18_210)] mb-1.5">
          <Sparkles className="h-4 w-4" /> AI Insight
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Consistency beats intensity. Hit your protein daily, train 4× this week, and you'll see real change by day 28.
          Your transformation starts the moment you tap below.
        </p>
      </div>
    </div>
  );
}

function BodyCard({ label, img, weight, bf, bmi, state, glow }: any) {
  return (
    <div className={`glass rounded-3xl p-3 overflow-hidden relative ${glow ? "border border-[oklch(0.72_0.22_240)]/40 shadow-[0_0_30px_oklch(0.72_0.22_240/0.25)]" : ""}`}>
      <div className={`text-[10px] uppercase tracking-widest mb-1 ${glow ? "text-[oklch(0.78_0.18_210)]" : "text-muted-foreground"}`}>{label}</div>
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black/30">
        <img src={img} alt={label} className={`w-full h-full object-cover ${glow ? "" : "grayscale-[40%] brightness-90"}`} />
        {glow && <div className="absolute inset-0 ring-2 ring-[oklch(0.72_0.22_240)]/40 rounded-2xl shadow-[inset_0_0_40px_oklch(0.72_0.22_240/0.3)]" />}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
        <Mini label="Weight" v={`${weight}kg`} />
        <Mini label="BF" v={`${bf}%`} />
        <Mini label="BMI" v={`${bmi}`} />
        <Mini label="" v={state} accent={glow} />
      </div>
    </div>
  );
}
function Mini({ label, v, accent }: any) {
  return (
    <div className="bg-white/5 rounded-lg px-2 py-1">
      {label && <div className="text-[9px] text-muted-foreground uppercase">{label}</div>}
      <div className={`font-semibold ${accent ? "text-[oklch(0.78_0.18_210)]" : ""}`}>{v}</div>
    </div>
  );
}
function Stat({ icon: Icon, label, value, unit }: any) {
  return (
    <div className="glass rounded-2xl p-3.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        <span className="text-[11px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
function Meter({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, value)}%`,
            background: warn
              ? "linear-gradient(90deg, oklch(0.78 0.16 60), oklch(0.7 0.2 30))"
              : "linear-gradient(90deg, oklch(0.82 0.16 215), oklch(0.62 0.26 260))" }} />
      </div>
    </div>
  );
}
