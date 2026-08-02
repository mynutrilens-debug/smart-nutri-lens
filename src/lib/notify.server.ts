// Server-only notification engine: builds personalized, deep-linked messages
// and delivers them through FCM. All entry points are safe to call repeatedly —
// notification_log dedupe keys guarantee one send per user per slot per day.
import { sendFcmToToken, type PushPayload } from "./fcm.server";

export type NotifyInput = {
  userId: string;
  kind: string;
  dedupeKey: string;
  title: string;
  body: string;
  url?: string;
};

const WATER_GOAL_ML = 2500;
const GLASS_ML = 250;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

/** Deliver one notification to every device the user has registered. */
export async function deliver(input: NotifyInput): Promise<boolean> {
  const db = await admin();
  const url = input.url ?? "/home";

  // Dedupe: unique(user_id, dedupe_key). If the insert conflicts, we already sent it.
  const { error: logErr } = await db.from("notification_log").insert({
    user_id: input.userId,
    kind: input.kind,
    dedupe_key: input.dedupeKey,
    title: input.title,
    body: input.body,
    url,
  });
  if (logErr) return false; // duplicate or write failure → skip send

  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id, token")
    .eq("user_id", input.userId);
  if (!subs?.length) return false;

  const payload: PushPayload = {
    title: input.title,
    body: input.body,
    url,
    tag: input.kind,
  };

  let sent = 0;
  for (const sub of subs) {
    const result = await sendFcmToToken(sub.token, payload);
    if (result === "ok") sent++;
    if (result === "invalid") {
      await db.from("push_subscriptions").delete().eq("id", sub.id);
    }
  }
  return sent > 0;
}

// ---------------------------------------------------------------- helpers

type Prefs = {
  user_id: string;
  tz_offset_minutes: number;
  meals_enabled: boolean;
  water_enabled: boolean;
  workout_enabled: boolean;
  squad_enabled: boolean;
  streak_enabled: boolean;
  breakfast_at: string;
  lunch_at: string;
  dinner_at: string;
  workout_at: string;
  quiet_start: string;
  quiet_end: string;
};

const DEFAULT_PREFS: Omit<Prefs, "user_id"> = {
  tz_offset_minutes: 330,
  meals_enabled: true,
  water_enabled: true,
  workout_enabled: true,
  squad_enabled: true,
  streak_enabled: true,
  breakfast_at: "08:30",
  lunch_at: "13:00",
  dinner_at: "20:00",
  workout_at: "18:00",
  quiet_start: "22:30",
  quiet_end: "07:00",
};

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function localNow(tzOffsetMinutes: number) {
  const shifted = new Date(Date.now() + tzOffsetMinutes * 60_000);
  const minutes = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  const dateKey = shifted.toISOString().slice(0, 10);
  return { minutes, dateKey };
}

function isQuiet(prefs: Prefs, minutes: number) {
  const start = toMinutes(prefs.quiet_start);
  const end = toMinutes(prefs.quiet_end);
  return start > end ? minutes >= start || minutes < end : minutes >= start && minutes < end;
}

/** Fire when the current sweep lands within the slot window (cron runs every 15 min). */
function due(minutes: number, target: number, window = 20) {
  return minutes >= target && minutes < target + window;
}

// ---------------------------------------------------------------- reminders

