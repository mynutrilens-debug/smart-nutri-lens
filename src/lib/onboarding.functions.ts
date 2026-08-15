import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGeminiJson } from "@/lib/ai-gemini.server";
import { mealSlotsFor, mealSlotLabels, pruneMealsToSlots } from "@/lib/meal-slots";
import { findDietViolations, ketoTargets, resolveDietRules } from "@/lib/diet-rules.server";

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
  let fat = Math.round(p.weight_kg * fatPerKg);

  // Remaining calories → carbs (min 50g)
  let carbs = Math.max(50, Math.round((calories - protein * 4 - fat * 9) / 4));
  const dietRules = resolveDietRules(p.diet_preference);
  if (dietRules.isKeto) {
    const keto = ketoTargets(calories, protein);
    carbs = keto.carbsG;
    fat = keto.fatG;
  }

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
        ai_plan: null,
        ai_plan_generated_at: null,
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

    // ─── VARIETY CONTROLLER ────────────────────────────────────────────────
    // Rotate protein sources, grains, and vegetables so no ingredient repeats
    // more than ~twice a week. Pools stay inside Indian eating habits.
    const _region = String((p as any).region || "Global");
    const _isIndia = _region.toLowerCase() === "india";
    const dietRules = resolveDietRules(String(p.diet_preference || ""));
    const proteinPool = dietRules.proteinPool;
    const grainPool = dietRules.staplePool;
    const vegPool = dietRules.vegetablePool;

    const _recentText = Array.from(recentDishes).join(" ").toLowerCase();
    const _usedRecently = (pool: string[]) =>
      pool.filter((x) => _recentText.includes(x.split(" ")[0].toLowerCase()));
    const _freshFrom = (pool: string[], want: number) => {
      const used = new Set(_usedRecently(pool));
      const fresh = pool.filter((x) => !used.has(x));
      const src = fresh.length ? fresh : pool;
      const shift = (rotationSeed * 3) % src.length;
      const rotated = [...src.slice(shift), ...src.slice(0, shift)];
      const picks = rotated.slice(0, want);
      if (picks.length < want) picks.push(...pool.filter((x) => !picks.includes(x)).slice(0, want - picks.length));
      return picks;
    };

    const todayProteins = _freshFrom(proteinPool, 4);
    const todayGrains = _freshFrom(grainPool, 3);
    const todayVeg = _freshFrom(vegPool, 4);
    const varietyLine =
      `- VARIETY ROTATION (use these ingredients TODAY, and do NOT lean on ingredients that dominate the AVOID list):\n` +
      `  · Protein sources to feature: ${todayProteins.join(", ")}\n` +
      `  · ${dietRules.isKeto ? "Low-carb bases" : "Grains / staples"}: ${todayGrains.join(", ")}\n` +
      `  · Vegetables: ${todayVeg.join(", ")}\n` +
      `  · No single protein, grain, or vegetable may appear in more than 2 meals today. Over a 7-day view, no ingredient should repeat more than 2× per week — pick fresh alternates from the Indian pantry when needed. Rotate cooking style too (steamed / grilled / sautéed / curry / tandoori / stir-fry).`;




    const heightM = (p.height_cm ?? 170) / 100;
    const bmi = Number(((p.weight_kg ?? 70) / (heightM * heightM)).toFixed(1));
    const bmiCat = bmi < 18.5 ? "underweight" : bmi < 25 ? "normal" : bmi < 30 ? "overweight" : "obese";

    const region = (p as any).region || "Global";
    const cuisine = (p as any).cuisine || "";
    const cuisineLine = region.toLowerCase() === "india" && dietRules.isKeto
      ? `- Region: India · Sub-cuisine focus: ${cuisine || "balanced pan-Indian"}. Adapt regional flavors using keto-safe ingredients only (for example paneer/tofu/egg when allowed, coconut, nuts/seeds, cauliflower, cabbage, spinach, mushrooms, gourds, okra, eggplant). Regional authenticity NEVER permits a banned high-carb staple.`
      : region.toLowerCase() === "india"
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
    const ketoMacro = dietRules.isKeto
      ? ketoTargets(Number(p.daily_calorie_goal) || tdeeCalc, Number(p.protein_goal_g) || Math.round((p.weight_kg ?? 70) * 2))
      : null;
    const targetCarbs = ketoMacro?.carbsG ?? p.carbs_goal_g;
    const targetFat = ketoMacro?.fatG ?? p.fat_goal_g;

    // Meal frequency → exact slots this plan may contain
    const mealFreq = Number((p as any).meal_frequency) || 4;
    const trains = !["sedentary", "none", "never"].includes(String((p as any).workout_habit ?? "").toLowerCase());
    const slots = mealSlotsFor(mealFreq, trains);
    const slotList = mealSlotLabels(slots);
    const micros = `"micronutrients": { "b12_mcg": 0, "vitamin_d_iu": 0, "iron_mg": 0, "calcium_mg": 0, "magnesium_mg": 0, "zinc_mg": 0, "omega3_mg": 0, "vitamin_c_mg": 0 }`;
    const timingFor = (s: string) =>
      s === "pre_workout" ? `"timing": "30-45 min before", ` : s === "post_workout" ? `"timing": "within 30 min after", ` : "";
    const mealsSchema = `{\n${slots
      .map(
        (s) =>
          `    "${s}": { "name": "dish name", "items": "…with portions…", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0, ${timingFor(s)}${micros} }`,
      )
      .join(",\n")}\n  }`;

    const prompt = `You are a certified nutrition and fitness coach. Build a PERSONALIZED daily diet plan. Return STRICT JSON only.

DIET SAFETY GATE — THESE RULES OVERRIDE ALL OTHER EXAMPLES
- Selected diet: ${p.diet_preference}
${dietRules.hardRules || "- Follow the selected diet literally and never introduce foods from another diet pattern."}
- If any later example conflicts with these rules, IGNORE the example and choose a compliant substitute.

USER PROFILE
- Gender: ${p.gender}, Age: ${p.age}
- Height: ${p.height_cm}cm, Weight: ${p.weight_kg}kg
- BMI: ${bmi} (${bmiCat}) — CLASSIFICATION ONLY, do NOT use BMI to size calories
- BMR (Mifflin-St Jeor): ${Math.round(bmrCalc)} kcal · TDEE (BMR × activity): ${tdeeCalc} kcal
- Goal: ${p.physique_goal} · Activity: ${p.activity_level}
- Diet preference: ${p.diet_preference} (a hard constraint, not a suggestion)
${cuisineLine}
- Allergies (STRICTLY AVOID): ${(p.allergies ?? []).join(", ") || "none"}
- Medical conditions: ${(p.medical_conditions ?? []).join(", ") || "none"}
- Tracked vitamin/mineral DEFICIENCIES to correct: ${((p as any).deficiencies ?? []).join(", ") || "none reported"}
- Budget: ${(p as any).budget ?? "medium"} · Lifestyle: ${(p as any).lifestyle ?? "unspecified"} · Workout habit: ${(p as any).workout_habit ?? "unspecified"}
- MEAL FREQUENCY (HARD CONSTRAINT): exactly ${slots.length} meals/day — ${slotList}. Output ONLY these meal keys, no more, no fewer.
- Self-reported sleep: ${(p as any).sleep_hours ?? "?"}h · Water goal: ${(p as any).water_intake_l ?? "?"}L
- Daily targets: ${p.daily_calorie_goal} kcal · P:${p.protein_goal_g}g C:${targetCarbs}g F:${targetFat}g — match calories/protein within ±5%. ${dietRules.isKeto ? "For Keto, the ≤30g net-carb ceiling is more important than the old carb target; fat supplies the remaining calories." : "Match carbs and fat within ±5%."}
- Plan date: ${new Date().toISOString().slice(0, 10)} · rotation slot #${rotationSeed} of 7
${avoidLine}
${varietyLine}
${healthLine}


CALORIE / MACRO RULES (already applied in the targets above — reproduce them faithfully)
- Fat Loss → TDEE −20 to −25%   |  Weight Loss → TDEE −10 to −20%
- Maintenance → TDEE            |  Recomp → TDEE ±5%
- Lean Muscle Gain → TDEE +5 to +15%  |  Bulking → TDEE +15 to +20%
- Protein 1.6–2.4 g/kg · Fat 0.6–1.0 g/kg · remaining kcal → carbs
- NEVER use BMI as the calorie driver — BMI only informs food-quality guidance (e.g. obese/overweight → more fiber, low-GI; underweight → calorie-dense).

MICRONUTRIENT & DEFICIENCY RULES (CRITICAL)
- Reference RDAs (adult): Vitamin B12 2.4 mcg · Vitamin D3 600–800 IU (15–20 mcg) · Iron 8–18 mg · Calcium 1000 mg · Magnesium 310–420 mg · Zinc 8–11 mg · Omega-3 (EPA+DHA) 250–500 mg · Fiber ≥25 g · Vitamin C 75–90 mg.
- Bias meals HEAVILY toward foods that fix each listed deficiency:
  * B12 → choose only diet-compliant options from eggs, dairy, fish, fortified plant milk or nutritional yeast
  * D3 → fatty fish, egg yolk, mushrooms sun-exposed, fortified milk + sunlight tip
  * Iron → choose only diet-compliant options from meat, spinach, tofu, pumpkin/sesame seeds and low-carb vitamin-C vegetables; avoid tea/coffee with meals
  * Calcium → choose only diet-compliant options from dairy, sesame, tofu and leafy greens
  * Magnesium → pumpkin seeds, almonds, cashews, unsweetened dark chocolate and diet-compliant greens
  * Zinc → pumpkin seeds, cashews and diet-compliant protein sources
  * Omega-3 → salmon, sardines, mackerel, flaxseed, chia, walnuts (add algal-oil note for vegans)
- Every meal must list a "micronutrients" object with realistic numeric estimates for the units below.
- Daily plan must meet ≥80% of each listed deficiency's RDA across meals + snacks.

MEAL / PERSONALIZATION RULES
- Use AUTHENTIC region/cuisine dishes by name, adapted without violating the DIET SAFETY GATE. Prioritize whole foods from today's allowed pools. Avoid ultra-processed items, packaged cereals, and protein-bar-only "meals".
- Meal count is FIXED at ${slots.length} (${slotList}). Never add extra meals; distribute the FULL daily calorie/macro target across only these ${slots.length} meals (scale each meal up proportionally when there are fewer meals). If a slot below is not in this list, ignore its guidance entirely.
- REALISTIC CALORIE DISTRIBUTION (must be followed — do NOT front-load the day):
  * Breakfast: 20–25% of daily kcal — LIGHT, healthy and balanced, easy to digest, NEVER heavy or the largest meal. ${dietRules.isKeto ? "Keto choices only: paneer/tofu or egg bhurji when allowed, avocado-nut bowl, chia pudding with unsweetened allowed milk, low-carb vegetable omelette/tofu scramble, or bullet coffee alongside a protein-rich item." : "Choose from oats, poha, muesli, fruits & yogurt, vegetable upma, moong dal chilla, idli-sambar, sprouts chaat, paneer/tofu sandwich, or egg sandwich/bhurji."}
  * Mid-morning snack (optional, ~5%): fruit, buttermilk, nuts.
  * Lunch: 30–35% — the LARGEST meal of the day. ${dietRules.isKeto ? "Build a keto thali from an allowed protein, two low-carb vegetables, salad, and measured healthy fat; use cauliflower rice or an allowed low-carb base if needed." : "Use a full thali style with roti/rice, dal, sabzi, salad, curd and an allowed protein."}
  * Afternoon snack: 5–10% — sprouts, chana chaat, fruit + nuts, roasted makhana, Greek yogurt.
  * Dinner: 20–25% — MODERATE and lighter than lunch, finish 2–3h before sleep. Prefer soup + roti + sabzi + dal, khichdi + curd, grilled protein + veg. Low refined carbs at night.
  * Pre-workout (if training): ~5–8%, 30–45 min before — ${dietRules.isKeto ? "keto-safe fuel such as coffee with measured fat, a few nuts, egg, paneer or tofu; no carb loading." : "quick carbs plus a small allowed protein."}
  * Post-workout (if training): ~10%, within 30–45 min — ${dietRules.isKeto ? "an allowed fast protein with low-carb vegetables and measured fat; no rice, roti, fruit or sugary shake." : "an allowed fast protein plus carbohydrates."}
- PROTEIN FLOOR: every MAIN meal (breakfast, lunch, dinner) MUST contain 25–40 g protein. Post-workout ≥ 20 g. If vegetarian, combine dal + curd + paneer / soy / sprouts to hit the floor — do NOT ship a main meal under 25 g protein.
- Sustainability: meals must be practical for long-term adherence — familiar Indian formats, one-pot options for busy days, batch-cookable dals/sabzi, minimal exotic ingredients.
- Cover daily micronutrient needs using only diet-compliant foods; the selected diet always outranks generic RDA examples.
- Hydration: recommend water intake in liters (35 ml/kg body weight, adjust up for active users). User's goal is ${(p as any).water_intake_l ?? "auto"}L.
- Sleep-aware: if sleep <6h (self-reported ${(p as any).sleep_hours ?? "?"}h, tracked avg min: ${sleepAvgMin}), reduce caffeine after noon and use diet-compliant magnesium/tryptophan sources.
- Budget-aware: for "${(p as any).budget ?? "medium"}" budget — low → lentils/eggs/seasonal veg/local grains; medium → add lean meats, dairy, seasonal fruits; high → salmon, berries, quinoa, whey/creatine ok.
- Lifestyle-aware: ${(p as any).lifestyle ?? "generic"} — desk-job: lighter carbs midday, more protein+fiber; field-work/labor: bigger complex-carb lunch; student: quick 5-min prep options.
- Workout habit: ${(p as any).workout_habit ?? "unspecified"} — include pre & post workout meals for muscle_gain/bulking/recomp/fat_loss trainees; skip for sedentary.
- Shakes / drinks tuned to goal:
  * muscle_gain / bulking / underweight → ${dietRules.isKeto ? "keto shakes only: unsweetened allowed milk, nut butter, chia/flax, allowed protein powder, avocado or coconut; no fruit, dates, oats or sugar." : "nutritious high-calorie shakes using fruit, oats, milk/curd, nuts and optional whey when diet-compliant."}
  * weight_loss / fat_loss → LIGHT low-calorie drinks: warm lemon water, jeera (cumin) water, mint-lemon water, cinnamon water, unsweetened green tea, plain buttermilk. Describe these ONLY as low-calorie, hydrating, appetite-supporting or digestion-friendly — NEVER claim any drink burns fat or melts fat; fat loss comes from the overall calorie deficit.
  * maintenance / recomp → balanced protein smoothies
  * diabetic-friendly → unsweetened, low-GI only
- Provide PORTION guidance (grams, katori, pieces, cups) for EVERY item.
- Never include allergens. Respect medical conditions and diet preference strictly.
- VARIETY IS CRITICAL: every meal MUST be DIFFERENT from the AVOID list.
- SELF-CHECK before returning: "meals" contains EXACTLY these ${slots.length} keys (${slots.join(", ")}), sum(meal calories) ≈ daily_targets.calories (±5%), breakfast ≤ 25% of daily kcal (if present), lunch ≥ dinner kcal, each main meal ≥ 25 g protein.${dietRules.isKeto ? " Confirm every ingredient is keto-safe and daily net carbs are ≤30g." : ""} If any check fails, revise before emitting JSON.



Return ONLY this JSON (no markdown). EVERY meal MUST include the "micronutrients" object.
{
  "summary": "1-2 sentence coach summary referencing BMI, goal, cuisine & any deficiencies being corrected",
  "bmi": ${bmi},
  "bmi_category": "${bmiCat}",
  "region": "${region}",
  "cuisine": "${cuisine}",
  "daily_targets": { "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0, "water_l": 0 },
  "micronutrient_targets": { "b12_mcg": 2.4, "vitamin_d_iu": 800, "iron_mg": 15, "calcium_mg": 1000, "magnesium_mg": 400, "zinc_mg": 10, "omega3_mg": 500, "vitamin_c_mg": 90 },
  "deficiency_focus": ["list of deficiencies this plan targets"],
  "meals": ${mealsSchema},
  "shakes": [
    { "name": "", "ingredients": "", "calories": 0, "protein_g": 0, "when": "morning|pre|post|evening" }
  ],
  "tips": ["3-5 short, goal & cuisine specific tips — call out any deficiency being addressed"],
  "workout": [
    { "day": "Mon", "focus": "Push", "exercises": [{ "name": "Bench Press", "sets": 4, "reps": "8-10" }] }
  ]
}`;
    let text = await callGeminiJson({
      system: "You are a certified nutrition and fitness coach. Output only valid JSON, no markdown.",
      user: prompt,
      model: "gemini-2.5-flash-lite",
    });
    let plan: any;
    try { plan = JSON.parse(text); } catch { throw new Error("Plan parse failed"); }

    // Enforce meal frequency regardless of what the model returned
    plan.meals = pruneMealsToSlots(plan?.meals, slots);
    plan.meal_slots = slots;
    plan.meal_frequency = slots.length;

    let violations = findDietViolations(plan, dietRules, slots);
    if (violations.length) {
      text = await callGeminiJson({
        system: "You are a strict nutrition safety validator. Output only corrected valid JSON, no markdown.",
        user: `${prompt}\n\nThe prior response failed validation: ${violations.join("; ")}. Regenerate the entire plan and correct every failure.`,
        model: "gemini-2.5-flash-lite",
      });
      try { plan = JSON.parse(text); } catch { throw new Error("Corrected plan parse failed"); }
      plan.meals = pruneMealsToSlots(plan?.meals, slots);
      plan.meal_slots = slots;
      plan.meal_frequency = slots.length;
      violations = findDietViolations(plan, dietRules, slots);
      if (violations.length) throw new Error(`Generated plan did not satisfy ${p.diet_preference}: ${violations.join("; ")}`);
    }



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
