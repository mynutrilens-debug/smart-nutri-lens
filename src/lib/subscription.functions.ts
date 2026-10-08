import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MONTHLY_PLANS, verifiedPaidCycle, type CyclePayment } from "@/lib/billing-cycle";

export const PLAN_PRICES = {
  silver: { amount: MONTHLY_PLANS.silver.price * 100, label: "Silver", inr: MONTHLY_PLANS.silver.price },
  gold: { amount: MONTHLY_PLANS.gold.price * 100, label: "Gold", inr: MONTHLY_PLANS.gold.price },
  platinum: { amount: MONTHLY_PLANS.platinum.price * 100, label: "Platinum", inr: MONTHLY_PLANS.platinum.price },
} as const;

export type PaidPlan = keyof typeof PLAN_PRICES;

function razorpayAuth() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  return { keyId, keySecret, authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` };
}

async function razorpayRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { authorization } = razorpayAuth();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { Authorization: authorization, "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Razorpay request failed", response.status, detail);
    throw new Error("Razorpay could not start the subscription. Please try again.");
  }
  return response.json() as Promise<T>;
}

async function hmacSha256Hex(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

type RazorpayPlan = { id: string; period: string; interval: number; item: { name: string; amount: number; currency: string } };
type RazorpaySubscription = {
  id: string;
  plan_id: string;
  status: string;
  start_at: number;
  charge_at: number;
  current_start: number | null;
  current_end: number | null;
  notes?: Record<string, string>;
};

async function findOrCreatePlan(plan: PaidPlan) {
  const config = PLAN_PRICES[plan];
  const plans = await razorpayRequest<{ items: RazorpayPlan[] }>("/plans?count=100");
  const existing = plans.items.find((item) =>
    item.period === "monthly" && item.interval === 1 && item.item.amount === config.amount &&
    item.item.currency === "INR" && item.item.name === `MyNutriLens ${config.label}`,
  );
  if (existing) return existing.id;
  const created = await razorpayRequest<RazorpayPlan>("/plans", {
    method: "POST",
    body: JSON.stringify({
      period: "monthly",
      interval: 1,
      item: {
        name: `MyNutriLens ${config.label}`,
        description: `${config.label} monthly membership`,
        amount: config.amount,
        currency: "INR",
      },
    }),
  });
  return created.id;
}

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("subscriptions").select("*").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const createRazorpaySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ plan: z.enum(["silver", "gold", "platinum"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: current, error } = await context.supabase.from("subscriptions").select("*").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!current) throw new Error("Complete your profile before selecting a plan.");
    if (current.razorpay_subscription_id && ["active", "pending", "retrying"].includes(current.status)) {
      const existing = await razorpayRequest<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(current.razorpay_subscription_id)}`);
      if (!["created", "expired", "cancelled", "completed"].includes(existing.status)) {
        throw new Error("You already have a subscription in progress. Manage or cancel it before choosing another plan.");
      }
      if (existing.status === "created") {
        await razorpayRequest(`/subscriptions/${encodeURIComponent(existing.id)}/cancel`, {
          method: "POST", body: JSON.stringify({ cancel_at_cycle_end: false }),
        });
      }
    }

    const { keyId } = razorpayAuth();
    const providerPlanId = await findOrCreatePlan(data.plan);
    const firstCharge = new Date();
    const expireBy = Math.floor(Date.now() / 1000) + 60 * 60;
    const providerSubscription = await razorpayRequest<RazorpaySubscription>("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        plan_id: providerPlanId,
        total_count: 100,
        quantity: 1,
        customer_notify: 1,
        expire_by: expireBy,
        notes: { user_id: context.userId, plan: data.plan, billing_mode: "paid_monthly" },
      }),
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: updateError } = await supabaseAdmin.from("subscriptions").update({
      plan: data.plan,
      status: "pending",
      provider_status: providerSubscription.status,
      mandate_status: "authorizing",
      razorpay_plan_id: providerPlanId,
      razorpay_subscription_id: providerSubscription.id,
      trial_started_at: new Date().toISOString(),
      trial_expires_at: firstCharge.toISOString(),
      current_period_started_at: null,
      current_period_expires_at: null,
      amount_paid: null,
      silver_plans_used: 0,
      first_charge_at: firstCharge.toISOString(),
      next_charge_at: firstCharge.toISOString(),
      cancel_at_period_end: false,
      cancelled_at: null,
      retry_count: 0,
      grace_expires_at: null,
    }).eq("user_id", context.userId);
    if (updateError) throw new Error(updateError.message);

    return { subscriptionId: providerSubscription.id, keyId, plan: data.plan, amount: PLAN_PRICES[data.plan].amount, currency: "INR" };
  });

