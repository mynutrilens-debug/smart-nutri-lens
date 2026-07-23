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
const FoodInput = z.object({
  name: z.string().min(1).max(200),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.number().int().min(0).max(1e4),
  protein_g: z.number().min(0).max(1e3),
  carbs_g: z.number().min(0).max(1e3),
  fat_g: z.number().min(0).max(1e3),
  image_url: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable()
});
const logFood_createServerFn_handler = createServerRpc({
  id: "3a4d45ca9b8890bce12fc6f62e1d3797d67840bca763a8b541b9280812aeca97",
  name: "logFood",
  filename: "src/lib/food.functions.ts"
}, (opts) => logFood.__executeServer(opts));
const logFood = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => FoodInput.parse(d)).handler(logFood_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error,
    data: row
  } = await supabase.from("food_logs").insert({
    user_id: userId,
    ...data
  }).select().single();
  if (error) throw new Error(error.message);
  return row;
});
const listFoods_createServerFn_handler = createServerRpc({
  id: "11b988f9872addae6c07c91b00b0a1bf97d4d3734853c1a02808bbfa8d8bc571",
  name: "listFoods",
  filename: "src/lib/food.functions.ts"
}, (opts) => listFoods.__executeServer(opts));
const listFoods = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listFoods_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data,
    error
  } = await supabase.from("food_logs").select("*").eq("user_id", userId).order("logged_at", {
    ascending: false
  }).limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
});
const deleteFood_createServerFn_handler = createServerRpc({
  id: "fb1134f83f8938a06029a4fdda41da464f7a9d481bc1374a6717a8bdbd301fe7",
  name: "deleteFood",
  filename: "src/lib/food.functions.ts"
}, (opts) => deleteFood.__executeServer(opts));
const deleteFood = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(deleteFood_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("food_logs").delete().eq("id", data.id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  deleteFood_createServerFn_handler,
  listFoods_createServerFn_handler,
  logFood_createServerFn_handler
};
