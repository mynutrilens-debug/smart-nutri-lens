export const MONTHLY_PLANS = {
  silver: { name: "Silver", price: 199, recurring: true, blurb: "15 diet plans · monthly" },
  gold: { name: "Gold", price: 399, recurring: true, blurb: "Unlimited diet + workout plans" },
  platinum: { name: "Platinum", price: 599, recurring: true, blurb: "Everything + Scanner + AI Coach" },
} as const;

export type CyclePayment = { id: string; status: string; amount: number; currency: string; created_at: number; captured?: boolean };
export type ProviderCycle = { current_start?: number | null; current_end?: number | null };

export function verifiedPaidCycle(provider: ProviderCycle, payment: CyclePayment, amount: number) {
  if (payment.status !== "captured" || payment.captured === false || payment.amount !== amount || payment.currency !== "INR") {
    throw new Error("Full monthly payment has not been completed yet. Your plan will activate once payment is confirmed.");
  }
  const start = new Date((provider.current_start || payment.created_at) * 1000);
  if (provider.current_start && payment.created_at < provider.current_start - 300) {
    throw new Error("This payment does not belong to the current billing month.");
  }
  const end = new Date(start);
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  if (provider.current_end) end.setTime(provider.current_end * 1000);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    throw new Error("Payment period could not be confirmed.");
  }
  return { startedAt: start.toISOString(), expiresAt: end.toISOString() };
}