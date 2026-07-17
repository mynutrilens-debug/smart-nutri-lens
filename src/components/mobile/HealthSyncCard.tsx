import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Heart, Moon, Footprints, RefreshCw, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { isHealthAvailable, readHealthSnapshot, type HealthSnapshot } from "@/lib/health";
import { ingestHealthSnapshot } from "@/lib/health.functions";

type Props = {
  lastSyncedAt?: string | null;
  enabled?: boolean;
  restingHr?: number | null;
  sleepMinutes?: number | null;
  activeMinutes?: number | null;
};

export function HealthSyncCard({ lastSyncedAt, enabled, restingHr, sleepMinutes, activeMinutes }: Props) {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snap, setSnap] = useState<HealthSnapshot | null>(null);
  const ingest = useServerFn(ingestHealthSnapshot);
  const qc = useQueryClient();

  useEffect(() => { setAvailable(isHealthAvailable()); }, []);

  const sync = async () => {
    if (!isHealthAvailable()) {
      toast.info("Health sync is available in the mobile app.");
      return;
    }
    setBusy(true);
    try {
      const s = await readHealthSnapshot(1);
      if (!s || s.source === "unavailable") {
        toast.error("Health permissions not granted.");
        return;
      }
      setSnap(s);
      await ingest({ data: s as any });
      toast.success("Health data synced");
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e?.message || "Sync failed");
    } finally {
      setBusy(false);
    }
  };

  // Auto-sync on mount (once) if permissions already granted
  useEffect(() => {
    if (!available) return;
    const t = setTimeout(() => { void sync(); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  if (!available && !enabled) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-white/60">
        <div className="flex items-center gap-2 mb-1"><ShieldCheck size={16} className="text-emerald-400" /><span className="text-white/80 font-medium">Health sources</span></div>
        Install MyNutriLens on iOS or Android to sync Apple Health / Health Connect data automatically.
      </div>
    );
  }

  const steps = snap?.steps;
  const cals = snap?.calories_burned;
  const hr = snap?.avg_heart_rate ?? restingHr ?? undefined;
  const sleep = snap?.sleep_minutes ?? sleepMinutes ?? undefined;
  const active = snap?.active_minutes ?? activeMinutes ?? undefined;
  const lastText = lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-emerald-400" />
          <span className="font-semibold text-white/90">Health sources</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 uppercase tracking-wider">
            {snap?.source === "healthkit" ? "Apple Health" : snap?.source === "health_connect" ? "Health Connect" : "Ready"}
          </span>
        </div>
        <button
          onClick={sync}
          disabled={busy}
          className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 disabled:opacity-50"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Sync
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Metric icon={<Footprints size={14} />} label="Steps" value={steps ? steps.toLocaleString() : "—"} />
        <Metric icon={<Activity size={14} />} label="Active" value={active ? `${active}m` : "—"} />
        <Metric icon={<Heart size={14} />} label="HR" value={hr ? `${hr}` : "—"} />
        <Metric icon={<Moon size={14} />} label="Sleep" value={sleep ? `${Math.floor(sleep/60)}h${sleep%60}` : "—"} />
      </div>
      <div className="mt-2 text-[11px] text-white/40">Last sync {lastText} · calories burned: {cals ?? "—"}</div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/5 p-2 text-center">
      <div className="text-emerald-400/80 flex justify-center mb-1">{icon}</div>
      <div className="text-xs text-white font-semibold">{value}</div>
      <div className="text-[10px] text-white/40 uppercase tracking-wider">{label}</div>
    </div>
  );
}
