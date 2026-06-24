// Client-side subscription helpers
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMySubscription } from "@/lib/subscription.functions";

export type Feature = "diet" | "workout" | "scanner" | "ai_chat";

export type SubscriptionRow = {
  plan: "trial" | "silver" | "gold" | "platinum" | "expired";
  status: "active" | "expired" | "cancelled" | "pending";
  trial_expires_at: string;
  current_period_expires_at: string | null;
  silver_plans_used: number;
} | null;

export const PLAN_META = {
  silver: { name: "Silver", price: 99, recurring: false, blurb: "15 diet plans · one-time" },
  gold: { name: "Gold", price: 199, recurring: true, blurb: "Unlimited diet + workout plans" },
  platinum: { name: "Platinum", price: 399, recurring: true, blurb: "Everything + Scanner + AI Coach" },
} as const;

export function isTrialActive(sub: SubscriptionRow): boolean {
  if (!sub) return false;
  if (sub.plan !== "trial") return false;
  if (sub.status !== "active") return false;
  return new Date(sub.trial_expires_at).getTime() > Date.now();
}

export function isPaidActive(sub: SubscriptionRow): boolean {
  if (!sub || sub.status !== "active") return false;
  if (sub.plan === "silver") return (sub.silver_plans_used ?? 0) < 15;
  if (sub.plan === "gold" || sub.plan === "platinum") {
    return !sub.current_period_expires_at ||
      new Date(sub.current_period_expires_at).getTime() > Date.now();
  }
  return false;
}

export function hasFeature(sub: SubscriptionRow, feat: Feature): boolean {
  if (isTrialActive(sub)) return true; // Full Platinum access during trial
  if (!isPaidActive(sub)) return false;
  const plan = sub!.plan;
  if (plan === "platinum") return true;
  if (plan === "gold") return feat === "diet" || feat === "workout";
  if (plan === "silver") return feat === "diet";
  return false;
}

export function trialMsLeft(sub: SubscriptionRow): number {
  if (!sub || sub.plan !== "trial") return 0;
  return Math.max(0, new Date(sub.trial_expires_at).getTime() - Date.now());
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function useSubscription() {
  const fn = useServerFn(getMySubscription);
  return useQuery({
    queryKey: ["subscription"],
    queryFn: () => fn(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
