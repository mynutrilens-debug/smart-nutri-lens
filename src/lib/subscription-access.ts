export type PaidFeature = "diet" | "workout" | "scanner" | "ai_chat";

export type BillingSubscription = {
  plan?: "trial" | "silver" | "gold" | "platinum" | "expired" | null;
  status?: "active" | "retrying" | "halted" | "expired" | "cancelled" | "pending" | "completed" | null;
  trial_expires_at?: string | null;
  current_period_expires_at?: string | null;
  grace_expires_at?: string | null;
  mandate_status?: string | null;
  silver_plans_used?: number | null;
};

export function hasBillingAccess(sub: BillingSubscription | null | undefined, feature: PaidFeature, now = new Date()): boolean {
  if (!sub || !sub.plan || sub.plan === "trial" || sub.plan === "expired") return false;

  const trialActive = sub.mandate_status === "authorized" &&
    !!sub.trial_expires_at && new Date(sub.trial_expires_at).getTime() > now.getTime() &&
    (sub.status === "active" || sub.status === "pending");
  const paidActive = sub.status === "active" &&
    (!sub.current_period_expires_at || new Date(sub.current_period_expires_at).getTime() > now.getTime());
  const retryGrace = sub.status === "retrying" && !!sub.grace_expires_at &&
    new Date(sub.grace_expires_at).getTime() > now.getTime();

  if (!trialActive && !paidActive && !retryGrace) return false;
  if (sub.plan === "platinum") return true;
  if (sub.plan === "gold") return feature === "diet" || feature === "workout";
  if (sub.plan === "silver") return feature === "diet" && (sub.silver_plans_used ?? 0) < 15;
  return false;
}

export async function requireBillingFeature(
  supabase: { from: (table: string) => any },
  userId: string,
  feature: PaidFeature,
  message: string,
) {
  const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!hasBillingAccess(data, feature)) throw new Error(message);
  return data as BillingSubscription;
}