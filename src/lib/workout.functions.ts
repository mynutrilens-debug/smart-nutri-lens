import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  equipment: z.enum(["none", "home", "gym"]).default("home"),
  injuries: z.array(z.string().max(60)).max(10).default([]),
});

export const generateAiWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AiWorkoutInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    if (!p) throw new Error("Profile not found");


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

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an elite strength coach. Output only valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limit reached on AI gateway. Please wait a moment and try again.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
      if (res.status === 403) throw new Error("AI gateway access denied (403). The LOVABLE_API_KEY may be missing scope or the model is unavailable for this workspace.");
      throw new Error(`AI error ${res.status}: ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as any;
    let text: string = json?.choices?.[0]?.message?.content ?? "{}";
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    let plan: any;
    try { plan = JSON.parse(text); } catch { throw new Error("Workout plan parse failed"); }

    const merged = { ...((p as any).ai_plan ?? {}), workout_plan: { ...plan, generated_at: new Date().toISOString(), inputs: data } };
    await supabase.from("profiles").update({ ai_plan: merged }).eq("user_id", userId);
    return plan;
  });
