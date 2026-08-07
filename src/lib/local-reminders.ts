// Capacitor Local Notifications — the single source for recurring reminders
// (breakfast, lunch, dinner, water, workout, sleep). Push/FCM is not used for
// these; everything below is scheduled on-device and repeats daily.
import { isNative } from '@/lib/native';

const CHANNEL_ID = 'mynutrilens_default';

// Stable ID ranges so re-scheduling replaces instead of duplicating.
const IDS = {
  breakfast: 4101,
  lunch: 4102,
  dinner: 4103,
  workout: 4104,
  sleep: 4105,
  waterBase: 4200, // 4200..4219
  test: 4999,
};

export type ReminderPrefs = {
  meals_enabled?: boolean;
  water_enabled?: boolean;
  workout_enabled?: boolean;
  sleep_enabled?: boolean;
  breakfast_at?: string;
  lunch_at?: string;
  dinner_at?: string;
  workout_at?: string;
  sleep_at?: string;
  quiet_start?: string;
  quiet_end?: string;
};

type Plan = { id: number; hour: number; minute: number; title: string; body: string; url: string };

function parseTime(v: string | undefined, fallback: string) {
  const [h, m] = String(v || fallback).slice(0, 5).split(':');
  const hour = Number(h);
  const minute = Number(m);
  return {
    hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 0,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0,
  };
}

const toMin = (t: { hour: number; minute: number }) => t.hour * 60 + t.minute;

/** Awake window (minutes from midnight) used to space out water reminders. */
function waterSlots(prefs: ReminderPrefs): Array<{ hour: number; minute: number }> {
  const start = toMin(parseTime(prefs.quiet_end, '07:00')) + 60; // an hour after waking
  const endRaw = toMin(parseTime(prefs.quiet_start, '22:30'));
  const end = endRaw > start ? endRaw : 22 * 60;
  const slots: Array<{ hour: number; minute: number }> = [];
  for (let m = start; m <= end - 30 && slots.length < 6; m += 150) {
    slots.push({ hour: Math.floor(m / 60) % 24, minute: m % 60 });
  }
  return slots;
}

export function buildReminderPlan(prefs: ReminderPrefs): Plan[] {
  const plans: Plan[] = [];
  if (prefs.meals_enabled !== false) {
    const b = parseTime(prefs.breakfast_at, '08:30');
    const l = parseTime(prefs.lunch_at, '13:00');
    const d = parseTime(prefs.dinner_at, '20:00');
    plans.push({ id: IDS.breakfast, ...b, title: '🍳 Breakfast time', body: 'Log your breakfast to keep today on track.', url: '/scan' });
    plans.push({ id: IDS.lunch, ...l, title: '🍛 Lunch time', body: 'Your biggest meal of the day — log it in seconds.', url: '/scan' });
    plans.push({ id: IDS.dinner, ...d, title: '🌙 Dinner time', body: 'Finish strong. Log dinner and close your rings.', url: '/scan' });
  }
  if (prefs.workout_enabled !== false) {
    const w = parseTime(prefs.workout_at, '18:00');
    plans.push({ id: IDS.workout, ...w, title: '💪 Time to train', body: "Today's AI split is ready. 45 minutes, let's go.", url: '/workout' });
  }
  if (prefs.sleep_enabled !== false) {
    const s = parseTime(prefs.sleep_at, '22:30');
    plans.push({ id: IDS.sleep, ...s, title: '😴 Wind down', body: 'Recovery is training too. Aim for 7–8 hours tonight.', url: '/profile' });
  }
  if (prefs.water_enabled !== false) {
    waterSlots(prefs).forEach((slot, i) => {
      plans.push({
        id: IDS.waterBase + i,
        ...slot,
        title: '💧 Hydration check',
        body: 'A glass of water now keeps your goal within reach.',
        url: '/profile',
      });
    });
  }
  return plans;
}

const managedIds = () => [
  IDS.breakfast,
  IDS.lunch,
  IDS.dinner,
  IDS.workout,
  IDS.sleep,
  ...Array.from({ length: 20 }, (_, i) => IDS.waterBase + i),
];

async function plugin() {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return LocalNotifications;
}

async function ensurePermission() {
  const LocalNotifications = await plugin();
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
  return perm.display === 'granted';
}

/** Cancels and re-creates every recurring reminder. Returns the scheduled count. */
export async function syncLocalReminders(prefs: ReminderPrefs): Promise<number> {
  if (!isNative()) return 0;
  const LocalNotifications = await plugin();
  if (!(await ensurePermission())) return 0;

  await LocalNotifications.cancel({ notifications: managedIds().map(id => ({ id })) }).catch(() => {});

  const plans = buildReminderPlan(prefs);
  if (plans.length === 0) return 0;

  await LocalNotifications.schedule({
    notifications: plans.map(p => ({
      id: p.id,
      title: p.title,
      body: p.body,
      channelId: CHANNEL_ID,
      smallIcon: 'ic_stat_icon',
      iconColor: '#22E5A0',
      extra: { url: p.url },
      schedule: {
        on: { hour: p.hour, minute: p.minute },
        allowWhileIdle: true,
      },
    })),
  });

  return plans.length;
}

export async function cancelLocalReminders() {
  if (!isNative()) return;
  const LocalNotifications = await plugin();
  await LocalNotifications.cancel({ notifications: managedIds().map(id => ({ id })) }).catch(() => {});
}

/** How many reminders the OS currently has pending for this app. */
export async function getScheduledCount(): Promise<number> {
  if (!isNative()) return 0;
  try {
    const LocalNotifications = await plugin();
    const pending = await LocalNotifications.getPending();
    return pending.notifications?.length ?? 0;
  } catch {
    return 0;
  }
}

/** Verification helper: fires a one-off reminder N minutes from now. */
export async function scheduleTestReminder(minutes = 2): Promise<boolean> {
  if (!isNative()) return false;
  const LocalNotifications = await plugin();
  if (!(await ensurePermission())) return false;
  const at = new Date(Date.now() + minutes * 60_000);
  await LocalNotifications.cancel({ notifications: [{ id: IDS.test }] }).catch(() => {});
  await LocalNotifications.schedule({
    notifications: [
      {
        id: IDS.test,
        title: '✅ Reminder test',
        body: `Scheduled ${minutes} minutes ago — your reminders are working.`,
        channelId: CHANNEL_ID,
        smallIcon: 'ic_stat_icon',
        iconColor: '#22E5A0',
        extra: { url: '/profile' },
        schedule: { at, allowWhileIdle: true },
      },
    ],
  });
  return true;
}
