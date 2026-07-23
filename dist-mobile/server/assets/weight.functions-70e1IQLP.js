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
const logWeight_createServerFn_handler = createServerRpc({
  id: "a78da44b1e541b0b26f3b5c1a4e2bb757b183f43bb1d2eea80fdc92e44886008",
  name: "logWeight",
  filename: "src/lib/weight.functions.ts"
}, (opts) => logWeight.__executeServer(opts));
const logWeight = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  weight_kg: z.number().min(20).max(400)
}).parse(d)).handler(logWeight_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("weight_entries").insert({
    user_id: userId,
    weight_kg: data.weight_kg
  });
  if (error) throw new Error(error.message);
  await supabase.from("profiles").update({
    weight_kg: data.weight_kg
  }).eq("user_id", userId);
  return {
    ok: true
  };
});
const updateProfile_createServerFn_handler = createServerRpc({
  id: "250cfffd342bb4a312e8dd3bc6836a31c47efe44a4ba17098be8e91910933d11",
  name: "updateProfile",
  filename: "src/lib/weight.functions.ts"
}, (opts) => updateProfile.__executeServer(opts));
const updateProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  display_name: z.string().min(1).max(100).optional(),
  daily_calorie_goal: z.number().int().min(800).max(8e3).optional(),
  protein_goal_g: z.number().int().min(20).max(500).optional(),
  carbs_goal_g: z.number().int().min(20).max(1e3).optional(),
  fat_goal_g: z.number().int().min(10).max(400).optional(),
  height_cm: z.number().min(80).max(260).optional()
}).parse(d)).handler(updateProfile_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("profiles").update(data).eq("user_id", userId);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  logWeight_createServerFn_handler,
  updateProfile_createServerFn_handler
};
