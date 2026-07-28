import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGeminiJson } from "@/lib/ai-gemini.server";

const OnboardingInput = z.object({
  display_name: z.string().min(1).max(80).optional(),
  gender: z.enum(["male", "female"]),
  age: z.number().int().min(13).max(100),
  height_cm: z.number().min(100).max(230),
  weight_kg: z.number().min(30).max(250),
  target_weight_kg: z.number().min(30).max(250).optional(),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "athlete"]),
  physique_goal: z.enum(["weight_loss", "fat_loss", "muscle_gain", "maintenance", "recomp", "bulking"]),
  diet_preference: z.string().min(1).max(60),
  region: z.string().max(60).optional().nullable(),
  cuisine: z.string().max(60).optional().nullable(),
  allergies: z.array(z.string().max(40)).max(20).default([]),
  medical_conditions: z.array(z.string().max(60)).max(20).default([]),
  // New lifestyle & personalization inputs
  budget: z.enum(["low", "medium", "high"]).optional().nullable(),
  lifestyle: z.string().max(40).optional().nullable(),
  meal_frequency: z.number().int().min(2).max(6).optional().nullable(),
  sleep_hours: z.number().min(3).max(12).optional().nullable(),
  water_intake_l: z.number().min(0.5).max(8).optional().nullable(),
  workout_habit: z.string().max(40).optional().nullable(),
  deficiencies: z.array(z.string().max(40)).max(20).default([]),
});

export type OnboardingPayload = z.infer<typeof OnboardingInput>;

