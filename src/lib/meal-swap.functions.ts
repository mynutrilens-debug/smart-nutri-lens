import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callGeminiJson } from "@/lib/ai-gemini.server";

const SwapInput = z.object({
  meal_key: z.enum(["breakfast", "lunch", "dinner", "snack", "pre_workout", "post_workout"]),
  avoid: z.array(z.string().max(120)).max(20).default([]),
});

export const swapMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SwapInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    if (!p) throw new Error("Profile not found");
    const plan: any = (p as any).ai_plan;
    if (!plan?.meals?.[data.meal_key]) throw new Error("No meal to swap");

    const current = plan.meals[data.meal_key];
    const region = (p as any).region || "Global";
    const cuisine = (p as any).cuisine || "";
    const diet = String(p.diet_preference || "");
    const isIndia = String(region).toLowerCase() === "india";

    const _diet = diet.toLowerCase();
    const _isVegan = _diet.includes("vegan");
    const _isVeg = _isVegan || _diet.includes("vegetarian");
    const _noBeef = _diet.includes("no beef") || _isVeg;

    const proteinPool = _isVegan
      ? ["tofu", "tempeh", "chana", "rajma", "moong dal", "masoor dal", "urad dal", "soya chunks", "peanuts", "sprouts"]
      : _isVeg
        ? ["paneer", "curd", "eggs", "chana", "rajma", "moong dal", "toor dal", "soya chunks", "sprouts", "besan"]
        : _noBeef
          ? ["chicken breast", "eggs", "fish", "prawns", "paneer", "curd", "chana", "moong dal", "soya chunks"]
          : ["chicken", "eggs", "fish", "prawns", "lean beef", "paneer", "curd", "chana", "moong dal"];
    const grainPool = isIndia
      ? ["basmati rice", "brown rice", "whole-wheat roti", "bajra bhakri", "jowar bhakri", "ragi roti", "millet khichdi", "oats", "poha", "daliya"]
      : ["rice", "quinoa", "oats", "whole-wheat bread", "millet", "barley"];
    const vegPool = isIndia
      ? ["palak", "methi", "bhindi", "baingan", "lauki", "cauliflower", "cabbage", "beans", "carrot", "capsicum", "mixed sabzi", "drumstick"]
      : ["spinach", "broccoli", "zucchini", "bell pepper", "carrot", "cauliflower", "green beans", "kale"];

    const avoidList = [current?.name, ...(data.avoid ?? [])].filter(Boolean).join(", ");
    const cur = {
      calories: Math.round(Number(current.calories ?? 0)),
      protein_g: Math.round(Number(current.protein_g ?? 0)),
      carbs_g: Math.round(Number(current.carbs_g ?? 0)),
      fat_g: Math.round(Number(current.fat_g ?? 0)),
      fiber_g: Math.round(Number(current.fiber_g ?? 0)),
      micronutrients: current.micronutrients ?? {},
    };

    const prompt = `You are a nutrition coach. Produce ONE alternative ${data.meal_key.replace("_", " ")} that MATCHES the target nutrition below within tight tolerances. Return STRICT JSON only.

USER CONTEXT
- Diet preference (STRICT): ${diet}
- Region: ${region}${cuisine ? ` · Cuisine: ${cuisine}` : ""}
- Allergies (STRICTLY AVOID): ${(p.allergies ?? []).join(", ") || "none"}
- Medical conditions: ${(p.medical_conditions ?? []).join(", ") || "none"}
- Deficiencies to still address: ${((p as any).deficiencies ?? []).join(", ") || "none"}
- Budget: ${(p as any).budget ?? "medium"}

CURRENT MEAL BEING REPLACED (must AVOID this and any close variant): "${current?.name ?? ""}" — ${current?.items ?? ""}
Also avoid: ${avoidList || "n/a"}

TARGET (MUST MATCH within ±5% for calories, ±3g for each macro, and stay within ±20% for each micronutrient):
- Calories: ${cur.calories} kcal
- Protein: ${cur.protein_g} g · Carbs: ${cur.carbs_g} g · Fat: ${cur.fat_g} g · Fiber: ${cur.fiber_g} g
- Micronutrients (approx): ${JSON.stringify(cur.micronutrients)}

VARIETY POOLS (draw from these, rotate away from the replaced meal):
- Proteins: ${proteinPool.join(", ")}
- Grains: ${grainPool.join(", ")}
- Vegetables: ${vegPool.join(", ")}

RULES
- Different primary protein AND different primary grain than the replaced meal when possible.
- Same eating occasion & realistic portion (household measures: katori, roti count, cup, grams, pieces).
- Whole foods, authentic ${isIndia ? "Indian regional" : region} dish. No ultra-processed items.
- Respect diet preference strictly. Never include an allergen.
- Return numbers only for nutrition fields (no units in values).

Return ONLY this JSON:
{
  "name": "dish name",
  "items": "ingredients with portions",
  "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0,
  ${current.timing ? `"timing": "${String(current.timing).replace(/"/g, "'")}",` : ""}
  "micronutrients": { "b12_mcg": 0, "vitamin_d_iu": 0, "iron_mg": 0, "calcium_mg": 0, "magnesium_mg": 0, "zinc_mg": 0, "omega3_mg": 0, "vitamin_c_mg": 0 },
  "swap_reason": "1 short sentence why this is an equivalent alternative"
}`;

    const text = await callGeminiJson({
      system: "You are a nutrition coach. Output only valid JSON, no markdown.",
      user: prompt,
      model: "gemini-2.5-flash-lite",
    });
    let alt: any;
    try { alt = JSON.parse(text); } catch { throw new Error("Swap parse failed"); }

    // Persist the swap into the AI plan
    const nextPlan = { ...plan, meals: { ...plan.meals, [data.meal_key]: { ...current, ...alt } } };
    await supabase.from("profiles").update({ ai_plan: nextPlan } as any).eq("user_id", userId);

    return { meal_key: data.meal_key, meal: nextPlan.meals[data.meal_key] };
  });
