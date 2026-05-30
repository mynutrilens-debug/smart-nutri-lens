import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

const WorkoutInput = z.object({
  name: z.string().min(1).max(200),
  workout_type: z.enum(["strength", "cardio", "hiit", "yoga", "mobility", "sports"]),
  duration_min: z.number().int().min(1).max(600),
  calories_burned: z.number().int().min(0).max(5000),
  notes: z.string().max(500).optional().nullable(),
});

export const logWorkout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => WorkoutInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin;
    const userId = DEMO_USER_ID;
    const { error, data: row } = await supabase.from("workouts").insert({ user_id: userId, ...data }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listWorkouts = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = supabaseAdmin;
    const userId = DEMO_USER_ID;
    const { data, error } = await supabase.from("workouts").select("*").eq("user_id", userId).order("logged_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteWorkout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = supabaseAdmin;
    const userId = DEMO_USER_ID;
    const { error } = await supabase.from("workouts").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
