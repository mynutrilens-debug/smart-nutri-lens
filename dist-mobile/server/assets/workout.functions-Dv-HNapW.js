import { c as createServerRpc } from "./createServerRpc-S7gwSw9F.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as callGeminiJson } from "./ai-gemini.server-ClP6u0nz.js";
import { c as createServerFn } from "./server-BadC42R4.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const WorkoutInput = z.object({
  name: z.string().min(1).max(200),
  workout_type: z.enum(["strength", "cardio", "hiit", "yoga", "mobility", "sports"]),
  duration_min: z.number().int().min(1).max(600),
  calories_burned: z.number().int().min(0).max(5e3),
  notes: z.string().max(500).optional().nullable()
});
const logWorkout_createServerFn_handler = createServerRpc({
  id: "02106d74a2575cdb313df5019a899445f85a71d2a7176619d356ec884c557336",
  name: "logWorkout",
  filename: "src/lib/workout.functions.ts"
}, (opts) => logWorkout.__executeServer(opts));
const logWorkout = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => WorkoutInput.parse(d)).handler(logWorkout_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error,
    data: row
  } = await supabase.from("workouts").insert({
    user_id: userId,
    ...data
  }).select().single();
  if (error) throw new Error(error.message);
  return row;
});
const listWorkouts_createServerFn_handler = createServerRpc({
  id: "e81756c823a6d03e9863f712a167e21ca33d07cfdd93dcc5fb3c89e8ab38fd9f",
  name: "listWorkouts",
  filename: "src/lib/workout.functions.ts"
}, (opts) => listWorkouts.__executeServer(opts));
const listWorkouts = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listWorkouts_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data,
    error
  } = await supabase.from("workouts").select("*").eq("user_id", userId).order("logged_at", {
    ascending: false
  }).limit(120);
  if (error) throw new Error(error.message);
  return data ?? [];
});
const deleteWorkout_createServerFn_handler = createServerRpc({
  id: "e0d226af4d789c8ed8c045a510dc1cabb3db077a904e851c6c7dac5b8549ba10",
  name: "deleteWorkout",
  filename: "src/lib/workout.functions.ts"
}, (opts) => deleteWorkout.__executeServer(opts));
const deleteWorkout = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(deleteWorkout_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("workouts").delete().eq("id", data.id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const AiWorkoutInput = z.object({
  level: z.enum(["beginner", "intermediate", "pro"]).default("beginner"),
  equipment: z.enum(["none", "home", "gym"]).default("home"),
  injuries: z.array(z.string().max(60)).max(10).default([])
});
const generateAiWorkout_createServerFn_handler = createServerRpc({
  id: "0b6872f1789c0609adf497bd13675027426210fbeda2f47c5e529963c41004d7",
  name: "generateAiWorkout",
  filename: "src/lib/workout.functions.ts"
}, (opts) => generateAiWorkout.__executeServer(opts));
const generateAiWorkout = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => AiWorkoutInput.parse(d)).handler(generateAiWorkout_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: p
  } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
  if (!p) throw new Error("Profile not found");
  const cachedPlan = p.ai_plan?.workout_plan;
  const cachedAt = cachedPlan?.generated_at ? new Date(cachedPlan.generated_at) : null;
  if (cachedPlan && cachedAt && Date.now() - cachedAt.getTime() < 7 * 864e5) {
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
- Equipment: ${data.equipment} (none = bodyweight only; home = dumbbells/bands; gym = full access)
- Injuries / limits (AVOID aggravating): ${data.injuries.join(", ") || "none"}
- Medical: ${(p.medical_conditions ?? []).join(", ") || "none"}

RULES
- Match split to goal: muscle_gain → PPL or U/L hypertrophy; fat_loss/weight_loss → full-body + HIIT + cardio; maintenance/recomp → balanced split; underweight → strength bias.
- Beginner: simpler compound lifts, lower volume. Pro: advanced techniques (drop sets, tempo, supersets).
- 1-2 rest/active-recovery days.
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
    model: "gemini-2.5-flash-lite"
  });
  let plan;
  try {
    plan = JSON.parse(text);
  } catch {
    throw new Error("Workout plan parse failed");
  }
  const merged = {
    ...p.ai_plan ?? {},
    workout_plan: {
      ...plan,
      generated_at: (/* @__PURE__ */ new Date()).toISOString(),
      inputs: data
    }
  };
  await supabase.from("profiles").update({
    ai_plan: merged
  }).eq("user_id", userId);
  return plan;
});
export {
  deleteWorkout_createServerFn_handler,
  generateAiWorkout_createServerFn_handler,
  listWorkouts_createServerFn_handler,
  logWorkout_createServerFn_handler
};
