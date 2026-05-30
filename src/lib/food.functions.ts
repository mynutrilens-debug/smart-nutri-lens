import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

const FoodInput = z.object({
  name: z.string().min(1).max(200),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.number().int().min(0).max(10000),
  protein_g: z.number().min(0).max(1000),
  carbs_g: z.number().min(0).max(1000),
  fat_g: z.number().min(0).max(1000),
  image_url: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const logFood = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => FoodInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin;
    const userId = DEMO_USER_ID;
    const { error, data: row } = await supabase.from("food_logs").insert({ user_id: userId, ...data }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listFoods = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = supabaseAdmin;
    const userId = DEMO_USER_ID;
    const { data, error } = await supabase.from("food_logs").select("*").eq("user_id", userId).order("logged_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteFood = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin;
    const userId = DEMO_USER_ID;
    const { error } = await supabase.from("food_logs").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
