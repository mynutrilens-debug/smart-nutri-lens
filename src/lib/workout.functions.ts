import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGeminiJson } from "@/lib/ai-gemini.server";

const WorkoutInput = z.object({
  name: z.string().min(1).max(200),
  workout_type: z.enum(["strength", "cardio", "hiit", "yoga", "mobility", "sports"]),
  duration_min: z.number().int().min(1).max(600),
  calories_burned: z.number().int().min(0).max(5000),
  notes: z.string().max(500).optional().nullable(),
});

export const logWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => WorkoutInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error, data: row } = await supabase.from("workouts").insert({ user_id: userId, ...data }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listWorkouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("workouts").select("*").eq("user_id", userId).order("logged_at", { ascending: false }).limit(120);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("workouts").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const AiWorkoutInput = z.object({
  level: z.enum(["beginner", "intermediate", "pro"]).default("beginner"),
  location: z.enum(["home", "gym"]).default("home"),
  hasEquipment: z.boolean().default(true),
  injuries: z.array(z.string().max(60)).max(10).default([]),
  force: z.boolean().default(false),
});

// Human-readable gear constraint for the prompt, strictly derived from prefs.
function gearBrief(location: "home" | "gym", hasEquipment: boolean) {
  if (location === "gym") {
    return hasEquipment
      ? "FULL GYM: barbells, dumbbells, cables, machines, smith rack, benches, treadmill/rower. Prescribe gym-specific lifts (barbell squat, bench press, lat pulldown, cable rows, leg press, hack squat)."
      : "GYM FLOOR, NO EQUIPMENT: only open floor space and bodyweight. No machines, no barbells, no dumbbells.";
  }
  return hasEquipment
    ? "HOME WITH BASIC GEAR ONLY: resistance bands, jump rope, towel, chair/sofa, backpack loaded with books, water bottles/cans, wall, floor mat, stairs. NEVER prescribe barbells, machines, cables, benches or dumbbell-only lifts — substitute with band/backpack/towel variations."
    : "HOME, ZERO EQUIPMENT: pure bodyweight only (push-ups, squats, lunges, planks, glute bridges, burpees, wall sits, chair dips). No bands, no rope, no weights of any kind.";
}

// Signature of the key inputs that should invalidate a cached weekly plan.
function planSignature(p: any, data: { level: string; location: string; hasEquipment: boolean; injuries: string[] }) {
  return [
    data.level,
    data.location,
    data.hasEquipment ? "gear" : "nogear",
    [...data.injuries].sort().join("|"),
    p.gender ?? "",
    p.age ?? "",
    p.height_cm ?? "",
    Math.round(Number(p.weight_kg ?? 0)),
    p.physique_goal ?? "",
    p.activity_level ?? "",
    (p.medical_conditions ?? []).join("|"),
  ].join("~");
}


export const generateAiWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AiWorkoutInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    if (!p) throw new Error("Profile not found");

    // 7-day cache: reuse the existing weekly plan until the cycle completes or
    // the user's key inputs change. Prevents daily regeneration and token burn.
    const cachedPlan = (p as any).ai_plan?.workout_plan;
    const cachedAt = cachedPlan?.generated_at ? new Date(cachedPlan.generated_at) : null;
    const signature = planSignature(p, data);
    const fresh = !!(cachedAt && Date.now() - cachedAt.getTime() < 7 * 86400000);
    const sameInputs = !cachedPlan?.signature || cachedPlan.signature === signature;
    if (!data.force && cachedPlan && fresh && sameInputs) {
      return cachedPlan;
    }





    const heightM = (p.height_cm ?? 170) / 100;
    const bmi = Number(((p.weight_kg ?? 70) / (heightM * heightM)).toFixed(1));
    const bmiCat = bmi < 18.5 ? "underweight" : bmi < 25 ? "normal" : bmi < 30 ? "overweight" : "obese";

    const prompt = `You are an elite certified strength & conditioning coach. Build a PERSONALIZED 7-day workout split. Return STRICT JSON only (no markdown).

USER
- Gender: ${p.gender}, Age: ${p.age}
- Height: ${p.height_cm}cm, Weight: ${p.weight_kg}kg, BMI: ${bmi} (${bmiCat})
- Goal: ${p.physique_goal}, Activity: ${p.activity_level}
- Level: ${data.level}
- Training location: ${data.location.toUpperCase()} | Equipment available: ${data.hasEquipment ? "YES" : "NO"}
- ALLOWED EQUIPMENT (STRICT): ${gearBrief(data.location, data.hasEquipment)}
- Injuries / limits (AVOID aggravating): ${data.injuries.join(", ") || "none"}
- Medical: ${(p.medical_conditions ?? []).join(", ") || "none"}

RULES
- EVERY exercise must be performable with ONLY the allowed equipment above. If unsure, choose a safer allowed alternative. Never mention gear outside the allowed list.
- Match split to goal: muscle_gain → PPL or U/L hypertrophy; fat_loss/weight_loss → full-body + HIIT + cardio; maintenance/recomp → balanced split; underweight → strength bias.
- Beginner: simpler compound lifts, lower volume. Pro: advanced techniques (drop sets, tempo, supersets).
- 1-2 rest/active-recovery days.
- For bodyweight/band work, express load via reps, tempo, or band tension in the tip.
- Calorie burn estimates realistic for body weight.


Return ONLY this JSON:
{
  "summary": "1 sentence coach summary tying BMI + goal + level",
  "split_name": "e.g. Push-Pull-Legs Hypertrophy",
  "level": "${data.level}",
  "weekly_minutes": 0,
  "weekly_calories": 0,
  "days": [
    {
      "day": "Mon",
      "focus": "Push (Chest/Shoulders/Triceps)",
      "muscle_group": "chest|back|legs|shoulders|arms|core|full_body|cardio|rest",
      "workout_type": "strength|cardio|hiit|yoga|mobility|sports|rest",
      "difficulty": "easy|moderate|hard",
      "duration_min": 0,
      "calories": 0,
      "exercises": [
        { "name": "Bench Press", "sets": 4, "reps": "8-10", "rest_sec": 90, "tip": "short cue" }
      ]
    }
  ],
  "tips": ["3-4 short coaching tips"]
}`;
    const text = await callGeminiJson({
      system: "You are an elite strength coach. Output only valid JSON, no markdown.",
      user: prompt,
      model: "gemini-2.5-flash-lite",
    });
    let plan: any;
    try { plan = JSON.parse(text); } catch { throw new Error("Workout plan parse failed"); }

    const now = new Date();
    const saved = {
      ...plan,
      generated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 7 * 86400000).toISOString(),
      signature,
      inputs: { level: data.level, equipment: data.equipment, injuries: data.injuries },
    };
    const merged = { ...((p as any).ai_plan ?? {}), workout_plan: saved };
    await supabase.from("profiles").update({ ai_plan: merged }).eq("user_id", userId);
    return saved;

  });
