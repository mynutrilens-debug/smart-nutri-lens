// ─────────────────────────────────────────────────────────────
// MyNutriLens — CENTRALIZED nutrition & activity engine.
// Single source of truth used by onboarding, dashboard, diet,
// workout and the chatbot. Never use fixed values by gender/BMI.
//
// Pipeline:  BMR (Mifflin-St Jeor) → TDEE (activity factor) → Goal
//   Male   BMR = (10×kg) + (6.25×cm) − (5×age) + 5
//   Female BMR = (10×kg) + (6.25×cm) − (5×age) − 161
//   TDEE   = BMR × {1.20, 1.375, 1.55, 1.725, 1.90}
//   Fat loss / obese      → TDEE −10..20%
//   Maintenance / recomp  → TDEE
//   Underweight / gain    → TDEE +10..15%
// Protein 1.6–2.0 g/kg (target/ideal weight when obese, current weight
// when underweight), fat 25–35% of calories, carbs = remainder.
// Macros are reconciled so they match calories within ±5%.
// Browser-safe: pure functions only, no server imports.
// ─────────────────────────────────────────────────────────────

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type PhysiqueGoal =
  | "fat_loss"
  | "weight_loss"
  | "maintenance"
  | "recomp"
  | "muscle_gain"
  | "bulking";

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export interface NutritionInput {
  gender: Gender;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  physique_goal: PhysiqueGoal;
  /** User-chosen goal weight; used as the protein basis for overweight/obese users. */
  target_weight_kg?: number | null;
}

