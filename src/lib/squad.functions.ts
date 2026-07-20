import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CHALLENGE_TYPES = [
  "weight_loss","muscle_gain","steps","healthy_eating","workout","hydration","sleep","custom",
] as const;

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += alphabet[Math.floor(Math.random() * alphabet.length)];
  return c;
}

function endDateFor(period: "weekly" | "monthly") {
  const d = new Date();
  if (period === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export const createSquad = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().trim().min(2).max(60),
      challenge_type: z.enum(CHALLENGE_TYPES),
      custom_challenge: z.string().trim().max(80).optional().nullable(),
      goal_description: z.string().trim().max(200).optional().nullable(),
      goal_target: z.number().finite().optional().nullable(),
      period: z.enum(["weekly", "monthly"]).default("weekly"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Generate a unique code (small retry loop)
    let code = generateCode();
    for (let i = 0; i < 5; i++) {
      const { data: exists } = await supabase.from("squads").select("id").eq("code", code).maybeSingle();
      if (!exists) break;
      code = generateCode();
    }
    const { data: squad, error } = await supabase
      .from("squads")
      .insert({
        name: data.name,
        code,
        owner_id: userId,
        challenge_type: data.challenge_type,
        custom_challenge: data.custom_challenge ?? null,
        goal_description: data.goal_description ?? null,
        goal_target: data.goal_target ?? null,
        period: data.period,
        ends_at: endDateFor(data.period),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
    await supabase.from("squad_members").insert({
      squad_id: squad.id,
      user_id: userId,
      display_name: profile?.display_name ?? "Athlete",
    });
    return squad;
  });

export const joinSquadByCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().trim().min(4).max(12) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const code = data.code.toUpperCase();
    // Owner is exempt from RLS SELECT restriction; general member can only see after joining.
    // We insert first with a permissive RLS check on user_id = auth.uid(); to find squad_id we need a lookup.
    // Use a public lookup via service? Simpler: allow a SELECT policy on squads by code.
    // Workaround: try inserting via subquery.
    const { data: squad, error: findErr } = await supabase.rpc("find_squad_by_code", { _code: code }).single();
    if (findErr || !squad) throw new Error("Squad not found");

    const squadRow = squad as { id: string; ends_at: string; finalized_at: string | null };
    if (squadRow.finalized_at) throw new Error("This challenge has ended");

    const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
    const { error } = await supabase.from("squad_members").insert({
      squad_id: squadRow.id,
      user_id: userId,
      display_name: profile?.display_name ?? "Athlete",
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { squad_id: squadRow.id };
  });

export const listMySquadsRich = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: memberships } = await supabase
      .from("squad_members")
      .select("squad_id, squads(*)")
      .eq("user_id", userId);
    const squads = (memberships ?? []).map((m: any) => m.squads).filter(Boolean);
    if (squads.length === 0) return [];

    const results = await Promise.all(squads.map(async (squad: any) => {
      const { data: members } = await supabase
        .from("squad_members")
        .select("user_id, display_name, joined_at")
        .eq("squad_id", squad.id);
      const memberIds = (members ?? []).map((m: any) => m.user_id);
      if (memberIds.length === 0) {
        return { ...squad, members: [], member_count: 0, my_rank: 1, my_points: 0, top_points: 0 };
      }

      const [foods, workouts, weights, snaps] = await Promise.all([
        supabase.from("food_logs").select("user_id, logged_at").in("user_id", memberIds).gte("logged_at", squad.starts_at).lte("logged_at", squad.ends_at),
        supabase.from("workouts").select("user_id, logged_at").in("user_id", memberIds).gte("logged_at", squad.starts_at).lte("logged_at", squad.ends_at),
        supabase.from("weight_entries").select("user_id, logged_at, weight_kg").in("user_id", memberIds).gte("logged_at", squad.starts_at).lte("logged_at", squad.ends_at).order("logged_at", { ascending: true }),
        supabase.from("health_snapshots").select("user_id, captured_on, steps, active_minutes, sleep_minutes").in("user_id", memberIds).gte("captured_on", squad.starts_at.slice(0, 10)).lte("captured_on", squad.ends_at.slice(0, 10)),
      ]);

      const scored = (members ?? []).map((m: any) => {
        const pts = computePointsFor({
          foods: (foods.data ?? []).filter((r: any) => r.user_id === m.user_id),
          workouts: (workouts.data ?? []).filter((r: any) => r.user_id === m.user_id),
          weights: (weights.data ?? []).filter((r: any) => r.user_id === m.user_id),
          snapshots: (snaps.data ?? []).filter((r: any) => r.user_id === m.user_id),
          challenge_type: squad.challenge_type as string,
        });
        return { user_id: m.user_id, display_name: m.display_name ?? "Athlete", points: pts.total, streak_days: pts.days };
      }).sort((a, b) => b.points - a.points);

      const my_rank = Math.max(1, scored.findIndex((s) => s.user_id === userId) + 1);
      const me = scored.find((s) => s.user_id === userId);
      return {
        ...squad,
        members: scored,
        member_count: scored.length,
        my_rank,
        my_points: me?.points ?? 0,
        my_streak: me?.streak_days ?? 0,
        top_points: scored[0]?.points ?? 0,
      };
    }));
    return results;
  });

