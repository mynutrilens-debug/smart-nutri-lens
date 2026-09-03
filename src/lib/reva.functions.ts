import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGeminiJson } from "@/lib/ai-gemini.server";

/**
 * Reva — the conversational onboarding coach.
 * One server round-trip per user turn: the model reads the transcript plus
 * everything collected so far, extracts any new answers, and asks the next
 * question naturally (or a smart follow-up).
 */

const Turn = z.object({
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(60)
    .default([]),
  collected: z.record(z.string(), z.any()).default({}),
  /** "skip" | "repeat" | "edit:<field>" | plain user utterance */
  action: z.string().max(60).optional(),
});

export const FIELD_ORDER = [
  "display_name",
  "gender",
  "age",
  "height_cm",
  "weight_kg",
  "physique_goal",
  "activity_level",
  "diet_preference",
  "region",
  "cuisine",
  "allergies",
  "medical_conditions",
  "deficiencies",
  "lifestyle",
  "sleep_hours",
  "water_intake_l",
] as const;

const SYSTEM = `You are Reva, a warm, upbeat human-sounding personal AI fitness & nutrition coach for the app MyNutriLens.
You are running VOICE-FIRST onboarding: your reply is spoken aloud, so keep it short (max 2 short sentences, ~30 words), conversational, no markdown, no bullet lists, no emojis-heavy text (at most one emoji).

Collect these fields, ONE question at a time, in this order (skip ones already collected):
- display_name (first name)
- gender: "male" | "female"
- age: 13-100
- height_cm: number (accept feet/inches or cm, convert to cm)
- weight_kg: number (accept lbs, convert to kg)
- physique_goal: one of "weight_loss","fat_loss","muscle_gain","maintenance","recomp"
- activity_level: one of "sedentary","light","moderate","active","athlete" (infer from how they describe their week)
- diet_preference: one of "Vegetarian","Eggetarian","Non-Veg (No Beef)","Non-Veg","Vegan","High-Protein","Keto","Low-Carb","Diabetic-Friendly","Gluten-Free","Pescatarian","Jain"
- region: one of "India","Global","Middle East","East Asia","Europe","Americas"
- cuisine: only if region is India — one of "Maharashtrian","Kerala","Tamil","Rajasthani","Punjabi","Bengali","Gujarati","South Indian","North Indian","Hyderabadi","Goan"
- allergies: array of strings (empty array if none)
- medical_conditions: array of strings (empty array if none)
- deficiencies: array of strings like "Vitamin B12","Vitamin D3","Iron","Calcium","Magnesium","Zinc","Omega-3" (empty array if none / unknown)
- lifestyle: one of "Desk-job","Field-work","Student","Home-maker","Shift-work","Traveller"
- sleep_hours: number 3-12
- water_intake_l: number 0.5-8

Rules:
- Understand natural language: a single sentence may answer several fields — extract them all.
- Remember what is already collected; never re-ask a collected field unless the user asks to change it.
- If the answer is vague or out of range, ask one friendly clarifying follow-up instead of guessing wildly.
- If the user says skip / not sure / don't know for an optional field (allergies, medical_conditions, deficiencies, cuisine), set a sensible default (empty array) and move on.
- If action is "repeat", repeat your previous question in different words and set updates to {}.
- If action starts with "edit:", ask again for that specific field and set updates to {}.
- Occasionally (not every turn) add a one-line encouraging coach insight tied to their answer.
- When every required field is collected, set done=true and give a short excited hand-off line about building their plan.

Reply ONLY with JSON:
{"reply":"spoken text","updates":{...only newly extracted fields with correct types...},"next_field":"field key or null","done":false}`;

export const revaTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Turn.parse(d))
  .handler(async ({ data }) => {
    const transcript = data.history
      .map((m) => `${m.role === "user" ? "User" : "Reva"}: ${m.content}`)
      .join("\n");

    const missing = FIELD_ORDER.filter((f) => {
      if (f === "cuisine" && data.collected.region && data.collected.region !== "India") return false;
      const v = (data.collected as any)[f];
      return v === undefined || v === null || v === "";
    });

    const user = `Already collected (JSON): ${JSON.stringify(data.collected)}
Still missing: ${missing.join(", ") || "nothing"}
Control action: ${data.action || "none"}

Conversation so far:
${transcript || "(nothing yet — greet them by introducing yourself as Reva and ask the first question)"}`;

    const raw = await callGeminiJson({ system: SYSTEM, user });

    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reply: "Sorry, I missed that — could you say it again?", updates: {}, done: false };
    }

    const updates = typeof parsed.updates === "object" && parsed.updates ? parsed.updates : {};
    const merged = { ...data.collected, ...updates };
    const stillMissing = FIELD_ORDER.filter((f) => {
      if (f === "cuisine" && merged.region && merged.region !== "India") return false;
      const v = (merged as any)[f];
      return v === undefined || v === null || v === "";
    });

    return {
      reply: String(parsed.reply || "Got it!").slice(0, 600),
      updates,
      collected: merged,
      next_field: parsed.next_field ?? stillMissing[0] ?? null,
      done: Boolean(parsed.done) && stillMissing.length === 0,
      missing: stillMissing,
    };
  });
