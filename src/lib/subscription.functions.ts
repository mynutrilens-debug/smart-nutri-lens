import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PLAN_PRICES = {
  silver: { amount: 9900, label: "Silver", inr: 99 },
  gold: { amount: 19900, label: "Gold", inr: 199 },
  platinum: { amount: 39900, label: "Platinum", inr: 399 },
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
      throw new Error("You already have a subscription or mandate in progress.");
    }
    if (current.trial_consumed) throw new Error("Your free trial has already been used. Please contact support to restart billing.");

    const { keyId } = razorpayAuth();
    const providerPlanId = await findOrCreatePlan(data.plan);
    const firstCharge = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expireBy = Math.floor(Date.now() / 1000) + 60 * 60;
    const providerSubscription = await razorpayRequest<RazorpaySubscription>("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        plan_id: providerPlanId,
        total_count: 100,
        quantity: 1,
        customer_notify: 1,
        start_at: Math.floor(firstCharge.getTime() / 1000),
        expire_by: expireBy,
        notes: { user_id: context.userId, plan: data.plan, trial_days: "7" },
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
      first_charge_at: firstCharge.toISOString(),
      next_charge_at: firstCharge.toISOString(),
      cancel_at_period_end: false,
      cancelled_at: null,
      retry_count: 0,
      grace_expires_at: null,
    }).eq("user_id", context.userId);
    if (updateError) throw new Error(updateError.message);

    return { subscriptionId: providerSubscription.id, keyId, plan: data.plan, firstChargeAt: firstCharge.toISOString() };
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

    const trialEnd = new Date((provider.start_at || provider.charge_at) * 1000).toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: updateError } = await supabaseAdmin.from("subscriptions").update({
      status: provider.status === "active" ? "active" : "pending",
      provider_status: provider.status,
      mandate_status: "authorized",
      trial_authorized_at: new Date().toISOString(),
      trial_expires_at: trialEnd,
      first_charge_at: trialEnd,
      next_charge_at: new Date(provider.charge_at * 1000).toISOString(),
      razorpay_payment_id: data.razorpay_payment_id,
      trial_consumed: true,
    }).eq("user_id", context.userId).eq("razorpay_subscription_id", data.razorpay_subscription_id);
    if (updateError) throw new Error(updateError.message);
    return { ok: true, plan: stored.plan, trialExpiresAt: trialEnd };
  });

export const cancelMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: stored, error } = await context.supabase.from("subscriptions").select("*").eq("user_id", context.userId).maybeSingle();
    if (error || !stored?.razorpay_subscription_id) throw new Error("No recurring subscription was found.");
    const inTrial = stored.mandate_status === "authorized" && new Date(stored.trial_expires_at).getTime() > Date.now();
    const cancelled = await razorpayRequest<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(stored.razorpay_subscription_id)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ cancel_at_cycle_end: !inTrial }),
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("subscriptions").update({
      status: inTrial ? "cancelled" : stored.status,
      provider_status: cancelled.status,
      mandate_status: inTrial ? "cancelled" : stored.mandate_status,
      cancel_at_period_end: !inTrial,
      cancelled_at: inTrial ? new Date().toISOString() : null,
    }).eq("user_id", context.userId);
    return { ok: true, immediate: inTrial };
  });