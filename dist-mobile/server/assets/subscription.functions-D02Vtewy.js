import { c as createServerRpc } from "./createServerRpc-S7gwSw9F.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as createServerFn } from "./server-BadC42R4.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const PLAN_PRICES = {
  silver: {
    amount: 9900,
    label: "Silver",
    inr: 99,
    recurring: false
  },
  gold: {
    amount: 19900,
    label: "Gold",
    inr: 199,
    recurring: true
  },
  platinum: {
    amount: 39900,
    label: "Platinum",
    inr: 399,
    recurring: true
  }
};
const getRazorpayPublicKey_createServerFn_handler = createServerRpc({
  id: "e8ca207400c705e936756cb84c6682821429ba96421106353792c0ca66b52c94",
  name: "getRazorpayPublicKey",
  filename: "src/lib/subscription.functions.ts"
}, (opts) => getRazorpayPublicKey.__executeServer(opts));
const getRazorpayPublicKey = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getRazorpayPublicKey_createServerFn_handler, async () => {
  return {
    keyId: process.env.RAZORPAY_KEY_ID ?? ""
  };
});
const getMySubscription_createServerFn_handler = createServerRpc({
  id: "9426669075fecaa116539005d65966feb0dd23a91150d7afcc43e32fbbca7cc6",
  name: "getMySubscription",
  filename: "src/lib/subscription.functions.ts"
}, (opts) => getMySubscription.__executeServer(opts));
const getMySubscription = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMySubscription_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data,
    error
  } = await supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (data) {
    const now = /* @__PURE__ */ new Date();
    let needsUpdate = false;
    const patch = {};
    if (data.plan === "trial" && data.status === "active" && new Date(data.trial_expires_at) < now) {
      patch.status = "expired";
      needsUpdate = true;
    }
    if ((data.plan === "gold" || data.plan === "platinum") && data.status === "active" && data.current_period_expires_at && new Date(data.current_period_expires_at) < now) {
      patch.status = "expired";
      needsUpdate = true;
    }
    if (needsUpdate) {
      await supabase.from("subscriptions").update(patch).eq("user_id", userId);
      return {
        ...data,
        ...patch
      };
    }
  }
  return data;
});
const createRazorpayOrder_createServerFn_handler = createServerRpc({
  id: "340365f48e3bf13502a7d1344042670dc21fc3238848737d09b42cf4c9c0314c",
  name: "createRazorpayOrder",
  filename: "src/lib/subscription.functions.ts"
}, (opts) => createRazorpayOrder.__executeServer(opts));
const createRazorpayOrder = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  plan: z.enum(["silver", "gold", "platinum"])
}).parse(d)).handler(createRazorpayOrder_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    userId,
    supabase
  } = context;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay not configured");
  const cfg = PLAN_PRICES[data.plan];
  const receipt = `rcpt_${Date.now().toString(36)}_${userId.slice(0, 8)}`;
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa(`${keyId}:${keySecret}`)
    },
    body: JSON.stringify({
      amount: cfg.amount,
      currency: "INR",
      receipt,
      notes: {
        user_id: userId,
        plan: data.plan
      }
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Razorpay order failed: ${t}`);
  }
  const order = await res.json();
  await supabase.from("payments").insert({
    user_id: userId,
    plan: data.plan,
    razorpay_order_id: order.id,
    amount: cfg.amount,
    currency: "INR",
    status: "created"
  });
  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    plan: data.plan,
    keyId
  };
});
async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), {
    name: "HMAC",
    hash: "SHA-256"
  }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const verifyRazorpayPayment_createServerFn_handler = createServerRpc({
  id: "bd1deeb6b77426771f0b79aa868807394867d8d40d6c55872a45b77220a2324d",
  name: "verifyRazorpayPayment",
  filename: "src/lib/subscription.functions.ts"
}, (opts) => verifyRazorpayPayment.__executeServer(opts));
const verifyRazorpayPayment = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  plan: z.enum(["silver", "gold", "platinum"])
}).parse(d)).handler(verifyRazorpayPayment_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("Razorpay not configured");
  const expected = await hmacSha256Hex(secret, `${data.razorpay_order_id}|${data.razorpay_payment_id}`);
  if (expected !== data.razorpay_signature) {
    await supabase.from("payments").update({
      status: "failed"
    }).eq("razorpay_order_id", data.razorpay_order_id);
    throw new Error("Invalid signature");
  }
  await supabase.from("payments").update({
    razorpay_payment_id: data.razorpay_payment_id,
    razorpay_signature: data.razorpay_signature,
    status: "paid"
  }).eq("razorpay_order_id", data.razorpay_order_id);
  const now = /* @__PURE__ */ new Date();
  const periodEnd = data.plan === "silver" ? null : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1e3).toISOString();
  const patch = {
    plan: data.plan,
    status: "active",
    razorpay_order_id: data.razorpay_order_id,
    razorpay_payment_id: data.razorpay_payment_id,
    current_period_started_at: now.toISOString(),
    current_period_expires_at: periodEnd,
    amount_paid: PLAN_PRICES[data.plan].amount,
    currency: "INR"
  };
  if (data.plan === "silver") patch.silver_plans_used = 0;
  const {
    error
  } = await supabase.from("subscriptions").update(patch).eq("user_id", userId);
  if (error) throw new Error(error.message);
  return {
    ok: true,
    plan: data.plan
  };
});
export {
  createRazorpayOrder_createServerFn_handler,
  getMySubscription_createServerFn_handler,
  getRazorpayPublicKey_createServerFn_handler,
  verifyRazorpayPayment_createServerFn_handler
};