export const leaveSquad = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ squad_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("squad_members").delete()
      .eq("squad_id", data.squad_id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMySquads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: memberships, error } = await supabase
      .from("squad_members")
      .select("squad_id, squads(*)")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    const squads = (memberships ?? [])
      .map((m: any) => m.squads)
      .filter(Boolean);
    return squads;
  });

// Points formula
function computePointsFor(rows: {
  foods: any[];
  workouts: any[];
  weights: any[];
  snapshots: any[];
  challenge_type: string;
}) {
  const foodCount = rows.foods.length;
  const workoutCount = rows.workouts.length;
  const totalSteps = rows.snapshots.reduce((a, s) => a + (s.steps ?? 0), 0);
  const totalSleep = rows.snapshots.reduce((a, s) => a + (s.sleep_minutes ?? 0), 0);
  const totalActive = rows.snapshots.reduce((a, s) => a + (s.active_minutes ?? 0), 0);

  const days = new Set(rows.foods.map((f) => new Date(f.logged_at).toDateString())).size;

  const cats = {
    healthy_eating: foodCount * 10,
    workout: workoutCount * 30,
    muscle_gain: workoutCount * 30,
    steps: Math.floor(totalSteps / 1000) * 5,
    hydration: Math.floor(totalActive / 15) * 5, // proxy: active minutes (no water column yet)
    sleep: Math.floor(totalSleep / 60) * 5,
    weight_loss: 0,
    custom: 0,
  };

  const streak = days * 20;

  // Weight loss reward: reward every 0.5kg drop from first to last entry in period
  if (rows.weights.length >= 2) {
    const first = Number(rows.weights[0].weight_kg);
    const last = Number(rows.weights[rows.weights.length - 1].weight_kg);
    if (first > last) cats.weight_loss = Math.floor((first - last) * 2) * 50;
  }

  let total =
    cats.healthy_eating + cats.workout + cats.steps + cats.hydration +
    cats.sleep + cats.weight_loss + streak;
  // 2x multiplier for challenge category subtotal
  const bonusKey = rows.challenge_type as keyof typeof cats;
  if (cats[bonusKey] !== undefined) total += cats[bonusKey];

  return {
    total,
    breakdown: {
      meals: cats.healthy_eating,
      workouts: cats.workout,
      steps: cats.steps,
      water: cats.hydration,
      sleep: cats.sleep,
      weight_loss: cats.weight_loss,
      streak,
    },
    days,
  };
}

export const getSquadLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ squad_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: squad, error: sErr } = await supabase.from("squads").select("*").eq("id", data.squad_id).maybeSingle();
    if (sErr || !squad) throw new Error("Squad not found");

    const { data: members } = await supabase
      .from("squad_members").select("user_id, display_name, joined_at")
      .eq("squad_id", data.squad_id);

    const memberIds = (members ?? []).map((m) => m.user_id);
    if (memberIds.length === 0) {
      return { squad, leaderboard: [], me: null, rewards: [] };
    }

    const start = squad.starts_at;
    const end = squad.ends_at;

    const [foods, workouts, weights, snaps] = await Promise.all([
      supabase.from("food_logs").select("user_id, logged_at").in("user_id", memberIds).gte("logged_at", start).lte("logged_at", end),
      supabase.from("workouts").select("user_id, logged_at, calories_burned").in("user_id", memberIds).gte("logged_at", start).lte("logged_at", end),
      supabase.from("weight_entries").select("user_id, logged_at, weight_kg").in("user_id", memberIds).gte("logged_at", start).lte("logged_at", end).order("logged_at", { ascending: true }),
      supabase.from("health_snapshots").select("user_id, captured_on, steps, active_minutes, sleep_minutes").in("user_id", memberIds).gte("captured_on", start.slice(0, 10)).lte("captured_on", end.slice(0, 10)),
    ]);

    const leaderboard = (members ?? []).map((m) => {
      const rows = {
        foods: (foods.data ?? []).filter((r) => r.user_id === m.user_id),
        workouts: (workouts.data ?? []).filter((r) => r.user_id === m.user_id),
        weights: (weights.data ?? []).filter((r) => r.user_id === m.user_id),
        snapshots: (snaps.data ?? []).filter((r) => r.user_id === m.user_id),
        challenge_type: squad.challenge_type as string,
      };
      const pts = computePointsFor(rows);
      return {
        user_id: m.user_id,
        display_name: m.display_name ?? "Athlete",
        joined_at: m.joined_at,
        points: pts.total,
        breakdown: pts.breakdown,
        streak_days: pts.days,
      };
    }).sort((a, b) => b.points - a.points);

    const me = leaderboard.find((l) => l.user_id === userId) ?? null;

    const { data: rewards } = await supabase.from("squad_rewards").select("*").eq("squad_id", data.squad_id);

    return { squad, leaderboard, me, rewards: rewards ?? [] };
  });

