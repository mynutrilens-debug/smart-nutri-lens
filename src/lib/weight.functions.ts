import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { targetsFromProfile } from "@/lib/nutrition-engine";

/** Recompute + persist calorie/macro goals from the centralized engine. */
async function recalcGoals(supabase: any, userId: string) {
  const { data: p } = await supabase
    .from("profiles")
    .select("gender,age,height_cm,weight_kg,activity_level,physique_goal,target_weight_kg")
    .eq("user_id", userId)
    .maybeSingle();
  const t = targetsFromProfile(p);
  if (!t) return null;
  await supabase
    .from("profiles")
    .update({
      daily_calorie_goal: t.calories,
      protein_goal_g: t.protein_g,
      carbs_goal_g: t.carbs_g,
      fat_goal_g: t.fat_g,
      body_fat_pct: t.body_fat_pct,
      muscle_mass_pct: t.muscle_mass_pct,
    })
    .eq("user_id", userId);
  return t;
}

export const logWeight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ weight_kg: z.number().min(20).max(400) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("weight_entries").insert({ user_id: userId, weight_kg: data.weight_kg });
    if (error) throw new Error(error.message);
    await supabase.from("profiles").update({ weight_kg: data.weight_kg }).eq("user_id", userId);
    // Weight changed → recalculate BMR → TDEE → goal targets.
    const targets = await recalcGoals(supabase, userId);
    return { ok: true, targets };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    display_name: z.string().min(1).max(100).optional(),
    daily_calorie_goal: z.number().int().min(800).max(8000).optional(),
    protein_goal_g: z.number().int().min(20).max(500).optional(),
    carbs_goal_g: z.number().int().min(20).max(1000).optional(),
    fat_goal_g: z.number().int().min(10).max(400).optional(),
    height_cm: z.number().min(80).max(260).optional(),
    weight_kg: z.number().min(20).max(400).optional(),
    activity_level: z.enum(["sedentary", "light", "moderate", "active", "athlete"]).optional(),
    physique_goal: z
      .enum(["weight_loss", "fat_loss", "muscle_gain", "maintenance", "recomp", "bulking"])
      .optional(),
    target_weight_kg: z.number().min(20).max(400).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("user_id", userId);
    if (error) throw new Error(error.message);

    // Weight / activity / goal changed → recalculate targets unless the user
    // explicitly overrode the macro goals in this same call.
    const manualMacros =
      data.daily_calorie_goal != null ||
      data.protein_goal_g != null ||
      data.carbs_goal_g != null ||
      data.fat_goal_g != null;
    const driversChanged =
      data.weight_kg != null ||
      data.height_cm != null ||
      data.activity_level != null ||
      data.physique_goal != null ||
      data.target_weight_kg != null;

    let targets = null;
    if (!manualMacros && driversChanged) targets = await recalcGoals(supabase, userId);
    return { ok: true, targets };
  });

/** Explicit recalculation entry point (dashboard / diet / workout refresh). */
export const recalcTargets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const targets = await recalcGoals(context.supabase, context.userId);
    return { ok: true, targets };
  });