export interface ActivityPlan {
  steps_per_day: string;
  strength_sessions_per_week: string;
  cardio_minutes_per_week: string;
  notes: string[];
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  activity_factor: number;
  calorie_adjustment_pct: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  protein_basis_kg: number;
  protein_per_kg: number;
  fat_pct_of_calories: number;
  macro_calories: number;
  macro_variance_pct: number;
  bmi: number;
  bmi_category: "underweight" | "normal" | "overweight" | "obese";
  ideal_weight_kg: number;
  body_fat_pct: number;
  muscle_mass_pct: number;
  activity_plan: ActivityPlan;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function bmiCategoryOf(bmi: number): NutritionTargets["bmi_category"] {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

/** Healthy reference weight at BMI 22.5 for the user's height. */
export function idealWeightKg(height_cm: number): number {
  const m = height_cm / 100;
  return Math.round(22.5 * m * m * 10) / 10;
}

function calorieAdjustment(goal: PhysiqueGoal, cat: NutritionTargets["bmi_category"]): number {
  // Deficit / surplus as a fraction of TDEE.
  if (goal === "fat_loss") return cat === "obese" ? -0.2 : -0.175;
  if (goal === "weight_loss") return cat === "obese" ? -0.18 : -0.15;
  if (goal === "muscle_gain") return cat === "underweight" ? 0.15 : 0.1;
  if (goal === "bulking") return cat === "underweight" ? 0.15 : 0.125;
  // maintenance + recomp sit at TDEE
  return 0;
}

function activityPlanFor(goal: PhysiqueGoal, cat: NutritionTargets["bmi_category"]): ActivityPlan {
  const losing = goal === "fat_loss" || goal === "weight_loss" || cat === "obese" || cat === "overweight";
  const gaining = goal === "muscle_gain" || goal === "bulking" || cat === "underweight";

  if (gaining && !losing) {
    return {
      steps_per_day: "6,000–8,000 steps",
      strength_sessions_per_week: "3–5 strength sessions",
      cardio_minutes_per_week: "60–90 min light cardio (avoid excessive cardio)",
      notes: [
        "Prioritise progressive-overload strength work 3–5×/week.",
        "Keep cardio light and short so it doesn't eat into the surplus.",
        "Eat to the daily target every day — do not eat back exercise calories.",
      ],
    };
  }
  if (losing) {
    return {
      steps_per_day: "7,000–10,000 steps",
      strength_sessions_per_week: "3–4 strength sessions",
      cardio_minutes_per_week: "150–300 min moderate cardio",
      notes: [
        "Daily steps are the main non-training calorie lever.",
        "Strength training 3–4×/week protects lean mass in a deficit.",
        "Calories stay fixed — never eat back calories burned in training.",
      ],
    };
  }
  return {
    steps_per_day: "8,000–10,000 steps",
    strength_sessions_per_week: "3–4 strength sessions",
    cardio_minutes_per_week: "150 min moderate cardio",
    notes: [
      "Maintain steps and strength volume week to week.",
      "Calories stay fixed — never eat back calories burned in training.",
    ],
  };
}

export function computeNutritionTargets(input: NutritionInput): NutritionTargets {
  const weight = input.weight_kg;
  const height = input.height_cm;
  const age = input.age;

  const bmr =
    input.gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const factor = ACTIVITY_FACTORS[input.activity_level] ?? 1.55;
  const tdee = bmr * factor;

  const bmi = weight / Math.pow(height / 100, 2);
  const cat = bmiCategoryOf(bmi);
  const ideal = idealWeightKg(height);

  const adj = calorieAdjustment(input.physique_goal, cat);
  let calories = Math.round(tdee * (1 + adj));
  // Safety floor: never below BMR × 1.05 or 1200 kcal.
  calories = Math.max(1200, Math.round(Math.max(calories, bmr * 1.05)));

  // Protein basis: goal/ideal weight for overweight & obese, current weight otherwise.
  const goalWeight = input.target_weight_kg && input.target_weight_kg > 0 ? input.target_weight_kg : ideal;
  const proteinBasis =
    cat === "obese" || cat === "overweight" ? clamp(goalWeight, ideal * 0.85, weight) : weight;

  const proteinPerKg = clamp(
    input.physique_goal === "fat_loss" || input.physique_goal === "recomp"
      ? 2.0
      : input.physique_goal === "weight_loss" || input.physique_goal === "muscle_gain"
        ? 1.9
        : 1.7,
    1.6,
    2.0,
  );
  let protein = Math.round(proteinBasis * proteinPerKg);

  // Fat 25–35% of calories.
  const fatPct =
    input.physique_goal === "fat_loss" || input.physique_goal === "weight_loss"
      ? 0.27
      : input.physique_goal === "bulking"
        ? 0.3
        : 0.28;
  let fat = Math.round((calories * fatPct) / 9);

  // Carbs = remaining calories.
  let carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  // Reconcile: if carbs would go too low, trim fat first (min 25%), then protein (min 1.6 g/kg).
  const minFat = Math.round((calories * 0.25) / 9);
  const minProtein = Math.round(proteinBasis * 1.6);
  if (carbs < 60) {
    const deficitKcal = (60 - carbs) * 4;
    const fatCut = Math.min(fat - minFat, Math.round(deficitKcal / 9));
    if (fatCut > 0) fat -= fatCut;
    carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  }
  if (carbs < 60) {
    const deficitKcal = (60 - carbs) * 4;
    const proteinCut = Math.min(protein - minProtein, Math.round(deficitKcal / 4));
    if (proteinCut > 0) protein -= proteinCut;
    carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  }
  carbs = Math.max(50, carbs);

  // Final ±5% reconciliation — nudge carbs so macro kcal match target kcal.
  let macroCals = protein * 4 + carbs * 4 + fat * 9;
  const drift = macroCals - calories;
  if (Math.abs(drift) > calories * 0.02) {
    const shift = Math.round(drift / 4);
    carbs = Math.max(50, carbs - shift);
    macroCals = protein * 4 + carbs * 4 + fat * 9;
  }
  const variance = ((macroCals - calories) / calories) * 100;

  const bodyFat =
    input.gender === "male" ? 1.2 * bmi + 0.23 * age - 16.2 : 1.2 * bmi + 0.23 * age - 5.4;
  const bodyFatPct = Number(clamp(bodyFat, 5, 45).toFixed(1));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    activity_factor: factor,
    calorie_adjustment_pct: Math.round(adj * 1000) / 10,
    calories,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
    protein_basis_kg: Number(proteinBasis.toFixed(1)),
    protein_per_kg: Number((protein / proteinBasis).toFixed(2)),
    fat_pct_of_calories: Math.round(((fat * 9) / calories) * 100),
    macro_calories: macroCals,
    macro_variance_pct: Number(variance.toFixed(1)),
    bmi: Number(bmi.toFixed(1)),
    bmi_category: cat,
    ideal_weight_kg: ideal,
    body_fat_pct: bodyFatPct,
    muscle_mass_pct: Number(
      (input.gender === "male" ? 45 - bodyFatPct * 0.3 : 38 - bodyFatPct * 0.3).toFixed(1),
    ),
    activity_plan: activityPlanFor(input.physique_goal, cat),
  };
}

/** Convenience wrapper for a raw `profiles` row (loose typing). */
export function targetsFromProfile(p: {
  gender?: string | null;
  age?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  activity_level?: string | null;
  physique_goal?: string | null;
  target_weight_kg?: number | null;
} | null | undefined): NutritionTargets | null {
  if (!p?.height_cm || !p?.weight_kg || !p?.age) return null;
  return computeNutritionTargets({
    gender: (p.gender === "female" ? "female" : "male") as Gender,
    age: Number(p.age),
    height_cm: Number(p.height_cm),
    weight_kg: Number(p.weight_kg),
    activity_level: (p.activity_level as ActivityLevel) ?? "moderate",
    physique_goal: (p.physique_goal as PhysiqueGoal) ?? "maintenance",
    target_weight_kg: p.target_weight_kg ?? null,
  });
}
