import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const logWeight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ weight_kg: z.number().min(20).max(400) }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("weight_entries").insert({ user_id: userId, weight_kg: data.weight_kg });
    if (error) throw new Error(error.message);
    await supabase.from("profiles").update({ weight_kg: data.weight_kg }).eq("user_id", userId);
    return { ok: true };
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
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
