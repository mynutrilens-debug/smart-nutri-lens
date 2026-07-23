import { c as createServerRpc } from "./createServerRpc-S7gwSw9F.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as createServerFn } from "./server-BadC42R4.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const WorkoutSchema = z.object({
  source_id: z.string(),
  activity: z.string(),
  started_at: z.string(),
  duration_min: z.number().nonnegative(),
  calories: z.number().nonnegative().optional(),
  distance_m: z.number().nonnegative().optional()
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
  workouts: z.array(WorkoutSchema).default([])
});
const ingestHealthSnapshot_createServerFn_handler = createServerRpc({
  id: "d3fd5391a7ce0f52dba4d9b2b547f17022fbb3b12b7c650401893fb6bdb51c46",
  name: "ingestHealthSnapshot",
  filename: "src/lib/health.functions.ts"
}, (opts) => ingestHealthSnapshot.__executeServer(opts));
const ingestHealthSnapshot = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => SnapshotSchema.parse(d)).handler(ingestHealthSnapshot_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const now = (/* @__PURE__ */ new Date()).toISOString();
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
    raw: data
  };
  await supabase.from("health_snapshots").upsert(snapshot, {
    onConflict: "user_id,captured_on"
  });
  if (data.weight_kg) {
    await supabase.from("weight_entries").insert({
      user_id: userId,
      weight_kg: data.weight_kg,
      logged_at: now
    });
  }
  if (data.workouts.length) {
    const rows = data.workouts.map((w) => ({
      user_id: userId,
      activity: w.activity,
      duration_min: w.duration_min,
      calories_burned: w.calories ? Math.round(w.calories) : null,
      logged_at: w.started_at,
      source: data.source,
      source_id: w.source_id
    }));
    await supabase.from("workouts").upsert(rows, {
      onConflict: "user_id,source,source_id",
      ignoreDuplicates: true
    });
  }
  await supabase.from("profiles").update({
    resting_hr: data.resting_heart_rate ?? void 0,
    sleep_minutes: data.sleep_minutes ?? void 0,
    active_minutes_today: data.active_minutes ?? void 0,
    health_sync_enabled: true,
    health_last_synced_at: now,
    ...data.weight_kg ? {
      weight_kg: data.weight_kg
    } : {},
    ...data.height_cm ? {
      height_cm: data.height_cm
    } : {}
  }).eq("user_id", userId);
  return {
    ok: true,
    workouts_ingested: data.workouts.length
  };
});
const getHealthOverview_createServerFn_handler = createServerRpc({
  id: "40a0c69efc2c22f6ca3610d36be0d9f08f4f3b583f908e2a90a6ca006b1b2a86",
  name: "getHealthOverview",
  filename: "src/lib/health.functions.ts"
}, (opts) => getHealthOverview.__executeServer(opts));
const getHealthOverview = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getHealthOverview_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const {
    data: snaps
  } = await supabase.from("health_snapshots").select("*").eq("user_id", userId).gte("captured_on", since).order("captured_on", {
    ascending: true
  });
  return {
    snapshots: snaps ?? []
  };
});
export {
  getHealthOverview_createServerFn_handler,
  ingestHealthSnapshot_createServerFn_handler
};
