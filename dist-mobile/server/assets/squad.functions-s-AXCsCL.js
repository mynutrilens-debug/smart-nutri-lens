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
const CHALLENGE_TYPES = ["weight_loss", "muscle_gain", "steps", "healthy_eating", "workout", "hydration", "sleep", "custom"];
function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += alphabet[Math.floor(Math.random() * alphabet.length)];
  return c;
}
function endDateFor(period) {
  const d = /* @__PURE__ */ new Date();
  if (period === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}
const createSquad_createServerFn_handler = createServerRpc({
  id: "5efc2b2c9b24fa77cd6095b41f7155ff7c36c42324ebfdddb946f79799565e81",
  name: "createSquad",
  filename: "src/lib/squad.functions.ts"
}, (opts) => createSquad.__executeServer(opts));
const createSquad = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  name: z.string().trim().min(2).max(60),
  challenge_type: z.enum(CHALLENGE_TYPES),
  custom_challenge: z.string().trim().max(80).optional().nullable(),
  goal_description: z.string().trim().max(200).optional().nullable(),
  goal_target: z.number().finite().optional().nullable(),
  period: z.enum(["weekly", "monthly"]).default("weekly")
}).parse(d)).handler(createSquad_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  let code = generateCode();
  for (let i = 0; i < 5; i++) {
    const {
      data: exists
    } = await supabase.from("squads").select("id").eq("code", code).maybeSingle();
    if (!exists) break;
    code = generateCode();
  }
  const {
    data: squad,
    error
  } = await supabase.from("squads").insert({
    name: data.name,
    code,
    owner_id: userId,
    challenge_type: data.challenge_type,
    custom_challenge: data.custom_challenge ?? null,
    goal_description: data.goal_description ?? null,
    goal_target: data.goal_target ?? null,
    period: data.period,
    ends_at: endDateFor(data.period)
  }).select().single();
  if (error) throw new Error(error.message);
  const {
    data: profile
  } = await supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
  await supabase.from("squad_members").insert({
    squad_id: squad.id,
    user_id: userId,
    display_name: profile?.display_name ?? "Athlete"
  });
  return squad;
});
const joinSquadByCode_createServerFn_handler = createServerRpc({
  id: "c3dc46127f14a54e7df138d417a5ac37e40d1481f9920cc4687cc8f0d64e3a8a",
  name: "joinSquadByCode",
  filename: "src/lib/squad.functions.ts"
}, (opts) => joinSquadByCode.__executeServer(opts));
const joinSquadByCode = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  code: z.string().trim().min(4).max(12)
}).parse(d)).handler(joinSquadByCode_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const code = data.code.toUpperCase();
  const {
    data: squad,
    error: findErr
  } = await supabase.rpc("find_squad_by_code", {
    _code: code
  }).single();
  if (findErr || !squad) throw new Error("Squad not found");
  const squadRow = squad;
  if (squadRow.finalized_at) throw new Error("This challenge has ended");
  const {
    data: profile
  } = await supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
  const {
    error
  } = await supabase.from("squad_members").insert({
    squad_id: squadRow.id,
    user_id: userId,
    display_name: profile?.display_name ?? "Athlete"
  });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  return {
    squad_id: squadRow.id
  };
});
const leaveSquad_createServerFn_handler = createServerRpc({
  id: "bd0f77e53ca2928c1bce18ffa2537a04bcab3b61c6c7df4ac705be8cdfc33cda",
  name: "leaveSquad",
  filename: "src/lib/squad.functions.ts"
}, (opts) => leaveSquad.__executeServer(opts));
const leaveSquad = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  squad_id: z.string().uuid()
}).parse(d)).handler(leaveSquad_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("squad_members").delete().eq("squad_id", data.squad_id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const listMySquads_createServerFn_handler = createServerRpc({
  id: "fbca84a5f7c8c34c8852bd37909635ee2fcb13502503849634b462e079603d95",
  name: "listMySquads",
  filename: "src/lib/squad.functions.ts"
}, (opts) => listMySquads.__executeServer(opts));
const listMySquads = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listMySquads_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: memberships,
    error
  } = await supabase.from("squad_members").select("squad_id, squads(*)").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const squads = (memberships ?? []).map((m) => m.squads).filter(Boolean);
  return squads;
});
function computePointsFor(rows) {
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
    steps: Math.floor(totalSteps / 1e3) * 5,
    hydration: Math.floor(totalActive / 15) * 5,
    // proxy: active minutes (no water column yet)
    sleep: Math.floor(totalSleep / 60) * 5,
    weight_loss: 0,
    custom: 0
  };
  const streak = days * 20;
  if (rows.weights.length >= 2) {
    const first = Number(rows.weights[0].weight_kg);
    const last = Number(rows.weights[rows.weights.length - 1].weight_kg);
    if (first > last) cats.weight_loss = Math.floor((first - last) * 2) * 50;
  }
  let total = cats.healthy_eating + cats.workout + cats.steps + cats.hydration + cats.sleep + cats.weight_loss + streak;
  const bonusKey = rows.challenge_type;
  if (cats[bonusKey] !== void 0) total += cats[bonusKey];
  return {
    total,
    breakdown: {
      meals: cats.healthy_eating,
      workouts: cats.workout,
      steps: cats.steps,
      water: cats.hydration,
      sleep: cats.sleep,
      weight_loss: cats.weight_loss,
      streak
    },
    days
  };
}
const getSquadLeaderboard_createServerFn_handler = createServerRpc({
  id: "1fa5bcc52ae09f201067ac28ab7ab87f76e09369c90fe71b7aaa7356bd99e361",
  name: "getSquadLeaderboard",
  filename: "src/lib/squad.functions.ts"
}, (opts) => getSquadLeaderboard.__executeServer(opts));
const getSquadLeaderboard = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  squad_id: z.string().uuid()
}).parse(d)).handler(getSquadLeaderboard_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: squad,
    error: sErr
  } = await supabase.from("squads").select("*").eq("id", data.squad_id).maybeSingle();
  if (sErr || !squad) throw new Error("Squad not found");
  const {
    data: members
  } = await supabase.from("squad_members").select("user_id, display_name, joined_at").eq("squad_id", data.squad_id);
  const memberIds = (members ?? []).map((m) => m.user_id);
  if (memberIds.length === 0) {
    return {
      squad,
      leaderboard: [],
      me: null,
      rewards: []
    };
  }
  const start = squad.starts_at;
  const end = squad.ends_at;
  const [foods, workouts, weights, snaps] = await Promise.all([supabase.from("food_logs").select("user_id, logged_at").in("user_id", memberIds).gte("logged_at", start).lte("logged_at", end), supabase.from("workouts").select("user_id, logged_at, calories_burned").in("user_id", memberIds).gte("logged_at", start).lte("logged_at", end), supabase.from("weight_entries").select("user_id, logged_at, weight_kg").in("user_id", memberIds).gte("logged_at", start).lte("logged_at", end).order("logged_at", {
    ascending: true
  }), supabase.from("health_snapshots").select("user_id, captured_on, steps, active_minutes, sleep_minutes").in("user_id", memberIds).gte("captured_on", start.slice(0, 10)).lte("captured_on", end.slice(0, 10))]);
  const leaderboard = (members ?? []).map((m) => {
    const rows = {
      foods: (foods.data ?? []).filter((r) => r.user_id === m.user_id),
      workouts: (workouts.data ?? []).filter((r) => r.user_id === m.user_id),
      weights: (weights.data ?? []).filter((r) => r.user_id === m.user_id),
      snapshots: (snaps.data ?? []).filter((r) => r.user_id === m.user_id),
      challenge_type: squad.challenge_type
    };
    const pts = computePointsFor(rows);
    return {
      user_id: m.user_id,
      display_name: m.display_name ?? "Athlete",
      joined_at: m.joined_at,
      points: pts.total,
      breakdown: pts.breakdown,
      streak_days: pts.days
    };
  }).sort((a, b) => b.points - a.points);
  const me = leaderboard.find((l) => l.user_id === userId) ?? null;
  const {
    data: rewards
  } = await supabase.from("squad_rewards").select("*").eq("squad_id", data.squad_id);
  return {
    squad,
    leaderboard,
    me,
    rewards: rewards ?? []
  };
});
const finalizeSquad_createServerFn_handler = createServerRpc({
  id: "64432c48bc99a3e7da4ea75101b45ff162aa0b9ced9537ef850bd08c06da60bf",
  name: "finalizeSquad",
  filename: "src/lib/squad.functions.ts"
}, (opts) => finalizeSquad.__executeServer(opts));
const finalizeSquad = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  squad_id: z.string().uuid()
}).parse(d)).handler(finalizeSquad_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: squad
  } = await supabase.from("squads").select("*").eq("id", data.squad_id).maybeSingle();
  if (!squad) throw new Error("Squad not found");
  if (squad.finalized_at) return {
    alreadyFinalized: true
  };
  if (new Date(squad.ends_at) > /* @__PURE__ */ new Date()) throw new Error("Challenge is still active");
  const {
    data: members
  } = await supabase.from("squad_members").select("user_id, display_name").eq("squad_id", data.squad_id);
  const memberIds = (members ?? []).map((m) => m.user_id);
  const [foods, workouts, weights, snaps] = await Promise.all([supabase.from("food_logs").select("user_id, logged_at").in("user_id", memberIds).gte("logged_at", squad.starts_at).lte("logged_at", squad.ends_at), supabase.from("workouts").select("user_id, logged_at").in("user_id", memberIds).gte("logged_at", squad.starts_at).lte("logged_at", squad.ends_at), supabase.from("weight_entries").select("user_id, logged_at, weight_kg").in("user_id", memberIds).gte("logged_at", squad.starts_at).lte("logged_at", squad.ends_at).order("logged_at", {
    ascending: true
  }), supabase.from("health_snapshots").select("user_id, captured_on, steps, active_minutes, sleep_minutes").in("user_id", memberIds).gte("captured_on", squad.starts_at.slice(0, 10)).lte("captured_on", squad.ends_at.slice(0, 10))]);
  const scored = (members ?? []).map((m) => {
    const pts = computePointsFor({
      foods: (foods.data ?? []).filter((r) => r.user_id === m.user_id),
      workouts: (workouts.data ?? []).filter((r) => r.user_id === m.user_id),
      weights: (weights.data ?? []).filter((r) => r.user_id === m.user_id),
      snapshots: (snaps.data ?? []).filter((r) => r.user_id === m.user_id),
      challenge_type: squad.challenge_type
    });
    return {
      user_id: m.user_id,
      points: pts.total
    };
  }).sort((a, b) => b.points - a.points);
  const podium = [{
    rank: 1,
    badge: "gold",
    days: 7,
    xp: 500,
    code: `MNL-${squad.code}-1`
  }, {
    rank: 2,
    badge: "silver",
    days: 3,
    xp: 300,
    code: `MNL-${squad.code}-2`
  }, {
    rank: 3,
    badge: "bronze",
    days: 1,
    xp: 150,
    code: `MNL-${squad.code}-3`
  }];
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
      xp_bonus: spec.xp
    }, {
      onConflict: "squad_id,user_id"
    });
    const {
      data: sub
    } = await supabase.from("subscriptions").select("*").eq("user_id", winner.user_id).maybeSingle();
    if (sub) {
      const currentEnd = sub.current_period_expires_at ? new Date(sub.current_period_expires_at) : /* @__PURE__ */ new Date();
      const base = currentEnd > /* @__PURE__ */ new Date() ? currentEnd : /* @__PURE__ */ new Date();
      base.setDate(base.getDate() + spec.days);
      await supabase.from("subscriptions").update({
        plan: sub.plan === "platinum" ? "platinum" : sub.plan,
        status: "active",
        current_period_expires_at: base.toISOString()
      }).eq("user_id", winner.user_id);
    }
  }
  await supabase.from("squads").update({
    finalized_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", squad.id);
  return {
    ok: true,
    awarded: Math.min(3, scored.length),
    youWon: scored.slice(0, 3).some((s) => s.user_id === userId)
  };
});
const getMyRewards_createServerFn_handler = createServerRpc({
  id: "f1e215f0428b914f7ce03e1a28dd627184b27500ce91575c3e680834c4970718",
  name: "getMyRewards",
  filename: "src/lib/squad.functions.ts"
}, (opts) => getMyRewards.__executeServer(opts));
const getMyRewards = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMyRewards_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data
  } = await supabase.from("squad_rewards").select("*, squads(name, challenge_type, ends_at)").eq("user_id", userId).order("awarded_at", {
    ascending: false
  });
  return data ?? [];
});
export {
  createSquad_createServerFn_handler,
  finalizeSquad_createServerFn_handler,
  getMyRewards_createServerFn_handler,
  getSquadLeaderboard_createServerFn_handler,
  joinSquadByCode_createServerFn_handler,
  leaveSquad_createServerFn_handler,
  listMySquads_createServerFn_handler
};