export async function runReminderSweep() {
  const db = await admin();
  const results = { candidates: 0, sent: 0 };

  const { data: subs } = await db
    .from("push_subscriptions")
    .select("user_id")
    .order("user_id");
  const userIds = Array.from(new Set((subs ?? []).map((s: any) => s.user_id)));
  if (!userIds.length) return results;
  results.candidates = userIds.length;

  const [{ data: prefRows }, { data: profiles }] = await Promise.all([
    db.from("notification_prefs").select("*").in("user_id", userIds),
    db
      .from("profiles")
      .select(
        "user_id, display_name, daily_calorie_goal, protein_goal_g, streak_count, water_intake_l",
      )
      .in("user_id", userIds),
  ]);

  const prefsBy = new Map<string, Prefs>();
  for (const p of prefRows ?? []) prefsBy.set(p.user_id, p);
  const profileBy = new Map<string, any>();
  for (const p of profiles ?? []) profileBy.set(p.user_id, p);

  // Pull the last 48h of activity once and bucket it per user.
  const since = new Date(Date.now() - 48 * 3600_000).toISOString();
  const [{ data: foods }, { data: workouts }, { data: snaps }] = await Promise.all([
    db
      .from("food_logs")
      .select("user_id, meal_type, calories, protein_g, logged_at")
      .in("user_id", userIds)
      .gte("logged_at", since),
    db
      .from("workouts")
      .select("user_id, logged_at")
      .in("user_id", userIds)
      .gte("logged_at", since),
    db
      .from("health_snapshots")
      .select("user_id, captured_on, water_ml, steps")
      .in("user_id", userIds)
      .gte("captured_on", since.slice(0, 10)),
  ]);

  for (const userId of userIds) {
    const prefs: Prefs = prefsBy.get(userId) ?? { user_id: userId, ...DEFAULT_PREFS };
    const { minutes, dateKey } = localNow(prefs.tz_offset_minutes);
    if (isQuiet(prefs, minutes)) continue;

    const profile = profileBy.get(userId) ?? {};
    const name = (profile.display_name || "").split(" ")[0] || "champ";
    const calorieGoal = profile.daily_calorie_goal ?? 2200;
    const proteinGoal = profile.protein_goal_g ?? 140;

    const todaysFoods = (foods ?? []).filter(
      (f: any) =>
        f.user_id === userId &&
        localNow(prefs.tz_offset_minutes) &&
        new Date(new Date(f.logged_at).getTime() + prefs.tz_offset_minutes * 60_000)
          .toISOString()
          .slice(0, 10) === dateKey,
    );
    const todaysWorkouts = (workouts ?? []).filter(
      (w: any) =>
        w.user_id === userId &&
        new Date(new Date(w.logged_at).getTime() + prefs.tz_offset_minutes * 60_000)
          .toISOString()
          .slice(0, 10) === dateKey,
    );
    const snap = (snaps ?? []).find(
      (s: any) => s.user_id === userId && s.captured_on === dateKey,
    );

    const kcalEaten = todaysFoods.reduce((a: number, f: any) => a + (f.calories ?? 0), 0);
    const proteinEaten = todaysFoods.reduce(
      (a: number, f: any) => a + Number(f.protein_g ?? 0),
      0,
    );
    const kcalLeft = Math.max(0, calorieGoal - kcalEaten);
    const proteinLeft = Math.max(0, Math.round(proteinGoal - proteinEaten));
    const has = (meal: string) => todaysFoods.some((f: any) => f.meal_type === meal);

    const queue: NotifyInput[] = [];

    // --- Meals -----------------------------------------------------------
    if (prefs.meals_enabled) {
      if (due(minutes, toMinutes(prefs.breakfast_at)) && !has("breakfast")) {
        queue.push({
          userId,
          kind: "meal_breakfast",
          dedupeKey: `meal_breakfast:${dateKey}`,
          title: "🍳 Breakfast time",
          body: `Morning ${name}! Start with ~${Math.round(calorieGoal * 0.22)} kcal and 25–30g protein. Tap to see today's plan.`,
          url: "/diet",
        });
      }
      if (due(minutes, toMinutes(prefs.lunch_at)) && !has("lunch")) {
        queue.push({
          userId,
          kind: "meal_lunch",
          dedupeKey: `meal_lunch:${dateKey}`,
          title: "🍛 Lunch is your biggest meal",
          body: `${kcalLeft} kcal and ${proteinLeft}g protein left today. Your AI lunch is ready to log.`,
          url: "/diet",
        });
      }
      if (due(minutes, toMinutes(prefs.dinner_at)) && !has("dinner")) {
        queue.push({
          userId,
          kind: "meal_dinner",
          dedupeKey: `meal_dinner:${dateKey}`,
          title: "🌙 Dinner check-in",
          body:
            kcalLeft > 0
              ? `You have ${kcalLeft} kcal left — keep dinner light and protein-forward.`
              : `You're at your calorie target. A light protein dinner keeps you on track.`,
          url: "/diet",
        });
      }
      // Nudge to scan if nothing logged by mid-afternoon
      if (due(minutes, 16 * 60) && todaysFoods.length === 0) {
        queue.push({
          userId,
          kind: "meal_none",
          dedupeKey: `meal_none:${dateKey}`,
          title: "📸 Nothing logged yet today",
          body: "One quick scan and your macros update instantly. Takes 5 seconds.",
          url: "/scan",
        });
      }
    }

    // --- Water -----------------------------------------------------------
    if (prefs.water_enabled) {
      const waterMl = snap?.water_ml ?? 0;
      const glassesLeft = Math.max(0, Math.ceil((WATER_GOAL_ML - waterMl) / GLASS_ML));
      for (const [slot, at] of [
        ["mid", 11 * 60 + 30],
        ["noon", 15 * 60],
        ["eve", 19 * 60 + 30],
      ] as const) {
        if (due(minutes, at) && glassesLeft > 0) {
          queue.push({
            userId,
            kind: "water",
            dedupeKey: `water_${slot}:${dateKey}`,
            title: "💧 Hydration check",
            body:
              glassesLeft === 1
                ? "You're 1 glass away from today's water goal — finish strong!"
                : `You're ${glassesLeft} glasses away from today's goal!`,
            url: "/profile",
          });
        }
      }
    }

    // --- Workout ---------------------------------------------------------
    if (prefs.workout_enabled && due(minutes, toMinutes(prefs.workout_at)) && todaysWorkouts.length === 0) {
      queue.push({
        userId,
        kind: "workout",
        dedupeKey: `workout:${dateKey}`,
        title: "🏋️ Today's session is waiting",
        body: `${name}, your AI split for today is ready. 40 minutes and it's done.`,
        url: "/workout",
      });
    }

    // --- Streak rescue ---------------------------------------------------
    if (
      prefs.streak_enabled &&
      due(minutes, 21 * 60) &&
      todaysFoods.length === 0 &&
      todaysWorkouts.length === 0 &&
      (profile.streak_count ?? 0) > 0
    ) {
      queue.push({
        userId,
        kind: "streak",
        dedupeKey: `streak:${dateKey}`,
        title: `🔥 Your ${profile.streak_count}-day streak is at risk`,
        body: "Log one meal or workout before midnight to keep it alive.",
        url: "/home",
      });
    }

    for (const n of queue) {
      if (await deliver(n)) results.sent++;
    }
  }

  return results;
}

