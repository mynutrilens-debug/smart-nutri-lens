import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OnboardingInput = z.object({
  display_name: z.string().min(1).max(80).optional(),
  gender: z.enum(["male", "female"]),
  age: z.number().int().min(13).max(100),
  height_cm: z.number().min(100).max(230),
  weight_kg: z.number().min(30).max(250),
  target_weight_kg: z.number().min(30).max(250).optional(),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "athlete"]),
  physique_goal: z.enum(["weight_loss", "fat_loss", "muscle_gain", "maintenance", "recomp"]),
  diet_preference: z.string().min(1).max(60),
  region: z.string().max(60).optional().nullable(),
  cuisine: z.string().max(60).optional().nullable(),
  allergies: z.array(z.string().max(40)).max(20).default([]),
  medical_conditions: z.array(z.string().max(60)).max(20).default([]),
});

export type OnboardingPayload = z.infer<typeof OnboardingInput>;

function computeTargets(p: OnboardingPayload) {
  const bmr =
    p.gender === "male"
      ? 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + 5
      : 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age - 161;
  const mult: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9 };
  const tdee = bmr * (mult[p.activity_level] ?? 1.4);
  let calories = tdee;
  if (p.physique_goal === "weight_loss" || p.physique_goal === "fat_loss") calories = tdee - 500;
  if (p.physique_goal === "muscle_gain") calories = tdee + 300;
  calories = Math.round(calories);
  const protein = Math.round(p.weight_kg * (p.physique_goal === "muscle_gain" ? 2.0 : 1.8));
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(50, Math.round((calories - protein * 4 - fat * 9) / 4));
  const bmi = p.weight_kg / Math.pow(p.height_cm / 100, 2);
  const bodyFat =
    p.gender === "male" ? 1.2 * bmi + 0.23 * p.age - 16.2 : 1.2 * bmi + 0.23 * p.age - 5.4;
  return {
    calories,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
    bmi: Number(bmi.toFixed(1)),
    body_fat_pct: Number(Math.max(5, Math.min(45, bodyFat)).toFixed(1)),
    muscle_mass_pct: Number((p.gender === "male" ? 45 - bodyFat * 0.3 : 38 - bodyFat * 0.3).toFixed(1)),
    tdee: Math.round(tdee),
  };
}

export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => OnboardingInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const t = computeTargets(data);
    const target_weight =
      data.target_weight_kg ??
      (data.physique_goal === "weight_loss" || data.physique_goal === "fat_loss"
        ? Math.round((data.weight_kg - 4) * 10) / 10
        : data.physique_goal === "muscle_gain"
          ? Math.round((data.weight_kg + 3) * 10) / 10
          : data.weight_kg);

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        display_name: data.display_name,
        gender: data.gender,
        age: data.age,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg,
        target_weight_kg: target_weight,
        activity_level: data.activity_level,
        physique_goal: data.physique_goal,
        diet_preference: data.diet_preference,
        allergies: data.allergies,
        medical_conditions: data.medical_conditions,
        daily_calorie_goal: t.calories,
        protein_goal_g: t.protein_g,
        carbs_goal_g: t.carbs_g,
        fat_goal_g: t.fat_g,
        body_fat_pct: t.body_fat_pct,
        muscle_mass_pct: t.muscle_mass_pct,
        onboarded_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true, targets: t, target_weight_kg: target_weight };
  });

export const generateAiPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    if (!p) throw new Error("Profile not found");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const heightM = (p.height_cm ?? 170) / 100;
    const bmi = Number(((p.weight_kg ?? 70) / (heightM * heightM)).toFixed(1));
    const bmiCat = bmi < 18.5 ? "underweight" : bmi < 25 ? "normal" : bmi < 30 ? "overweight" : "obese";

    const prompt = `You are a certified nutrition and fitness coach. Build a PERSONALIZED daily diet plan. Return STRICT JSON only.

USER PROFILE
- Gender: ${p.gender}, Age: ${p.age}
- Height: ${p.height_cm}cm, Weight: ${p.weight_kg}kg, BMI: ${bmi} (${bmiCat})
- Goal: ${p.physique_goal}, Activity: ${p.activity_level}
- Diet preference: ${p.diet_preference}
- Allergies (STRICTLY AVOID): ${(p.allergies ?? []).join(", ") || "none"}
- Medical conditions: ${(p.medical_conditions ?? []).join(", ") || "none"}
- Daily targets: ${p.daily_calorie_goal} kcal · P:${p.protein_goal_g}g C:${p.carbs_goal_g}g F:${p.fat_goal_g}g

RULES
- Tailor calories/macros to BMI + goal (deficit for weight/fat loss, surplus for muscle gain, balanced for maintenance/recomp).
- Affordable, practical, locally available foods matching diet preference.
- Provide PORTION guidance (grams or household measures) for EVERY item.
- Include shake recommendations tuned to goal:
  * muscle_gain / underweight → high-cal mass shakes (banana + oats + peanut butter + milk + whey)
  * weight_loss / fat_loss → low-cal detox / protein (green tea, honey-lemon water, cucumber-mint, whey + water)
  * maintenance / recomp → balanced protein smoothies
- Never include allergens. Respect medical conditions.

Return ONLY this JSON (no markdown):
{
  "summary": "1-2 sentence coach summary referencing BMI & goal",
  "bmi": ${bmi},
  "bmi_category": "${bmiCat}",
  "daily_targets": { "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
  "meals": {
    "breakfast":    { "items": "…with portions…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
    "pre_workout":  { "items": "…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "timing": "30-45 min before" },
    "post_workout": { "items": "…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "timing": "within 30 min after" },
    "lunch":        { "items": "…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
    "snack":        { "items": "…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
    "dinner":       { "items": "…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 }
  },
  "shakes": [
    { "name": "", "ingredients": "", "calories": 0, "protein_g": 0, "when": "morning|pre|post|evening" }
  ],
  "tips": ["3-5 short, goal-specific tips"],
  "workout": [
    { "day": "Mon", "focus": "Push", "exercises": [{ "name": "Bench Press", "sets": 4, "reps": "8-10" }] }
  ]
}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a certified nutrition and fitness coach. Output only valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const json = (await res.json()) as any;
    let text: string = json?.choices?.[0]?.message?.content ?? "{}";
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    let plan: any;
    try { plan = JSON.parse(text); } catch { throw new Error("Plan parse failed"); }

    await supabase.from("profiles").update({ ai_plan: plan }).eq("user_id", userId);
    return plan;
  });
