import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DAYS = 92;

export const getProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date();
    since.setDate(since.getDate() - DAYS);
    since.setHours(0, 0, 0, 0);
    const sinceIso = since.toISOString();
    const sinceDate = sinceIso.slice(0, 10);

    const [profile, foods, workouts, weights, snapshots, insight] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("food_logs")
        .select("id,name,meal_type,calories,protein_g,carbs_g,fat_g,image_url,notes,logged_at")
        .eq("user_id", userId)
        .gte("logged_at", sinceIso)
        .order("logged_at", { ascending: false })
        .limit(1000),
      supabase
        .from("workouts")
        .select("id,name,workout_type,duration_min,calories_burned,logged_at")
        .eq("user_id", userId)
        .gte("logged_at", sinceIso)
        .order("logged_at", { ascending: false })
        .limit(1000),
      supabase
        .from("weight_entries")
        .select("id,weight_kg,logged_at")
        .eq("user_id", userId)
        .gte("logged_at", sinceIso)
        .order("logged_at", { ascending: true })
        .limit(1000),
      supabase
        .from("health_snapshots")
        .select("captured_on,steps,sleep_minutes,active_minutes,calories_burned,water_ml,weight_kg")
        .eq("user_id", userId)
        .gte("captured_on", sinceDate)
        .order("captured_on", { ascending: true })
        .limit(400),
      supabase
        .from("ai_insights")
        .select("content,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      profile: profile.data,
      foods: foods.data ?? [],
      workouts: workouts.data ?? [],
      weights: weights.data ?? [],
      snapshots: (snapshots.data ?? []) as Array<{
        captured_on: string;
        steps: number | null;
        sleep_minutes: number | null;
        active_minutes: number | null;
        calories_burned: number | null;
        water_ml: number | null;
        weight_kg: number | null;
      }>,
      insight: insight.data,
    };
  });

export const logWater = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ water_ml: z.number().int().min(0).max(10000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    const existing = await supabase
      .from("health_snapshots")
      .select("id")
      .eq("user_id", userId)
      .eq("captured_on", today)
      .maybeSingle();

    if (existing.data?.id) {
      const { error } = await supabase
        .from("health_snapshots")
        .update({ water_ml: data.water_ml })
        .eq("id", existing.data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("health_snapshots")
        .insert({ user_id: userId, captured_on: today, source: "manual", water_ml: data.water_ml });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
