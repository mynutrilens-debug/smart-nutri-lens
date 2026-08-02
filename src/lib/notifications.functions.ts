import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const timeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);

export const getNotificationSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await (supabase.from("notification_prefs") as any)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: recent } = await (supabase.from("notification_log") as any)
      .select("id, kind, title, body, url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15);

    const prefs = data ?? {
      user_id: userId,
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
    return { prefs, recent: recent ?? [] };
  });

export const updateNotificationSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        tz_offset_minutes: z.number().int().min(-720).max(840).optional(),
        meals_enabled: z.boolean().optional(),
        water_enabled: z.boolean().optional(),
        workout_enabled: z.boolean().optional(),
        squad_enabled: z.boolean().optional(),
        streak_enabled: z.boolean().optional(),
        breakfast_at: timeSchema.optional(),
        lunch_at: timeSchema.optional(),
        dinner_at: timeSchema.optional(),
        workout_at: timeSchema.optional(),
        quiet_start: timeSchema.optional(),
        quiet_end: timeSchema.optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await (supabase.from("notification_prefs") as any).upsert(
      { user_id: userId, ...data, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Sends an instant test push to the caller's registered devices. */
export const sendTestNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { deliver } = await import("@/lib/notify.server");
    const { isFcmConfigured } = await import("@/lib/fcm.server");
    if (!isFcmConfigured()) {
      return { ok: false, reason: "not_configured" as const };
    }
    const sent = await deliver({
      userId,
      kind: "test",
      dedupeKey: `test:${Date.now()}`,
      title: "🔔 Notifications are live",
      body: "You'll get meal, water, workout and squad nudges right on time.",
      url: "/home",
    });
    return { ok: sent, reason: sent ? ("sent" as const) : ("no_device" as const) };
  });
