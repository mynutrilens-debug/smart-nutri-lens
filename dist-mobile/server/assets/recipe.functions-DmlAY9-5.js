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
const RecipeInput = z.object({
  meal_key: z.string().min(1).max(40),
  meal_name: z.string().min(1).max(200),
  meal_items: z.string().max(600).optional().default(""),
  calories: z.number().optional().default(0),
  protein_g: z.number().optional().default(0),
  carbs_g: z.number().optional().default(0),
  fat_g: z.number().optional().default(0)
});
const generateRecipe_createServerFn_handler = createServerRpc({
  id: "5b5777832605e1f58e39b65dfba8f6a1334f48df5cf5b856eacc8845123ac28f",
  name: "generateRecipe",
  filename: "src/lib/recipe.functions.ts"
}, (opts) => generateRecipe.__executeServer(opts));
const generateRecipe = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => RecipeInput.parse(d)).handler(generateRecipe_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: p
  } = await supabase.from("profiles").select("diet_preference,region,cuisine,allergies,medical_conditions").eq("user_id", userId).single();
  const diet = p?.diet_preference || "balanced";
  const region = p?.region || "Global";
  const cuisine = p?.cuisine || "";
  const allergies = p?.allergies ?? [];
  const meds = p?.medical_conditions ?? [];
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
    model: "gemini-2.5-flash-lite"
  });
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Recipe parse failed. Please try again.");
  }
});
export {
  generateRecipe_createServerFn_handler
};