// BMI is a HEALTH CLASSIFIER only — never used to size calories.
// Pipeline: BMR (Mifflin-St Jeor) → TDEE (activity multiplier) → goal adjustment.
// Protein 1.6–2.4 g/kg, Fat 0.6–1.0 g/kg, remaining calories → carbs.
function computeTargets(p: OnboardingPayload) {
  const bmr =
    p.gender === "male"
      ? 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + 5
      : 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age - 161;

  const mult: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9,
  };
  const tdee = bmr * (mult[p.activity_level] ?? 1.4);

  // Goal-based calorie adjustment (fraction of TDEE)
  const goalAdj: Record<string, number> = {
    fat_loss: -0.225,      // −20–25% (midpoint)
    weight_loss: -0.15,    // −10–20%
    maintenance: 0,
    recomp: 0,             // ±5% around TDEE; protein does the work
    muscle_gain: 0.10,     // +5–15% (lean)
    bulking: 0.175,        // +15–20%
  };
  const calories = Math.round(tdee * (1 + (goalAdj[p.physique_goal] ?? 0)));

  // Protein 1.6–2.4 g/kg based on goal
  const proteinPerKg =
    p.physique_goal === "fat_loss" ? 2.2 :
    p.physique_goal === "weight_loss" ? 2.0 :
    p.physique_goal === "recomp" ? 2.2 :
    p.physique_goal === "muscle_gain" ? 2.0 :
    p.physique_goal === "bulking" ? 1.8 :
    1.8;
  const protein = Math.round(p.weight_kg * proteinPerKg);

  // Fat 0.6–1.0 g/kg
  const fatPerKg =
    p.physique_goal === "fat_loss" ? 0.7 :
    p.physique_goal === "bulking" ? 1.0 :
    p.physique_goal === "muscle_gain" ? 0.9 :
    0.8;
  const fat = Math.round(p.weight_kg * fatPerKg);

  // Remaining calories → carbs (min 50g)
  const carbs = Math.max(50, Math.round((calories - protein * 4 - fat * 9) / 4));

  const bmi = p.weight_kg / Math.pow(p.height_cm / 100, 2);
  const bmiCategory =
    bmi < 18.5 ? "underweight" : bmi < 25 ? "normal" : bmi < 30 ? "overweight" : "obese";
  const bodyFat =
    p.gender === "male" ? 1.2 * bmi + 0.23 * p.age - 16.2 : 1.2 * bmi + 0.23 * p.age - 5.4;

  return {
    calories,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
    bmi: Number(bmi.toFixed(1)),
    bmi_category: bmiCategory,
    body_fat_pct: Number(Math.max(5, Math.min(45, bodyFat)).toFixed(1)),
    muscle_mass_pct: Number((p.gender === "male" ? 45 - bodyFat * 0.3 : 38 - bodyFat * 0.3).toFixed(1)),
    bmr: Math.round(bmr),
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
        region: data.region ?? null,
        cuisine: data.cuisine ?? null,
        allergies: data.allergies,
        medical_conditions: data.medical_conditions,
        budget: data.budget ?? null,
        lifestyle: data.lifestyle ?? null,
        meal_frequency: data.meal_frequency ?? null,
        sleep_hours: data.sleep_hours ?? null,
        water_intake_l: data.water_intake_l ?? null,
        workout_habit: data.workout_habit ?? null,
        deficiencies: data.deficiencies,
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
  .inputValidator((d: unknown) => {
    const parsed = z.object({ force: z.boolean().optional() }).safeParse(d ?? {});
    return parsed.success ? parsed.data : { force: false };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    if (!p) throw new Error("Profile not found");

    // Subscription gating
    const { data: sub } = await supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
    const now = new Date();
    const trialActive = sub?.plan === "trial" && sub?.status === "active" && new Date(sub.trial_expires_at) > now;
    const goldOrPlat = (sub?.plan === "gold" || sub?.plan === "platinum") && sub?.status === "active" &&
      (!sub.current_period_expires_at || new Date(sub.current_period_expires_at) > now);
    const silverActive = sub?.plan === "silver" && sub?.status === "active" && (sub.silver_plans_used ?? 0) < 15;
    if (!trialActive && !goldOrPlat && !silverActive) {
      throw new Error("Your plan does not include diet plan generation. Please upgrade.");
    }

    // Once-per-day gate: strictly one plan per UTC day. `force` is ignored
    // so users cannot regenerate multiple times in the same day.
    const existingPlan = (p as any).ai_plan;
    const lastGen = (p as any).ai_plan_generated_at as string | null | undefined;
    if (existingPlan && lastGen) {
      const last = new Date(lastGen);
      const sameDay =
        last.getUTCFullYear() === now.getUTCFullYear() &&
        last.getUTCMonth() === now.getUTCMonth() &&
        last.getUTCDate() === now.getUTCDate();
      if (sameDay) return existingPlan;
    }

    // Recent dishes to AVOID — pulls from the previous plan's meals plus
    // the last 3 days of food_logs, so each day's plan is meaningfully
    // different from what the user just ate.
    const recentDishes = new Set<string>();
    const prevMeals = (existingPlan?.meals ?? {}) as Record<string, any>;
    for (const m of Object.values(prevMeals)) {
      if (m?.name) recentDishes.add(String(m.name).trim());
    }
    const { data: recentLogs } = await supabase
      .from("food_logs")
      .select("name")
      .eq("user_id", userId)
      .gte("logged_at", new Date(Date.now() - 3 * 86400000).toISOString())
      .limit(40);
    for (const r of (recentLogs ?? [])) {
      if ((r as any)?.name) recentDishes.add(String((r as any).name).trim());
    }
    const avoidLine = recentDishes.size
      ? `- AVOID repeating these recent dishes (choose different ones): ${Array.from(recentDishes).slice(0, 24).join(", ")}`
      : `- No recent dishes on record — pick a fresh variety.`;
    const rotationSeed = Math.floor(Date.now() / 86400000) % 7; // 0..6, rotates daily


    const heightM = (p.height_cm ?? 170) / 100;
    const bmi = Number(((p.weight_kg ?? 70) / (heightM * heightM)).toFixed(1));
    const bmiCat = bmi < 18.5 ? "underweight" : bmi < 25 ? "normal" : bmi < 30 ? "overweight" : "obese";

    const region = (p as any).region || "Global";
    const cuisine = (p as any).cuisine || "";
    const cuisineLine = region.toLowerCase() === "india"
      ? `- Region: India · Sub-cuisine focus: ${cuisine || "balanced pan-Indian"} (use authentic local staples — e.g. Maharashtrian: poha, bhakri, varan-bhaat, misal; Kerala: appam, puttu, fish curry, sambhar; Tamil: idli, dosa, sambar, rasam; Rajasthani: dal-baati, gatte ki sabzi, khichdi; Punjabi: roti, dal, sarson, paneer; Bengali: macher jhol, luchi; Gujarati: thepla, dhokla; South Indian: ragi, millets). Use household measures (katori, roti count, glass).`
      : `- Region: ${region}${cuisine ? ` · Cuisine: ${cuisine}` : ""}`;

    // Health signals from Apple Health / Health Connect (7-day averages)
    const { data: snaps } = await supabase
      .from("health_snapshots")
      .select("steps, calories_burned, active_minutes, avg_heart_rate, resting_heart_rate, sleep_minutes")
      .eq("user_id", userId)
      .gte("captured_on", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
    const n = snaps?.length ?? 0;
    const avg = (k: string) => n ? Math.round(snaps!.reduce((a: number, s: any) => a + (Number(s[k]) || 0), 0) / n) : 0;
    const healthLine = n > 0
      ? `- Health signals (7-day avg from Apple Health / Health Connect): steps ${avg("steps")}, active min ${avg("active_minutes")}, calories burned ${avg("calories_burned")}, resting HR ${avg("resting_heart_rate") || avg("avg_heart_rate") || "n/a"}, sleep ${Math.round(avg("sleep_minutes") / 60)}h. Tune calorie target to measured activity (not just self-reported) and prefer lighter meals/recovery focus on days after <6h sleep.`
      : `- Health signals: none synced yet.`;
    // Energy pipeline (BMI is classification only, NOT used to size calories)
    const bmrCalc =
      p.gender === "male"
        ? 10 * (p.weight_kg ?? 70) + 6.25 * (p.height_cm ?? 170) - 5 * (p.age ?? 30) + 5
        : 10 * (p.weight_kg ?? 70) + 6.25 * (p.height_cm ?? 170) - 5 * (p.age ?? 30) - 161;
    const activityMult: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9 };
    const tdeeCalc = Math.round(bmrCalc * (activityMult[p.activity_level as string] ?? 1.4));
    const sleepAvgMin = n > 0 ? avg("sleep_minutes") : 0;

    const prompt = `You are a certified nutrition and fitness coach. Build a PERSONALIZED daily diet plan. Return STRICT JSON only.

USER PROFILE
- Gender: ${p.gender}, Age: ${p.age}
- Height: ${p.height_cm}cm, Weight: ${p.weight_kg}kg
- BMI: ${bmi} (${bmiCat}) — CLASSIFICATION ONLY, do NOT use BMI to size calories
- BMR (Mifflin-St Jeor): ${Math.round(bmrCalc)} kcal · TDEE (BMR × activity): ${tdeeCalc} kcal
- Goal: ${p.physique_goal} · Activity: ${p.activity_level}
- Diet preference: ${p.diet_preference} (honor strictly — "Non-Veg (No Beef)" excludes beef; "Vegan" excludes all animal products incl. dairy/eggs/honey; "Vegetarian" excludes meat/fish/eggs unless eggetarian; "Keto" <30g net carbs/day; "Diabetic-Friendly" low-GI, no refined sugar; "High-Protein" ≥30% cals from protein)
${cuisineLine}
- Allergies (STRICTLY AVOID): ${(p.allergies ?? []).join(", ") || "none"}
- Medical conditions / deficiencies to address: ${(p.medical_conditions ?? []).join(", ") || "none"}
- Precomputed daily targets (already goal-adjusted from TDEE, protein 1.6–2.4 g/kg, fat 0.6–1.0 g/kg, rest = carbs): ${p.daily_calorie_goal} kcal · P:${p.protein_goal_g}g C:${p.carbs_goal_g}g F:${p.fat_goal_g}g — match these within ±5%.
- Plan date: ${new Date().toISOString().slice(0, 10)} · rotation slot #${rotationSeed} of 7
${avoidLine}
${healthLine}

CALORIE / MACRO RULES (already applied in the targets above — reproduce them faithfully)
- Fat Loss → TDEE −20 to −25%   |  Weight Loss → TDEE −10 to −20%
- Maintenance → TDEE            |  Recomp → TDEE ±5%
- Lean Muscle Gain → TDEE +5 to +15%  |  Bulking → TDEE +15 to +20%
- Protein 1.6–2.4 g/kg · Fat 0.6–1.0 g/kg · remaining kcal → carbs
- NEVER use BMI as the calorie driver — BMI only informs food-quality guidance (e.g. obese/overweight → more fiber, low-GI; underweight → calorie-dense).

MEAL / PERSONALIZATION RULES
- Use AUTHENTIC region/cuisine dishes by name. Affordable, locally available foods.
- Meal frequency: 3 main meals + 1 snack + pre/post-workout if training that day. Split calories realistically (breakfast 25%, lunch 30%, dinner 25%, snack 10%, pre+post 10%).
- Cover daily micronutrient needs: leafy greens (iron/folate), dairy or fortified plant milk (calcium/B12), colored veg/fruit (A, C, K, antioxidants), nuts/seeds (Mg, Zn, omega-3), whole grains (B-complex, fiber ≥25g). If a medical condition names a deficiency (e.g. iron, B12, vit D), explicitly bias foods toward it.
- Hydration: recommend water intake in liters (35 ml/kg body weight, adjust up for active users).
- Sleep-aware: if sleep <6h (avg sleep min: ${sleepAvgMin}), reduce caffeine after noon, add magnesium/tryptophan-rich dinner (banana, oats, dairy, turkey/paneer).
- Budget-friendly: prefer staples (lentils, eggs, seasonal veg, local grains) over imported/expensive items unless user profile signals premium.
- Gym access assumed for muscle_gain/bulking/recomp goals — include pre & post workout meals; for sedentary/light users, drop pre_workout and use a lighter snack instead.
- Shakes tuned to goal:
  * muscle_gain / bulking / underweight → high-cal mass shakes (banana + oats + peanut butter + milk + whey)
  * weight_loss / fat_loss → low-cal detox / protein (green tea, honey-lemon water, cucumber-mint, jeera water, whey + water)
  * maintenance / recomp → balanced protein smoothies
  * diabetic-friendly → unsweetened, low-GI only
- Provide PORTION guidance (grams, katori, pieces, cups) for EVERY item.
- Never include allergens. Respect medical conditions and diet preference strictly.
- VARIETY IS CRITICAL: every meal MUST be DIFFERENT from the AVOID list. Rotate protein sources, grains, and cooking styles day-to-day.


Return ONLY this JSON (no markdown):
{
  "summary": "1-2 sentence coach summary referencing BMI, goal & cuisine",
  "bmi": ${bmi},
  "bmi_category": "${bmiCat}",
  "region": "${region}",
  "cuisine": "${cuisine}",
  "daily_targets": { "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
  "meals": {
    "breakfast":    { "name": "dish name", "items": "…with portions…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
    "pre_workout":  { "name": "", "items": "…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "timing": "30-45 min before" },
    "post_workout": { "name": "", "items": "…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "timing": "within 30 min after" },
    "lunch":        { "name": "", "items": "…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
    "snack":        { "name": "", "items": "…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 },
    "dinner":       { "name": "", "items": "…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0 }
  },
  "shakes": [
    { "name": "", "ingredients": "", "calories": 0, "protein_g": 0, "when": "morning|pre|post|evening" }
  ],
  "tips": ["3-5 short, goal & cuisine specific tips"],
  "workout": [
    { "day": "Mon", "focus": "Push", "exercises": [{ "name": "Bench Press", "sets": 4, "reps": "8-10" }] }
  ]
}`;
    const text = await callGeminiJson({
      system: "You are a certified nutrition and fitness coach. Output only valid JSON, no markdown.",
      user: prompt,
      model: "gemini-2.5-flash-lite",
    });
    let plan: any;
    try { plan = JSON.parse(text); } catch { throw new Error("Plan parse failed"); }

    await supabase
      .from("profiles")
      .update({ ai_plan: plan, ai_plan_generated_at: new Date().toISOString() } as any)
      .eq("user_id", userId);

    // Increment silver usage counter (only when generating a new plan on Silver)
    if (silverActive) {
      await supabase
        .from("subscriptions")
        .update({ silver_plans_used: (sub!.silver_plans_used ?? 0) + 1 })
        .eq("user_id", userId);
    }
    return plan;
  });
