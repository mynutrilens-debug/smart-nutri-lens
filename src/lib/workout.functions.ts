import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const WorkoutInput = z.object({
  name: z.string().min(1).max(200),
  workout_type: z.enum(["strength", "cardio", "hiit", "yoga", "mobility", "sports"]),
  duration_min: z.number().int().min(1).max(600),
  calories_burned: z.number().int().min(0).max(5000),
  notes: z.string().max(500).optional().nullable(),
});

export const logWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => WorkoutInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error, data: row } = await supabase.from("workouts").insert({ user_id: userId, ...data }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listWorkouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("workouts").select("*").eq("user_id", userId).order("logged_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("workouts").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
