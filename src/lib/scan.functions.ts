import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ScanInput = z.object({
  image_base64: z.string().min(50),
  mime_type: z.string().regex(/^image\/(jpeg|png|webp|heic|heif)$/),
  hint: z.string().max(200).optional(),
});

type Alternative = { name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number };
type Micronutrients = {
  fiber_g: number;
  b12_mcg: number;
  vitamin_d_iu: number;
  iron_mg: number;
  calcium_mg: number;
  magnesium_mg: number;
  zinc_mg: number;
  omega3_mg: number;
  vitamin_c_mg: number;
};
type Analysis = {
  name: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
  notes: string;
  alternatives: Alternative[];
  micronutrients: Micronutrients;
};

const SYSTEM = `You are a nutrition vision expert. Identify the food in the image and return realistic per-serving macronutrients AND micronutrients.
Return STRICT JSON: { "name": string, "meal_type": "breakfast"|"lunch"|"dinner"|"snack", "calories": int, "protein_g": number, "carbs_g": number, "fat_g": number, "confidence": number (0-1), "notes": string, "alternatives": [{ "name": string, "calories": int, "protein_g": number, "carbs_g": number, "fat_g": number }], "micronutrients": { "fiber_g": number, "b12_mcg": number, "vitamin_d_iu": number, "iron_mg": number, "calcium_mg": number, "magnesium_mg": number, "zinc_mg": number, "omega3_mg": number, "vitamin_c_mg": number } }.
Estimate portion based on visible cues. If ambiguous, pick the most likely common serving.
ALWAYS include 3-4 visually-similar alternative foods in "alternatives" with their own macros for the same portion size.
ALWAYS estimate realistic micronutrient values based on the food type (e.g. spinach → high iron/vitC, dairy → high calcium/B12, salmon → high vitD/omega3, nuts → high magnesium/zinc). Use 0 only when truly absent. No prose, only JSON.`;

export const analyzeFood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ScanInput.parse(d))
  .handler(async ({ data }): Promise<Analysis> => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY");

    const body = {
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{
        role: "user",
        parts: [
          { text: `Analyze this food image.${data.hint ? " Hint: " + data.hint : ""}` },
          { inline_data: { mime_type: data.mime_type, data: data.image_base64 } },
        ],
      }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gemini error ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = await res.json() as any;
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    let parsed: Analysis;
    try { parsed = JSON.parse(text); }
    catch { throw new Error("Could not parse AI response"); }
    return {
      name: String(parsed.name ?? "Unknown food"),
      meal_type: (["breakfast","lunch","dinner","snack"].includes(parsed.meal_type) ? parsed.meal_type : "snack") as Analysis["meal_type"],
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein_g: Math.max(0, Number(parsed.protein_g) || 0),
      carbs_g: Math.max(0, Number(parsed.carbs_g) || 0),
      fat_g: Math.max(0, Number(parsed.fat_g) || 0),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.6)),
      notes: String(parsed.notes ?? ""),
      alternatives: (Array.isArray(parsed.alternatives) ? parsed.alternatives : []).slice(0, 4).map((a: any) => ({
        name: String(a?.name ?? "Alternative"),
        calories: Math.max(0, Math.round(Number(a?.calories) || 0)),
        protein_g: Math.max(0, Number(a?.protein_g) || 0),
        carbs_g: Math.max(0, Number(a?.carbs_g) || 0),
        fat_g: Math.max(0, Number(a?.fat_g) || 0),
      })),
      micronutrients: {
        fiber_g: Math.max(0, Number((parsed as any).micronutrients?.fiber_g) || 0),
        b12_mcg: Math.max(0, Number((parsed as any).micronutrients?.b12_mcg) || 0),
        vitamin_d_iu: Math.max(0, Number((parsed as any).micronutrients?.vitamin_d_iu) || 0),
        iron_mg: Math.max(0, Number((parsed as any).micronutrients?.iron_mg) || 0),
        calcium_mg: Math.max(0, Number((parsed as any).micronutrients?.calcium_mg) || 0),
        magnesium_mg: Math.max(0, Number((parsed as any).micronutrients?.magnesium_mg) || 0),
        zinc_mg: Math.max(0, Number((parsed as any).micronutrients?.zinc_mg) || 0),
        omega3_mg: Math.max(0, Number((parsed as any).micronutrients?.omega3_mg) || 0),
        vitamin_c_mg: Math.max(0, Number((parsed as any).micronutrients?.vitamin_c_mg) || 0),
      },
    };
  });

export const generateInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [foods, profile] = await Promise.all([
      supabase.from("food_logs").select("name,calories,protein_g,carbs_g,fat_g,meal_type").eq("user_id", userId).gte("logged_at", today.toISOString()),
      supabase.from("profiles").select("daily_calorie_goal,protein_goal_g").eq("user_id", userId).single(),
    ]);
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY");

    const prompt = `User goal: ${profile.data?.daily_calorie_goal ?? 2200} kcal, ${profile.data?.protein_goal_g ?? 140}g protein.
Today's meals: ${JSON.stringify(foods.data ?? [])}.
Give one short, motivating, specific coaching tip (max 2 sentences, no emojis).`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }) },
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const json = await res.json() as any;
    const text = (json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Keep going — small steps every day.").trim();
    await supabase.from("ai_insights").insert({ user_id: userId, kind: "daily", content: text });
    return { content: text };
  });