// ---------------------------------------------------------------- squads

function computeSquadPoints(rows: {
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

  const cats: Record<string, number> = {
    healthy_eating: foodCount * 10,
    workout: workoutCount * 30,
    muscle_gain: workoutCount * 30,
    steps: Math.floor(totalSteps / 1000) * 5,
    hydration: Math.floor(totalActive / 15) * 5,
    sleep: Math.floor(totalSleep / 60) * 5,
    weight_loss: 0,
    custom: 0,
  };
  if (rows.weights.length >= 2) {
    const first = Number(rows.weights[0].weight_kg);
    const last = Number(rows.weights[rows.weights.length - 1].weight_kg);
    if (first > last) cats.weight_loss = Math.floor((first - last) * 2) * 50;
  }
  let total =
    cats.healthy_eating + cats.workout + cats.steps + cats.hydration + cats.sleep +
    cats.weight_loss + days * 20;
  if (cats[rows.challenge_type] !== undefined) total += cats[rows.challenge_type];
  return total;
}

/** Detect rank changes / XP gains across all live squads and notify members. */
export async function runSquadSweep() {
  const db = await admin();
  const nowIso = new Date().toISOString();
  const results = { squads: 0, sent: 0 };

  const { data: squads } = await db
    .from("squads")
    .select("id, name, challenge_type, starts_at, ends_at")
    .gt("ends_at", nowIso)
    .is("finalized_at", null);
  if (!squads?.length) return results;

  for (const squad of squads) {
    const { data: members } = await db
      .from("squad_members")
      .select("id, user_id, display_name, last_rank, last_points")
      .eq("squad_id", squad.id);
    const memberIds = (members ?? []).map((m: any) => m.user_id);
    if (memberIds.length < 2) continue;
    results.squads++;

    const [foods, workouts, weights, snaps] = await Promise.all([
      db.from("food_logs").select("user_id, logged_at").in("user_id", memberIds)
        .gte("logged_at", squad.starts_at).lte("logged_at", squad.ends_at),
      db.from("workouts").select("user_id, logged_at").in("user_id", memberIds)
        .gte("logged_at", squad.starts_at).lte("logged_at", squad.ends_at),
      db.from("weight_entries").select("user_id, logged_at, weight_kg").in("user_id", memberIds)
        .gte("logged_at", squad.starts_at).lte("logged_at", squad.ends_at)
        .order("logged_at", { ascending: true }),
      db.from("health_snapshots").select("user_id, captured_on, steps, active_minutes, sleep_minutes")
        .in("user_id", memberIds)
        .gte("captured_on", squad.starts_at.slice(0, 10))
        .lte("captured_on", squad.ends_at.slice(0, 10)),
    ]);

    const board = (members ?? [])
      .map((m: any) => ({
        ...m,
        points: computeSquadPoints({
          foods: (foods.data ?? []).filter((r: any) => r.user_id === m.user_id),
          workouts: (workouts.data ?? []).filter((r: any) => r.user_id === m.user_id),
          weights: (weights.data ?? []).filter((r: any) => r.user_id === m.user_id),
          snapshots: (snaps.data ?? []).filter((r: any) => r.user_id === m.user_id),
          challenge_type: squad.challenge_type,
        }),
      }))
      .sort((a: any, b: any) => b.points - a.points)
      .map((m: any, i: number) => ({ ...m, rank: i + 1 }));

    const stamp = new Date().toISOString().slice(0, 13); // hourly dedupe bucket

    for (const m of board) {
      const prevRank = m.last_rank as number | null;
      const prevPoints = m.last_points ?? 0;
      const gained = m.points - prevPoints;
      const url = `/squads/${squad.id}`;

      const { data: prefs } = await db
        .from("notification_prefs")
        .select("squad_enabled")
        .eq("user_id", m.user_id)
        .maybeSingle();
      const squadEnabled = prefs?.squad_enabled ?? true;

      if (squadEnabled) {
        // Overtaken
        if (prevRank !== null && m.rank > prevRank) {
          const overtaker = board.find((o: any) => o.rank === m.rank - 1);
          if (
            await deliver({
              userId: m.user_id,
              kind: "squad_overtaken",
              dedupeKey: `squad_overtaken:${squad.id}:${m.rank}:${stamp}`,
              title: `😤 ${overtaker?.display_name ?? "A teammate"} just passed you`,
              body: `You slipped to #${m.rank} in ${squad.name}. ${Math.max(1, (overtaker?.points ?? 0) - m.points)} points to take it back.`,
              url,
            })
          ) results.sent++;
        }
        // Climbed
        if (prevRank !== null && m.rank < prevRank) {
          if (
            await deliver({
              userId: m.user_id,
              kind: "squad_climb",
              dedupeKey: `squad_climb:${squad.id}:${m.rank}:${stamp}`,
              title: m.rank === 1 ? "👑 You're #1 in your squad!" : `📈 You moved up to #${m.rank}`,
              body: `${squad.name}: ${m.points} points and climbing. Keep the pressure on.`,
              url,
            })
          ) results.sent++;
        }
        // XP earned
        if (gained >= 50) {
          if (
            await deliver({
              userId: m.user_id,
              kind: "squad_xp",
              dedupeKey: `squad_xp:${squad.id}:${m.points}`,
              title: `⚡ +${gained} XP earned`,
              body: `Nice work — ${m.points} total points in ${squad.name}. You're #${m.rank}.`,
              url,
            })
          ) results.sent++;
        }
      }

      if (m.rank !== prevRank || m.points !== prevPoints) {
        await db
          .from("squad_members")
          .update({ last_rank: m.rank, last_points: m.points })
          .eq("id", m.id);
      }
    }
  }

  return results;
}

/** Called when someone joins a squad: tell the existing members. */
export async function notifySquadJoin(squadId: string, newUserId: string, newName: string) {
  const db = await admin();
  const { data: squad } = await db.from("squads").select("id, name").eq("id", squadId).maybeSingle();
  if (!squad) return;
  const { data: members } = await db
    .from("squad_members")
    .select("user_id")
    .eq("squad_id", squadId);
  for (const m of members ?? []) {
    if (m.user_id === newUserId) continue;
    await deliver({
      userId: m.user_id,
      kind: "squad_join",
      dedupeKey: `squad_join:${squadId}:${newUserId}`,
      title: "🎉 New challenger joined",
      body: `${newName} just joined ${squad.name}. Check the leaderboard.`,
      url: `/squads/${squadId}`,
    });
  }
}
