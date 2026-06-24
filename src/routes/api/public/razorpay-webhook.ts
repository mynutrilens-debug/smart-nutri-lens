import { createFileRoute } from "@tanstack/react-router";

async function hmacHex(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return new Response("Misconfigured", { status: 500 });
        const sig = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();
        const expected = await hmacHex(secret, body);
        if (!timingSafeEqual(sig, expected)) {
          return new Response("Invalid signature", { status: 401 });
        }
        let event: any;
        try { event = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const payment = event?.payload?.payment?.entity;
        if (payment?.order_id) {
          await supabaseAdmin.from("payments").update({
            status: event.event === "payment.captured" ? "paid" :
                    event.event === "payment.failed" ? "failed" : payment.status,
            raw_event: event,
            razorpay_payment_id: payment.id,
          }).eq("razorpay_order_id", payment.order_id);
        }
        return new Response("ok");
      },
    },
  },
});
