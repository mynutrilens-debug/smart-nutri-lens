// Hybrid notification architecture — device half.
//
// Capacitor Local Notifications own every RECURRING reminder (breakfast,
// lunch, dinner, water, workout, sleep). They are scheduled on the device in
// the user's own local timezone, so they fire with no backend, no cron and no
// network. FCM (see notify.server.ts) is reserved for dynamic, server-driven
// events: AI insights, streak rescues, squad updates, promos, account notices.
//
// Guarantees:
//  • Deterministic IDs per slot → rescheduling can never create duplicates.
//  • Full cancel-then-schedule on every preference change.
//  • Re-armed on app start and on every resume, which also covers reboots
//    (Android restores repeating alarms on boot, iOS keeps them natively).
import { Capacitor } from "@capacitor/core";
import { isNative } from "@/lib/native";

export const REMINDER_CHANNEL_ID = "mynutrilens_reminders";

export type ReminderPrefs = {
  meals_enabled: boolean;
  water_enabled: boolean;
  workout_enabled: boolean;
  sleep_enabled: boolean;
  breakfast_at: string;
  lunch_at: string;
  dinner_at: string;
  workout_at: string;
  sleep_at: string;
  quiet_start: string;
  quiet_end: string;
};

type Slot = {
  id: number;
  at: string;
  title: string;
  body: string;
  url: string;
};

const hhmm = (v: string | undefined | null, fallback: string) => {
  const s = (v ?? "").slice(0, 5);
  return /^\d{2}:\d{2}$/.test(s) ? s : fallback;
};

const toMinutes = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

function inQuietHours(prefs: ReminderPrefs, at: string) {
  const start = toMinutes(hhmm(prefs.quiet_start, "22:30"));
  const end = toMinutes(hhmm(prefs.quiet_end, "07:00"));
  const t = toMinutes(at);
  return start > end ? t >= start || t < end : t >= start && t < end;
}

/** Deterministic, stable IDs — rescheduling always replaces, never stacks. */
export const REMINDER_IDS = {
  breakfast: 1001,
  lunch: 1002,
  dinner: 1003,
  water_morning: 1101,
  water_midday: 1102,
  water_afternoon: 1103,
  water_evening: 1104,
  workout: 1201,
  sleep: 1301,
} as const;

export const ALL_REMINDER_IDS = Object.values(REMINDER_IDS) as number[];

export function buildReminderSlots(prefs: ReminderPrefs): Slot[] {
  const slots: Slot[] = [];

  if (prefs.meals_enabled) {
    slots.push(
      {
        id: REMINDER_IDS.breakfast,
        at: hhmm(prefs.breakfast_at, "08:30"),
        title: "🍳 Breakfast time",
        body: "Start the day light and protein-forward — your AI plan is ready.",
        url: "/diet",
      },
      {
        id: REMINDER_IDS.lunch,
        at: hhmm(prefs.lunch_at, "13:00"),
        title: "🍛 Lunch is your biggest meal",
        body: "Log lunch to keep today's macros on track.",
        url: "/diet",
      },
      {
        id: REMINDER_IDS.dinner,
        at: hhmm(prefs.dinner_at, "20:00"),
        title: "🌙 Dinner check-in",
        body: "Keep dinner moderate and protein-rich. Tap to log it.",
        url: "/diet",
      },
    );
  }

  if (prefs.water_enabled) {
    slots.push(
      {
        id: REMINDER_IDS.water_morning,
        at: "09:30",
        title: "💧 Hydration check",
        body: "Two glasses in by now keeps you ahead of your goal.",
        url: "/profile",
      },
      {
        id: REMINDER_IDS.water_midday,
        at: "11:30",
        title: "💧 Water break",
        body: "A glass now — small sips, big streaks.",
        url: "/profile",
      },
      {
        id: REMINDER_IDS.water_afternoon,
        at: "15:00",
        title: "💧 Afternoon hydration",
        body: "Top up your water and log it in seconds.",
        url: "/profile",
      },
      {
        id: REMINDER_IDS.water_evening,
        at: "19:30",
        title: "💧 Finish your water goal",
        body: "You're close — a couple of glasses to close the ring.",
        url: "/profile",
      },
    );
  }

  if (prefs.workout_enabled) {
    slots.push({
      id: REMINDER_IDS.workout,
      at: hhmm(prefs.workout_at, "18:00"),
      title: "🏋️ Today's session is waiting",
      body: "Your AI split is ready. 40 minutes and it's done.",
      url: "/workout",
    });
  }

  if (prefs.sleep_enabled) {
    slots.push({
      id: REMINDER_IDS.sleep,
      at: hhmm(prefs.sleep_at, "22:30"),
      title: "😴 Wind-down time",
      body: "Sleep is where recovery happens. Lights out soon.",
      url: "/profile",
    });
  }

  // Never fire inside the user's quiet window (sleep reminder is exempt —
  // it's the one that's supposed to land at bedtime).
  return slots.filter((s) => s.id === REMINDER_IDS.sleep || !inQuietHours(prefs, s.at));
}

async function plugin() {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

export async function ensureReminderChannel() {
  if (!isNative() || Capacitor.getPlatform() !== "android") return;
  const LocalNotifications = await plugin();
  await LocalNotifications.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: "Daily reminders",
    description: "Meal, water, workout and sleep reminders",
    importance: 4,
    visibility: 1,
    vibration: true,
  }).catch(() => {});
}

export async function ensureLocalPermission(): Promise<boolean> {
  if (!isNative()) return false;
  const LocalNotifications = await plugin();
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") perm = await LocalNotifications.requestPermissions();
  return perm.display === "granted";
}

