import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const WorkoutSchema = z.object({
  source_id: z.string(),
  activity: z.string(),
  started_at: z.string(),
  duration_min: z.number().nonnegative(),
  calories: z.number().nonnegative().optional(),
  distance_m: z.number().nonnegative().optional(),
});

const SnapshotSchema = z.object({
  captured_on: z.string(),
  source: z.enum(["healthkit", "health_connect"]),
  steps: z.number().int().nonnegative().optional(),
  calories_burned: z.number().nonnegative().optional(),
  distance_m: z.number().nonnegative().optional(),
  active_minutes: z.number().nonnegative().optional(),
  avg_heart_rate: z.number().positive().optional(),
  resting_heart_rate: z.number().positive().optional(),
  sleep_minutes: z.number().nonnegative().optional(),
  weight_kg: z.number().positive().optional(),
  height_cm: z.number().positive().optional(),
  workouts: z.array(WorkoutSchema).default([]),
});

export const ingestHealthSnapshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SnapshotSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const now = new Date().toISOString();

    // Upsert daily snapshot
    const snapshot = {
      user_id: userId,
      captured_on: data.captured_on,
      source: data.source,
      steps: data.steps ?? null,
      calories_burned: data.calories_burned ? Math.round(data.calories_burned) : null,
      distance_m: data.distance_m ? Math.round(data.distance_m) : null,
      active_minutes: data.active_minutes ? Math.round(data.active_minutes) : null,
      avg_heart_rate: data.avg_heart_rate ? Math.round(data.avg_heart_rate) : null,
      resting_heart_rate: data.resting_heart_rate ? Math.round(data.resting_heart_rate) : null,
      sleep_minutes: data.sleep_minutes ? Math.round(data.sleep_minutes) : null,
      weight_kg: data.weight_kg ?? null,
      height_cm: data.height_cm ?? null,
      workouts_count: data.workouts.length,
      raw: data as any,
    };
    await supabase.from("health_snapshots").upsert(snapshot, { onConflict: "user_id,captured_on" });

    // Mirror weight
    if (data.weight_kg) {
      await supabase.from("weight_entries").insert({
        user_id: userId,
        weight_kg: data.weight_kg,
        logged_at: now,
      });
    }

    // Mirror workouts (dedup by source + source_id via unique index)
    if (data.workouts.length) {
      const rows = data.workouts.map((w) => ({
        user_id: userId,
        activity: w.activity,
        duration_min: w.duration_min,
        calories_burned: w.calories ? Math.round(w.calories) : null,
        logged_at: w.started_at,
        source: data.source,
        source_id: w.source_id,
      }));
      await supabase.from("workouts").upsert(rows as any, {
        onConflict: "user_id,source,source_id",
        ignoreDuplicates: true,
      });
    }

    // Update quick-access columns on profile
    await supabase
      .from("profiles")
      .update({
        resting_hr: data.resting_heart_rate ?? undefined,
        sleep_minutes: data.sleep_minutes ?? undefined,
        active_minutes_today: data.active_minutes ?? undefined,
        health_sync_enabled: true,
        health_last_synced_at: now,
        ...(data.weight_kg ? { weight_kg: data.weight_kg } : {}),
        ...(data.height_cm ? { height_cm: data.height_cm } : {}),
      } as any)
      .eq("user_id", userId);

    return { ok: true, workouts_ingested: data.workouts.length };
  });

export const getHealthOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const { data: snaps } = await supabase
      .from("health_snapshots")
      .select("*")
      .eq("user_id", userId)
      .gte("captured_on", since)
      .order("captured_on", { ascending: true });
    return { snapshots: snaps ?? [] };
  });
