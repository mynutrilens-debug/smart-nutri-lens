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
  rescheduleLocalReminders,
  sendLocalTestNotification,
  getNotificationDiagnostics,
  type NotificationDiagnostics,
  type ReminderPrefs,
} from "@/lib/local-notifications";
import {
  Bell,
  BellRing,
  Utensils,
  Droplets,
  Dumbbell,
  Users,
  Flame,
  Moon,
  ChevronDown,
  Stethoscope,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

type Prefs = ReminderPrefs & {
  tz_offset_minutes: number;
  squad_enabled: boolean;
  streak_enabled: boolean;
  local_reminders: boolean;
};

const hhmm = (v: string) => (v || "").slice(0, 5);

export function NotificationSettings() {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getNotificationSettings);
  const saveSettings = useServerFn(updateNotificationSettings);
  const testPush = useServerFn(sendTestNotification);
  const persistToken = useServerFn(savePushToken);
  const [open, setOpen] = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);
  const [diag, setDiag] = useState<NotificationDiagnostics | null>(null);

  const { data } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 60_000,
  });

  const prefs = data?.prefs as Prefs | undefined;
  const recent = (data?.recent ?? []) as Array<{ id: string; title: string; body: string; created_at: string }>;

  // Any preference change re-arms the on-device schedule (cancel + schedule),
  // so reminders can never duplicate or drift out of sync with the settings.
  useEffect(() => {
    if (!prefs || !isNative()) return;
    void rescheduleLocalReminders(prefs).catch(() => {});
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
    onSettled: () => qc.invalidateQueries({ queryKey: ["notification-settings"] }),
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
      // Arm the device-side recurring reminders immediately.
      let scheduled = 0;
      if (prefs && isNative()) {
        const res = await rescheduleLocalReminders(prefs);
        scheduled = res.scheduled;
      }
      const res = (await testPush()) as any;
      return { ...res, scheduled };
    },
    onSuccess: (res: any) => {
      if (res?.scheduled) toast.success(`${res.scheduled} daily reminders scheduled on this device`);
      if (res?.ok) toast.success(`Test push sent to ${res.sent} device${res.sent === 1 ? "" : "s"}`);
      else if (res?.reason === "not_configured") toast.error("Push isn't configured on the server yet");
      else if (res?.reason === "no_device") toast.error("No device token stored — try again");
      else if (res?.reason === "send_failed") toast.error("Firebase rejected the send — check the project key");
      else if (!res?.scheduled) toast.success("Device registered for reminders");
    },
    onError: (e: any) => toast.error(e?.message === "Permission denied" ? "Notification permission was blocked" : "Couldn't register this device"),
  });

  const refreshDiag = async () => {
    setDiag(await getNotificationDiagnostics());
  };

  useEffect(() => {
    if (diagOpen) void refreshDiag();
  }, [diagOpen]);

  const toggles: Array<{ key: keyof Prefs; label: string; hint: string; icon: React.ReactNode }> = [
    { key: "meals_enabled", label: "Meal reminders", hint: "On-device: breakfast, lunch & dinner", icon: <Utensils className="h-3.5 w-3.5" /> },
    { key: "water_enabled", label: "Water reminders", hint: "On-device hydration nudges", icon: <Droplets className="h-3.5 w-3.5" /> },
    { key: "workout_enabled", label: "Workout reminders", hint: "On-device, at your training time", icon: <Dumbbell className="h-3.5 w-3.5" /> },
    { key: "sleep_enabled", label: "Sleep wind-down", hint: "On-device bedtime reminder", icon: <Moon className="h-3.5 w-3.5" /> },
    { key: "squad_enabled", label: "Squad alerts", hint: "Live: rank changes, XP, invites", icon: <Users className="h-3.5 w-3.5" /> },
    { key: "streak_enabled", label: "Streak & AI insights", hint: "Live: streak rescue, coach tips", icon: <Flame className="h-3.5 w-3.5" /> },
  ];

  const times: Array<{ key: keyof Prefs; label: string }> = [
    { key: "breakfast_at", label: "Breakfast" },
    { key: "lunch_at", label: "Lunch" },
    { key: "dinner_at", label: "Dinner" },
    { key: "workout_at", label: "Workout" },
    { key: "sleep_at", label: "Bedtime" },
    { key: "quiet_start", label: "Quiet from" },
  ];

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
          <p className="text-[11px] text-muted-foreground">Reminders run on your phone, live updates over the cloud</p>
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

          {/* ------------------------------- diagnostics ------------------- */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <button
              onClick={() => setDiagOpen((v) => !v)}
              className="w-full flex items-center gap-2 p-3 text-left active:scale-[0.99] transition"
            >
              <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium flex-1">Diagnostics</span>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${diagOpen ? "rotate-180" : ""}`} />
            </button>

            {diagOpen && (
              <div className="px-3 pb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <Stat label="Platform" value={diag?.platform ?? "—"} />
                  <Stat label="Timezone" value={diag?.timezone ?? "—"} />
                  <Stat label="Local perm" value={diag?.localPermission ?? "—"} />
                  <Stat label="Push perm" value={diag?.pushPermission ?? "—"} />
                </div>

                <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">FCM token</p>
                  <p className="text-[10px] font-mono break-all mt-0.5">
                    {diag?.fcmToken ? `${diag.fcmToken.slice(0, 24)}…${diag.fcmToken.slice(-8)}` : "not registered on this session"}
                  </p>
                </div>

                <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Scheduled on device ({diag?.pending.length ?? 0})
                  </p>
                  {diag?.pending.length ? (
                    diag.pending.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-[10px] py-0.5">
                        <span className="truncate pr-2">{p.title}</span>
                        <span className="tabular-nums text-muted-foreground">{p.at ?? "—"}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      {diag?.native ? "None scheduled yet" : "Local reminders run in the mobile app only"}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={async () => {
                      if (!prefs) return;
                      try {
                        const res = await rescheduleLocalReminders(prefs);
                        if (res.skipped === "not_native") toast.error("Only available in the mobile app");
                        else if (res.skipped === "no_permission") toast.error("Notification permission blocked");
                        else toast.success(`${res.scheduled} reminders re-scheduled`);
                        await refreshDiag();
                      } catch {
                        toast.error("Couldn't reschedule");
                      }
                    }}
                    className="rounded-lg border border-white/10 bg-white/[0.03] py-2 text-[11px] font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
                  >
                    <Smartphone className="h-3 w-3" /> Re-schedule
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await sendLocalTestNotification();
                        toast.success("Local test arrives in ~5s");
                      } catch (e: any) {
                        toast.error(
                          e?.message === "not_native"
                            ? "Only available in the mobile app"
                            : "Notification permission blocked",
                        );
                      }
                    }}
                    className="rounded-lg border border-white/10 bg-white/[0.03] py-2 text-[11px] font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
                  >
                    <Bell className="h-3 w-3" /> Local test
                  </button>
                </div>

                <button
                  onClick={async () => {
                    const res = (await testPush()) as any;
                    if (res?.ok) toast.success(`Cloud push sent to ${res.sent} device(s)`);
                    else toast.error(`Cloud push failed: ${res?.reason ?? "unknown"}`);
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2 text-[11px] font-medium active:scale-[0.98] transition"
                >
                  Send cloud (FCM) test
                </button>
              </div>
            )}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-2">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-[11px] font-medium truncate">{value}</p>
    </div>
  );
}