/**
 * Cancel every managed reminder and re-arm from the current prefs.
 * Idempotent: safe to call on every preference change, app start and resume.
 */
export async function rescheduleLocalReminders(prefs: ReminderPrefs) {
  if (!isNative()) return { scheduled: 0, skipped: "not_native" as const };
  const LocalNotifications = await plugin();
  const granted = await ensureLocalPermission();
  if (!granted) return { scheduled: 0, skipped: "no_permission" as const };
  await ensureReminderChannel();

  // Always clear our whole ID range first — prevents duplicates and removes
  // slots that were just turned off.
  const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] }));
  const ours = pending.notifications.filter((n) => ALL_REMINDER_IDS.includes(n.id));
  if (ours.length) {
    await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) }).catch(
      () => {},
    );
  }

  const slots = buildReminderSlots(prefs);
  if (!slots.length) return { scheduled: 0, skipped: null };

  await LocalNotifications.schedule({
    notifications: slots.map((s) => {
      const [hour, minute] = s.at.split(":").map(Number);
      return {
        id: s.id,
        title: s.title,
        body: s.body,
        channelId: REMINDER_CHANNEL_ID,
        smallIcon: "ic_stat_icon",
        iconColor: "#22E5A0",
        extra: { url: s.url, local: true },
        // `on` + repeats fires daily at this wall-clock time in the device's
        // own timezone — travel and DST are handled by the OS.
        schedule: {
          on: { hour, minute },
          repeats: true,
          allowWhileIdle: true,
        },
      };
    }),
  });

  return { scheduled: slots.length, skipped: null };
}

export async function cancelAllLocalReminders() {
  if (!isNative()) return;
  const LocalNotifications = await plugin();
  const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] }));
  const ours = pending.notifications.filter((n) => ALL_REMINDER_IDS.includes(n.id));
  if (ours.length) {
    await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) }).catch(
      () => {},
    );
  }
}

export type PendingReminder = { id: number; title: string; at: string | null };

export async function listPendingReminders(): Promise<PendingReminder[]> {
  if (!isNative()) return [];
  const LocalNotifications = await plugin();
  const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] }));
  return pending.notifications
    .filter((n) => ALL_REMINDER_IDS.includes(n.id))
    .map((n) => {
      const on = (n.schedule as { on?: { hour?: number; minute?: number } } | undefined)?.on;
      const at =
        on && typeof on.hour === "number"
          ? `${String(on.hour).padStart(2, "0")}:${String(on.minute ?? 0).padStart(2, "0")}`
          : null;
      return { id: n.id, title: n.title ?? `#${n.id}`, at };
    })
    .sort((a, b) => (a.at ?? "").localeCompare(b.at ?? ""));
}

/** Fires a local notification ~5s from now so the user can verify the channel. */
export async function sendLocalTestNotification() {
  if (!isNative()) throw new Error("not_native");
  const granted = await ensureLocalPermission();
  if (!granted) throw new Error("no_permission");
  await ensureReminderChannel();
  const LocalNotifications = await plugin();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1999,
        title: "✅ Local reminders are working",
        body: "This one came straight from your phone — no internet needed.",
        channelId: REMINDER_CHANNEL_ID,
        smallIcon: "ic_stat_icon",
        iconColor: "#22E5A0",
        extra: { url: "/profile", local: true },
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
      },
    ],
  });
}

// -------------------------------------------------------------- diagnostics

export type NotificationDiagnostics = {
  platform: string;
  native: boolean;
  localPermission: string;
  pushPermission: string;
  pending: PendingReminder[];
  fcmToken: string | null;
  timezone: string;
  tzOffsetMinutes: number;
};

let lastFcmToken: string | null = null;
export const rememberFcmToken = (token: string | null) => {
  lastFcmToken = token;
};

export async function getNotificationDiagnostics(): Promise<NotificationDiagnostics> {
  const base: NotificationDiagnostics = {
    platform: typeof window === "undefined" ? "ssr" : Capacitor.getPlatform(),
    native: isNative(),
    localPermission: "unavailable",
    pushPermission: "unavailable",
    pending: [],
    fcmToken: lastFcmToken,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    tzOffsetMinutes: -new Date().getTimezoneOffset(),
  };
  if (!isNative()) {
    if (typeof Notification !== "undefined") base.pushPermission = Notification.permission;
    return base;
  }
  try {
    const LocalNotifications = await plugin();
    base.localPermission = (await LocalNotifications.checkPermissions()).display;
    base.pending = await listPendingReminders();
  } catch {}
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    base.pushPermission = (await PushNotifications.checkPermissions()).receive;
  } catch {}
  return base;
}

// ------------------------------------------------------- lifecycle re-arming

let lifecycleReady = false;
let prefsProvider: (() => Promise<ReminderPrefs | null>) | null = null;

/**
 * Registers app-lifecycle hooks that re-arm reminders on launch and on every
 * resume. This is what makes schedules survive reboots, force-quits, OS alarm
 * pruning and timezone changes.
 */
export async function initLocalReminderLifecycle(getPrefs: () => Promise<ReminderPrefs | null>) {
  prefsProvider = getPrefs;
  if (!isNative()) return;

  const rearm = async () => {
    try {
      const prefs = await prefsProvider?.();
      if (prefs) await rescheduleLocalReminders(prefs);
    } catch (e) {
      console.warn("[local-notifications] re-arm skipped", e);
    }
  };

  if (!lifecycleReady) {
    lifecycleReady = true;
    try {
      const { App } = await import("@capacitor/app");
      App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) void rearm();
      });
      App.addListener("resume", () => void rearm());
    } catch {}
  }
  await rearm();
}
