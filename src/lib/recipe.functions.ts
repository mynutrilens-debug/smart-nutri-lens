import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGeminiJson } from "@/lib/ai-gemini.server";

const RecipeInput = z.object({
  meal_key: z.string().min(1).max(40),
  meal_name: z.string().min(1).max(200),
  meal_items: z.string().max(600).optional().default(""),
  calories: z.number().optional().default(0),
  protein_g: z.number().optional().default(0),
  carbs_g: z.number().optional().default(0),
  fat_g: z.number().optional().default(0),
});

export const generateRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RecipeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p } = await supabase.from("profiles").select("diet_preference,region,cuisine,allergies,medical_conditions").eq("user_id", userId).single();

    const diet = (p as any)?.diet_preference || "balanced";
    const region = (p as any)?.region || "Global";
    const cuisine = (p as any)?.cuisine || "";
    const allergies = ((p as any)?.allergies ?? []) as string[];
    const meds = ((p as any)?.medical_conditions ?? []) as string[];

    const prompt = `You are a professional chef and nutrition coach. Return STRICT JSON only (no markdown).

Create an authentic, HEALTHY, easy-to-cook recipe for the meal below, matching the user's personalized diet plan.

MEAL
- Slot: ${data.meal_key}
- Name: ${data.meal_name}
- Suggested items: ${data.meal_items}
- Target macros: ${data.calories} kcal · P:${data.protein_g}g C:${data.carbs_g}g F:${data.fat_g}g

USER
- Diet preference (STRICT): ${diet}
- Region: ${region}${cuisine ? ` · Cuisine: ${cuisine}` : ""}
- Allergies (STRICTLY AVOID): ${allergies.join(", ") || "none"}
- Medical conditions: ${meds.join(", ") || "none"}

RULES
- Ingredients must include exact quantities (grams, cups, tbsp, pieces).
- Steps: 6-10 short, clear, numbered action steps a beginner can follow.
- Provide a REAL YouTube search query string that a user can paste into YouTube to find a great tutorial for this dish.
- Provide 3-5 healthy ingredient alternatives with the WHY (e.g. "Swap white rice → brown rice: +fiber, lower GI").
- Include 3-4 chef tips.
- Prep time and cook time in minutes (integers).
- Servings default 1 (single portion for the user).

Return ONLY this JSON:
{
  "title": "dish name",
  "cuisine": "e.g. South Indian / Mediterranean",
  "servings": 1,
  "prep_min": 0,
  "cook_min": 0,
  "total_min": 0,
  "difficulty": "easy|medium|hard",
  "calories": ${data.calories},
  "macros": { "protein_g": ${data.protein_g}, "carbs_g": ${data.carbs_g}, "fat_g": ${data.fat_g} },
  "youtube_query": "best {dish} recipe tutorial",
  "ingredients": [ { "item": "", "qty": "", "note": "" } ],
  "equipment": ["pan", "..."],
  "steps": ["Step 1 ...", "Step 2 ..."],
  "alternatives": [ { "swap": "white rice → brown rice", "why": "lower GI, +fiber" } ],
  "tips": ["short chef tip"],
  "nutrition_notes": "1 short line tying dish back to the user's goal"
}`;

    const text = await callGeminiJson({
      system: "You are a professional chef and nutritionist. Output only valid JSON, no markdown.",
      user: prompt,
      model: "gemini-2.5-flash-lite",
    });
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Recipe parse failed. Please try again.");
    }
  });
