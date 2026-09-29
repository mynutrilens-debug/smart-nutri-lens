// Client-side subscription helpers
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMySubscription } from "@/lib/subscription.functions";
import { hasBillingAccess } from "@/lib/subscription-access";

export type Feature = "diet" | "workout" | "scanner" | "ai_chat";

export type SubscriptionRow = {
  plan: "trial" | "silver" | "gold" | "platinum" | "expired";
  status: "active" | "retrying" | "halted" | "expired" | "cancelled" | "pending" | "completed";
  trial_expires_at: string;
  current_period_expires_at: string | null;
  next_charge_at?: string | null;
  first_charge_at?: string | null;
  grace_expires_at?: string | null;
  mandate_status?: string | null;
  provider_status?: string | null;
  cancel_at_period_end?: boolean;
  cancelled_at?: string | null;
  razorpay_subscription_id?: string | null;
  silver_plans_used: number;
} | null;

export const PLAN_META = {
  silver: { name: "Silver", price: 99, recurring: true, blurb: "15 diet plans · monthly" },
  gold: { name: "Gold", price: 199, recurring: true, blurb: "Unlimited diet + workout plans" },
  platinum: { name: "Platinum", price: 399, recurring: true, blurb: "Everything + Scanner + AI Coach" },
} as const;

export function isTrialActive(sub: SubscriptionRow): boolean {
  if (!sub) return false;
  if (sub.mandate_status !== "authorized") return false;
  if (sub.status !== "active" && sub.status !== "pending") return false;
  return new Date(sub.trial_expires_at).getTime() > Date.now();
}

export function isPaidActive(sub: SubscriptionRow): boolean {
  if (!sub || sub.plan === "trial" || sub.plan === "expired") return false;
  return hasBillingAccess(sub, "diet");
}

export function hasFeature(sub: SubscriptionRow, feat: Feature): boolean {
  return hasBillingAccess(sub, feat);
}

export function trialMsLeft(sub: SubscriptionRow): number {
  if (!sub || sub.mandate_status !== "authorized") return 0;
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
