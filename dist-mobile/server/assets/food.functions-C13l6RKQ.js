import { c as createSsrRpc } from "./router-D-2d6VGp.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as createServerFn } from "./server-BadC42R4.js";
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
const logFood = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => FoodInput.parse(d)).handler(createSsrRpc("3a4d45ca9b8890bce12fc6f62e1d3797d67840bca763a8b541b9280812aeca97"));
const listFoods = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("11b988f9872addae6c07c91b00b0a1bf97d4d3734853c1a02808bbfa8d8bc571"));
const deleteFood = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("fb1134f83f8938a06029a4fdda41da464f7a9d481bc1374a6717a8bdbd301fe7"));
export {
  logFood as a,
  deleteFood as d,
  listFoods as l
};
