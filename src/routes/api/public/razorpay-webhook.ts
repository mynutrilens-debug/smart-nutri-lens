import { createFileRoute } from "@tanstack/react-router";

async function hmacHex(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(message: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

function iso(epoch?: number | null) {
  return epoch ? new Date(epoch * 1000).toISOString() : null;
}

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return new Response("Misconfigured", { status: 500 });
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();
        const expected = await hmacHex(secret, body);
        if (!timingSafeEqual(signature, expected)) return new Response("Invalid signature", { status: 401 });

        let event: any;
        try { event = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }
        const eventType = String(event?.event ?? "unknown");
        const eventId = request.headers.get("x-razorpay-event-id") ?? await sha256Hex(body);
        const providerSub = event?.payload?.subscription?.entity;
        const payment = event?.payload?.payment?.entity;
        const subscriptionId = String(providerSub?.id ?? payment?.subscription_id ?? "");
        if (!subscriptionId) return new Response("Ignored", { status: 200 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: seen } = await supabaseAdmin.from("billing_webhook_events").select("event_id").eq("event_id", eventId).maybeSingle();
        if (seen) return new Response("ok", { status: 200 });

        const { data: subscription } = await supabaseAdmin.from("subscriptions").select("*").eq("razorpay_subscription_id", subscriptionId).maybeSingle();
        if (!subscription) return new Response("Unknown subscription", { status: 200 });

        const patch: Record<string, unknown> = {
          provider_status: providerSub?.status ?? subscription.provider_status,
          next_charge_at: iso(providerSub?.charge_at) ?? subscription.next_charge_at,
          last_webhook_at: new Date().toISOString(),
        };

        if (eventType === "subscription.authenticated") {
          patch.status = "pending";
          patch.mandate_status = "authorized";
          patch.trial_authorized_at = subscription.trial_authorized_at ?? new Date().toISOString();
          patch.trial_consumed = true;
        } else if (eventType === "subscription.activated" || eventType === "subscription.charged") {
          patch.status = "active";
          patch.mandate_status = "authorized";
          patch.current_period_started_at = iso(providerSub?.current_start) ?? new Date().toISOString();
          patch.current_period_expires_at = iso(providerSub?.current_end);
          patch.retry_count = 0;
          patch.last_payment_failed_at = null;
          patch.grace_expires_at = null;
        } else if (eventType === "subscription.pending" || eventType === "payment.failed") {
          patch.status = "retrying";
          patch.retry_count = (subscription.retry_count ?? 0) + 1;
          patch.last_payment_failed_at = new Date().toISOString();
          patch.grace_expires_at = subscription.current_period_expires_at && new Date(subscription.current_period_expires_at).getTime() > Date.now()
            ? subscription.current_period_expires_at
            : new Date(Date.now() + 3 * 86400000).toISOString();
        } else if (eventType === "subscription.halted") {
          patch.status = "halted";
          patch.grace_expires_at = null;
        } else if (eventType === "subscription.cancelled") {
          patch.status = "cancelled";
          patch.mandate_status = "cancelled";
          patch.cancelled_at = new Date().toISOString();
          patch.cancel_at_period_end = false;
        } else if (eventType === "subscription.completed") {
          patch.status = "completed";
          patch.mandate_status = "completed";
          patch.current_period_expires_at = iso(providerSub?.ended_at) ?? subscription.current_period_expires_at;
        }

        const { error: updateError } = await supabaseAdmin.from("subscriptions").update(patch).eq("id", subscription.id);
        if (updateError) {
          console.error("Subscription webhook update failed", updateError.message);
          return new Response("Processing failed", { status: 500 });
        }

        if (payment?.id) {
          const { data: existingPayment } = await supabaseAdmin.from("payments").select("id").eq("razorpay_payment_id", payment.id).maybeSingle();
          const paymentRow = {
            user_id: subscription.user_id,
            plan: subscription.plan,
            razorpay_order_id: payment.order_id ?? null,
            razorpay_payment_id: payment.id,
            razorpay_subscription_id: subscriptionId,
            provider_event_id: eventId,
            amount: Number(payment.amount ?? 0),
            currency: String(payment.currency ?? "INR"),
            status: eventType === "payment.failed" ? "failed" : String(payment.status ?? "captured"),
            billing_reason: eventType === "subscription.authenticated" ? "mandate_authorization" : "subscription_cycle",
            paid_at: payment.captured_at ? iso(payment.captured_at) : null,
            failure_reason: payment.error_description ?? null,
            raw_event: event,
          };
          if (existingPayment) await supabaseAdmin.from("payments").update(paymentRow).eq("id", existingPayment.id);
          else await supabaseAdmin.from("payments").insert(paymentRow);
        }

        const { error: ledgerError } = await supabaseAdmin.from("billing_webhook_events").insert({
          event_id: eventId,
          event_type: eventType,
          provider_subscription_id: subscriptionId,
          payload: event,
        });
        if (ledgerError && ledgerError.code !== "23505") {
          console.error("Webhook ledger insert failed", ledgerError.message);
          return new Response("Processing failed", { status: 500 });
        }
        return new Response("ok");
      },
    },
  },
});