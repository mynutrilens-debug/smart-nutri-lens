import { c as createSsrRpc } from "./router-D-2d6VGp.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as createServerFn } from "./server-BadC42R4.js";
const OnboardingInput = z.object({
  display_name: z.string().min(1).max(80).optional(),
  gender: z.enum(["male", "female"]),
  age: z.number().int().min(13).max(100),
  height_cm: z.number().min(100).max(230),
  weight_kg: z.number().min(30).max(250),
  target_weight_kg: z.number().min(30).max(250).optional(),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "athlete"]),
  physique_goal: z.enum(["weight_loss", "fat_loss", "muscle_gain", "maintenance", "recomp"]),
  diet_preference: z.string().min(1).max(60),
  region: z.string().max(60).optional().nullable(),
  cuisine: z.string().max(60).optional().nullable(),
  allergies: z.array(z.string().max(40)).max(20).default([]),
  medical_conditions: z.array(z.string().max(60)).max(20).default([])
});
const saveOnboarding = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => OnboardingInput.parse(d)).handler(createSsrRpc("5dc81b79d5db3ce4425b18be9a3e5bd1dbbfc204481152165bbfcf82fed654b6"));
const generateAiPlan = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => {
  const parsed = z.object({
    force: z.boolean().optional()
  }).safeParse(d ?? {});
  return parsed.success ? parsed.data : {
    force: false
  };
}).handler(createSsrRpc("7e40a6d4b2519bdd5e7982185252fbc510a3dd0e31628a065720d765d884a6cc"));
export {
  generateAiPlan as g,
  saveOnboarding as s
};
