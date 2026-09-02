import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { targetsFromProfile } from "@/lib/nutrition-engine";


export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 30);

    const existingProfile = await supabase.from("profiles").select("user_id").eq("user_id", userId).maybeSingle();
    if (!existingProfile.data) {
      await supabase.from("profiles").insert({ user_id: userId, display_name: "Athlete" });
    }

    const [profile, todayFoods, todayWorkouts, weights, insight] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("food_logs").select("*").eq("user_id", userId).gte("logged_at", today.toISOString()),
      supabase.from("workouts").select("*").eq("user_id", userId).gte("logged_at", today.toISOString()),
      supabase.from("weight_entries").select("*").eq("user_id", userId).gte("logged_at", weekAgo.toISOString()).order("logged_at", { ascending: true }),
      supabase.from("ai_insights").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const foods = todayFoods.data ?? [];
    const totals = foods.reduce(
      (a, f) => ({
        calories: a.calories + (f.calories ?? 0),
        protein: a.protein + Number(f.protein_g ?? 0),
        carbs: a.carbs + Number(f.carbs_g ?? 0),
        fat: a.fat + Number(f.fat_g ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    const burned = (todayWorkouts.data ?? []).reduce((a, w) => a + (w.calories_burned ?? 0), 0);

    // Keep goals in sync with the centralized engine (weight/activity/goal changes).
    let prof = profile.data as any;
    const eng = targetsFromProfile(prof);
    if (
      eng &&
      (eng.calories !== prof?.daily_calorie_goal ||
        eng.protein_g !== prof?.protein_goal_g ||
        eng.carbs_g !== prof?.carbs_goal_g ||
        eng.fat_g !== prof?.fat_goal_g)
    ) {
      await supabase
        .from("profiles")
        .update({
          daily_calorie_goal: eng.calories,
          protein_goal_g: eng.protein_g,
          carbs_goal_g: eng.carbs_g,
          fat_goal_g: eng.fat_g,
        })
        .eq("user_id", userId);
      prof = {
        ...prof,
        daily_calorie_goal: eng.calories,
        protein_goal_g: eng.protein_g,
        carbs_goal_g: eng.carbs_g,
        fat_goal_g: eng.fat_g,
      };
    }

    return {
      profile: prof,
      totals,
      burned,
      targets: eng,
      weights: weights.data ?? [],
      insight: insight.data,
      recentFoods: foods.slice(0, 5),
    };
  });