export const verifyRazorpaySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    razorpay_payment_id: z.string().min(1),
    razorpay_subscription_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: stored, error } = await context.supabase.from("subscriptions").select("*").eq("user_id", context.userId).maybeSingle();
    if (error || !stored) throw new Error("Subscription record not found.");
    if (stored.razorpay_subscription_id !== data.razorpay_subscription_id) throw new Error("Subscription verification failed.");

    const { keySecret } = razorpayAuth();
    const expected = await hmacSha256Hex(keySecret, `${data.razorpay_payment_id}|${data.razorpay_subscription_id}`);
    if (!timingSafeEqual(expected, data.razorpay_signature)) throw new Error("Subscription verification failed.");

    const provider = await razorpayRequest<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(data.razorpay_subscription_id)}`);
    if (provider.id !== stored.razorpay_subscription_id || !["authenticated", "active"].includes(provider.status)) {
      throw new Error("The payment mandate is not authorized yet.");
    }

    if (provider.plan_id !== stored.razorpay_plan_id || provider.notes?.user_id !== context.userId ||
        (stored.plan !== "silver" && stored.plan !== "gold" && stored.plan !== "platinum")) {
      throw new Error("Subscription verification failed.");
    }
    const payment = await razorpayRequest<CyclePayment>(`/payments/${encodeURIComponent(data.razorpay_payment_id)}`);
    const cycle = verifiedPaidCycle(provider, payment, PLAN_PRICES[stored.plan].amount);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: updateError } = await supabaseAdmin.from("subscriptions").update({
      status: "active",
      provider_status: provider.status,
      mandate_status: "authorized",
      trial_expires_at: cycle.startedAt,
      current_period_started_at: cycle.startedAt,
      current_period_expires_at: cycle.expiresAt,
      first_charge_at: cycle.startedAt,
      next_charge_at: provider.charge_at ? new Date(provider.charge_at * 1000).toISOString() : cycle.expiresAt,
      razorpay_payment_id: data.razorpay_payment_id,
      amount_paid: payment.amount,
      currency: payment.currency,
      retry_count: 0,
      grace_expires_at: null,
      last_payment_failed_at: null,
      trial_consumed: true,
    }).eq("user_id", context.userId).eq("razorpay_subscription_id", data.razorpay_subscription_id);
    if (updateError) throw new Error(updateError.message);
    return { ok: true, plan: stored.plan, expiresAt: cycle.expiresAt };
  });

export const cancelMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: stored, error } = await context.supabase.from("subscriptions").select("*").eq("user_id", context.userId).maybeSingle();
    if (error || !stored?.razorpay_subscription_id) throw new Error("No recurring subscription was found.");
    const hasPaidPeriod = !!stored.current_period_expires_at && new Date(stored.current_period_expires_at).getTime() > Date.now();
    const immediate = !hasPaidPeriod;
    const cancelled = await razorpayRequest<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(stored.razorpay_subscription_id)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ cancel_at_cycle_end: !immediate }),
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: updateError } = await supabaseAdmin.from("subscriptions").update({
      status: immediate ? "cancelled" : stored.status,
      provider_status: cancelled.status,
      mandate_status: immediate ? "cancelled" : stored.mandate_status,
      cancel_at_period_end: !immediate,
      cancelled_at: immediate ? new Date().toISOString() : null,
    }).eq("user_id", context.userId);
    if (updateError) throw new Error(updateError.message);
    return { ok: true, immediate };
  });