// Finalize (award prizes). Idempotent: only runs when ends_at is past and not yet finalized.
export const finalizeSquad = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ squad_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: squad } = await supabase.from("squads").select("*").eq("id", data.squad_id).maybeSingle();
    if (!squad) throw new Error("Squad not found");
    if (squad.finalized_at) return { alreadyFinalized: true };
    if (new Date(squad.ends_at) > new Date()) throw new Error("Challenge is still active");

    // Compute leaderboard inline (avoid recursion into another server fn)
    const { data: members } = await supabase.from("squad_members").select("user_id, display_name").eq("squad_id", data.squad_id);
    const memberIds = (members ?? []).map((m) => m.user_id);
    const [foods, workouts, weights, snaps] = await Promise.all([
      supabase.from("food_logs").select("user_id, logged_at").in("user_id", memberIds).gte("logged_at", squad.starts_at).lte("logged_at", squad.ends_at),
      supabase.from("workouts").select("user_id, logged_at").in("user_id", memberIds).gte("logged_at", squad.starts_at).lte("logged_at", squad.ends_at),
      supabase.from("weight_entries").select("user_id, logged_at, weight_kg").in("user_id", memberIds).gte("logged_at", squad.starts_at).lte("logged_at", squad.ends_at).order("logged_at", { ascending: true }),
      supabase.from("health_snapshots").select("user_id, captured_on, steps, active_minutes, sleep_minutes").in("user_id", memberIds).gte("captured_on", squad.starts_at.slice(0, 10)).lte("captured_on", squad.ends_at.slice(0, 10)),
    ]);
    const scored = (members ?? []).map((m) => {
      const pts = computePointsFor({
        foods: (foods.data ?? []).filter((r) => r.user_id === m.user_id),
        workouts: (workouts.data ?? []).filter((r) => r.user_id === m.user_id),
        weights: (weights.data ?? []).filter((r) => r.user_id === m.user_id),
        snapshots: (snaps.data ?? []).filter((r) => r.user_id === m.user_id),
        challenge_type: squad.challenge_type as string,
      });
      return { user_id: m.user_id, points: pts.total };
    }).sort((a, b) => b.points - a.points);

    const podium = [
      { rank: 1, badge: "gold",   days: 7, xp: 500, code: `MNL-${squad.code}-1` },
      { rank: 2, badge: "silver", days: 3, xp: 300, code: `MNL-${squad.code}-2` },
      { rank: 3, badge: "bronze", days: 1, xp: 150, code: `MNL-${squad.code}-3` },
    ];

    for (let i = 0; i < Math.min(3, scored.length); i++) {
      const winner = scored[i];
      const spec = podium[i];
      if (winner.points <= 0) continue;

      await supabase.from("squad_rewards").upsert({
        squad_id: squad.id,
        user_id: winner.user_id,
        rank: spec.rank,
        points: winner.points,
        badge: spec.badge,
        coupon_code: spec.code,
        platinum_days: spec.days,
        xp_bonus: spec.xp,
      }, { onConflict: "squad_id,user_id" });

      // Extend Platinum: bump current_period_expires_at
      const { data: sub } = await supabase.from("subscriptions").select("*").eq("user_id", winner.user_id).maybeSingle();
      if (sub) {
        const currentEnd = sub.current_period_expires_at ? new Date(sub.current_period_expires_at) : new Date();
        const base = currentEnd > new Date() ? currentEnd : new Date();
        base.setDate(base.getDate() + spec.days);
        await supabase.from("subscriptions").update({
          plan: sub.plan === "platinum" ? "platinum" : sub.plan,
          status: "active",
          current_period_expires_at: base.toISOString(),
        }).eq("user_id", winner.user_id);
      }
    }

    await supabase.from("squads").update({ finalized_at: new Date().toISOString() }).eq("id", squad.id);
    return { ok: true, awarded: Math.min(3, scored.length), youWon: scored.slice(0, 3).some((s) => s.user_id === userId) };
  });

export const getMyRewards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("squad_rewards")
      .select("*, squads(name, challenge_type, ends_at)")
      .eq("user_id", userId)
      .order("awarded_at", { ascending: false });
    return data ?? [];
  });
