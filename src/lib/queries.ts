import { queryOptions } from "@tanstack/react-query";
import { getDashboard } from "./dashboard.functions";
import { listFoods } from "./food.functions";
import { listWorkouts } from "./workout.functions";

export const dashboardQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: () => getDashboard(),
  staleTime: 30_000,
});

export const foodsQuery = queryOptions({
  queryKey: ["foods"],
  queryFn: () => listFoods(),
  staleTime: 15_000,
});

export const workoutsQuery = queryOptions({
  queryKey: ["workouts"],
  queryFn: () => listWorkouts(),
  staleTime: 15_000,
});
