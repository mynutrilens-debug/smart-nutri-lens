import { queryOptions } from "@tanstack/react-query";
import { c as createSsrRpc } from "./router-D-2d6VGp.js";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as createServerFn } from "./server-BadC42R4.js";
import { l as listFoods } from "./food.functions-C13l6RKQ.js";
import { z } from "zod";
const getDashboard = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("367b32358181f96a433e5e7716daa74b5dbcf69e0677716fe7be918df41797ef"));
const WorkoutInput = z.object({
  name: z.string().min(1).max(200),
  workout_type: z.enum(["strength", "cardio", "hiit", "yoga", "mobility", "sports"]),
  duration_min: z.number().int().min(1).max(600),
  calories_burned: z.number().int().min(0).max(5e3),
  notes: z.string().max(500).optional().nullable()
});
const logWorkout = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => WorkoutInput.parse(d)).handler(createSsrRpc("02106d74a2575cdb313df5019a899445f85a71d2a7176619d356ec884c557336"));
const listWorkouts = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("e81756c823a6d03e9863f712a167e21ca33d07cfdd93dcc5fb3c89e8ab38fd9f"));
const deleteWorkout = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  id: z.string().uuid()
}).parse(d)).handler(createSsrRpc("e0d226af4d789c8ed8c045a510dc1cabb3db077a904e851c6c7dac5b8549ba10"));
const AiWorkoutInput = z.object({
  level: z.enum(["beginner", "intermediate", "pro"]).default("beginner"),
  equipment: z.enum(["none", "home", "gym"]).default("home"),
  injuries: z.array(z.string().max(60)).max(10).default([])
});
const generateAiWorkout = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => AiWorkoutInput.parse(d)).handler(createSsrRpc("0b6872f1789c0609adf497bd13675027426210fbeda2f47c5e529963c41004d7"));
const dashboardQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboard(),
  staleTime: 3e4
});
const foodsQuery = queryOptions({
  queryKey: ["foods"],
  queryFn: () => listFoods(),
  staleTime: 15e3
});
const workoutsQuery = queryOptions({
  queryKey: ["workouts"],
  queryFn: () => listWorkouts(),
  staleTime: 15e3
});
export {
  deleteWorkout as a,
  dashboardQuery as d,
  foodsQuery as f,
  generateAiWorkout as g,
  logWorkout as l,
  workoutsQuery as w
};
