import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getNotificationSettings,
  updateNotificationSettings,
  sendTestNotification,
} from "@/lib/notifications.functions";
import { savePushToken } from "@/lib/push.functions";
import { requestWebPushToken } from "@/lib/firebase";
import { isNative } from "@/lib/native";
import { registerNativePush } from "@/lib/native";
import {
  syncLocalReminders,
  getScheduledCount,
  scheduleTestReminder,
  buildReminderPlan,
} from "@/lib/local-reminders";
import { Bell, BellRing, Utensils, Droplets, Dumbbell, Users, Flame, ChevronDown, Moon, AlarmClock } from "lucide-react";
import { toast } from "sonner";

type Prefs = {
  tz_offset_minutes: number;
  meals_enabled: boolean;
  water_enabled: boolean;
  workout_enabled: boolean;
  squad_enabled: boolean;
  streak_enabled: boolean;
  sleep_enabled: boolean;
  breakfast_at: string;
  lunch_at: string;
  dinner_at: string;
  workout_at: string;
  sleep_at: string;
  quiet_start: string;
  quiet_end: string;
};

const hhmm = (v: string) => (v || "").slice(0, 5);


export function NotificationSettings() {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getNotificationSettings);
  const saveSettings = useServerFn(updateNotificationSettings);
  const testPush = useServerFn(sendTestNotification);
  const persistToken = useServerFn(savePushToken);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 60_000,
  });

  const prefs = data?.prefs as Prefs | undefined;
  const recent = (data?.recent ?? []) as Array<{ id: string; title: string; body: string; created_at: string }>;

  const [scheduled, setScheduled] = useState<number | null>(null);
  const refreshScheduled = async () => {
    if (!isNative()) return;
    setScheduled(await getScheduledCount());
  };

  // Reschedule on-device reminders whenever prefs land or change.
  useEffect(() => {
    if (!prefs || !isNative()) return;
    let cancelled = false;
    (async () => {
      try {
        await syncLocalReminders(prefs);
        if (!cancelled) setScheduled(await getScheduledCount());
      } catch {
        /* permission denied or plugin unavailable */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    prefs?.meals_enabled,
    prefs?.water_enabled,
    prefs?.workout_enabled,
    prefs?.sleep_enabled,
    prefs?.breakfast_at,
    prefs?.lunch_at,
    prefs?.dinner_at,
    prefs?.workout_at,
    prefs?.sleep_at,
    prefs?.quiet_start,
    prefs?.quiet_end,
  ]);

  const save = useMutation({
    mutationFn: (patch: Partial<Prefs>) => saveSettings({ data: patch as never }),
    onMutate: async (patch) => {
      qc.setQueryData(["notification-settings"], (old: any) =>
        old ? { ...old, prefs: { ...old.prefs, ...patch } } : old,
      );
    },
    onError: () => toast.error("Couldn't save that setting"),
    onSuccess: async (_res, patch) => {
      if (!isNative() || !prefs) return;
      // Schedule immediately after saving — don't wait for the refetch.
      const next = { ...prefs, ...patch };
      const count = await syncLocalReminders(next).catch(() => 0);
      setScheduled(await getScheduledCount());
      toast.success(`${count} reminder${count === 1 ? "" : "s"} scheduled on this device`);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["notification-settings"] }),
  });

  const testLocal = useMutation({
    mutationFn: async () => {
      const ok = await scheduleTestReminder(2);
      if (!ok) throw new Error("Permission denied");
      await refreshScheduled();
    },
    onSuccess: () => toast.success("Test reminder set for 2 minutes from now"),
    onError: () =>
      toast.error(
        isNative() ? "Notification permission was blocked" : "Open the app on your phone to test reminders",
      ),
  });


  const enablePush = useMutation({
    mutationFn: async () => {
      const tz = -new Date().getTimezoneOffset();
      if (isNative()) {
        const native = await registerNativePush();
        if (!native?.token) throw new Error("Permission denied");
        await persistToken({ data: { token: native.token, platform: native.platform } });
      } else {
        const token = await requestWebPushToken();
        if (!token) throw new Error("Permission denied");
        await persistToken({ data: { token, platform: "web" } });
      }
      await saveSettings({ data: { tz_offset_minutes: tz } as never });
      const res = await testPush();
      return res;
    },
    onSuccess: (res: any) => {
      if (res?.ok) toast.success(`Test push sent to ${res.sent} device${res.sent === 1 ? "" : "s"}`);
      else if (res?.reason === "not_configured") toast.error("Push isn't configured on the server yet");
      else if (res?.reason === "no_device") toast.error("No device token stored — try again");
      else if (res?.reason === "send_failed") toast.error("Firebase rejected the send — check the project key");
      else toast.success("Device registered for reminders");
    },
    onError: (e: any) => toast.error(e?.message === "Permission denied" ? "Notification permission was blocked" : "Couldn't register this device"),
  });


  const toggles: Array<{ key: keyof Prefs; label: string; hint: string; icon: React.ReactNode }> = [
    { key: "meals_enabled", label: "Meal reminders", hint: "Breakfast, lunch & dinner nudges", icon: <Utensils className="h-3.5 w-3.5" /> },
    { key: "water_enabled", label: "Water reminders", hint: "Spaced hydration nudges through the day", icon: <Droplets className="h-3.5 w-3.5" /> },
    { key: "workout_enabled", label: "Workout reminders", hint: "Today's AI split, on time", icon: <Dumbbell className="h-3.5 w-3.5" /> },
    { key: "sleep_enabled", label: "Sleep reminder", hint: "Wind-down ping before bed", icon: <Moon className="h-3.5 w-3.5" /> },
    { key: "squad_enabled", label: "Squad alerts", hint: "Rank changes, XP, invites", icon: <Users className="h-3.5 w-3.5" /> },
    { key: "streak_enabled", label: "Streak rescue", hint: "Late-night save your streak ping", icon: <Flame className="h-3.5 w-3.5" /> },
  ];

  const times: Array<{ key: keyof Prefs; label: string }> = [
    { key: "breakfast_at", label: "Breakfast" },
    { key: "lunch_at", label: "Lunch" },
    { key: "dinner_at", label: "Dinner" },
    { key: "workout_at", label: "Workout" },
    { key: "sleep_at", label: "Sleep" },
  ];

  const planned = prefs ? buildReminderPlan(prefs).length : 0;


  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 active:scale-[0.99] transition"
      >
        <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold">Smart notifications</p>
          <p className="text-[11px] text-muted-foreground">Timely meal, water, workout & squad nudges</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <button
            onClick={() => enablePush.mutate()}
            disabled={enablePush.isPending}
            className="w-full rounded-xl bg-primary/15 border border-primary/30 py-2.5 text-xs font-semibold text-primary flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
          >
            <BellRing className="h-3.5 w-3.5" />
            {enablePush.isPending ? "Enabling…" : "Enable on this device & send test"}
          </button>

          <div className="space-y-2">
            {toggles.map((t) => {
              const on = Boolean(prefs?.[t.key]);
              return (
                <div key={String(t.key)} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="text-muted-foreground">{t.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.hint}</p>
                  </div>
                  <button
                    onClick={() => save.mutate({ [t.key]: !on } as Partial<Prefs>)}
                    aria-label={t.label}
                    className={`h-5 w-9 rounded-full border transition-colors relative shrink-0 ${on ? "bg-primary/80 border-primary" : "bg-white/5 border-white/10"}`}
                  >
                    <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-background transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {times.map((t) => (
              <label key={String(t.key)} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.label}</span>
                <input
                  type="time"
                  value={hhmm(String(prefs?.[t.key] ?? ""))}
                  onChange={(e) => save.mutate({ [t.key]: e.target.value } as Partial<Prefs>)}
                  className="mt-1 w-full bg-transparent text-sm font-semibold tabular-nums outline-none"
                />
              </label>
            ))}
          </div>

          {recent.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recent</p>
              {recent.slice(0, 5).map((n) => (
                <div key={n.id} className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-2.5">
                  <p className="text-[11px] font-medium">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
