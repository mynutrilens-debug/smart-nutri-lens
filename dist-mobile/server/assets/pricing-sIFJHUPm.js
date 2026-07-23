import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { u as useServerFn } from "./router-D-2d6VGp.js";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Crown, Zap, Check } from "lucide-react";
import { u as useSubscription, c as createRazorpayOrder, v as verifyRazorpayPayment, i as isTrialActive, t as trialMsLeft, f as formatCountdown, B as Button, P as PLAN_META } from "./button-Dk3VrbiD.js";
import { toast } from "sonner";
import "./client-BMbiJotd.js";
import "@supabase/supabase-js";
import "@capacitor/core";
import "./server-BadC42R4.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "zod";
import "./auth-middleware-B4NMxYBh.js";
import "./createMiddleware-BvN2ghIY.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
const PLANS = [{
  id: "silver",
  name: "Silver",
  price: 99,
  period: "one-time",
  icon: Sparkles,
  accent: "from-zinc-300 to-zinc-500",
  border: "border-zinc-400/30",
  features: ["15 personalized diet plans", "BMI & macro targets", "Region & cuisine matching", "One-time payment, no renewal"],
  locked: ["Workout plans", "Nutri Scanner", "AI Coach"]
}, {
  id: "gold",
  name: "Gold",
  price: 199,
  period: "/month",
  icon: Crown,
  accent: "from-amber-300 to-yellow-600",
  border: "border-amber-400/40",
  popular: true,
  features: ["Unlimited diet plans", "Unlimited workout plans", "Daily macro tracking", "Progress analytics"],
  locked: ["Nutri Scanner", "AI Coach"]
}, {
  id: "platinum",
  name: "Platinum",
  price: 399,
  period: "/month",
  icon: Zap,
  accent: "from-emerald-300 to-emerald-600",
  border: "border-emerald-400/40",
  features: ["Everything in Gold", "Nutri Scanner (AI food scan)", "AI Fitness Coach chatbot", "Priority support"],
  locked: []
}];
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}
function PricingPage() {
  const {
    data: sub
  } = useSubscription();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createOrder = useServerFn(createRazorpayOrder);
  const verify = useServerFn(verifyRazorpayPayment);
  const [paying, setPaying] = useState(null);
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((x) => x + 1), 1e3);
    return () => clearInterval(i);
  }, []);
  const trial = isTrialActive(sub);
  const ms = trialMsLeft(sub);
  const currentPlan = sub?.plan;
  async function handleBuy(plan) {
    try {
      setPaying(plan);
      const ok = await loadRazorpayScript();
      if (!ok) {
        toast.error("Failed to load payment SDK");
        return;
      }
      const order = await createOrder({
        data: {
          plan
        }
      });
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "MyNutriLens",
        description: `${PLAN_META[plan].name} plan`,
        order_id: order.orderId,
        theme: {
          color: "#10b981"
        },
        handler: async (resp) => {
          try {
            await verify({
              data: {
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                plan
              }
            });
            toast.success(`${PLAN_META[plan].name} plan activated!`);
            await qc.invalidateQueries({
              queryKey: ["subscription"]
            });
            navigate({
              to: "/home"
            });
          } catch (e) {
            toast.error(e?.message ?? "Verification failed");
          }
        },
        modal: {
          ondismiss: () => setPaying(null)
        }
      });
      rzp.on("payment.failed", () => toast.error("Payment failed"));
      rzp.open();
    } catch (e) {
      toast.error(e?.message ?? "Could not start payment");
    } finally {
      setPaying(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white pb-32 pt-3 px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx(Link, { to: "/home", className: "p-2 -ml-2", children: /* @__PURE__ */ jsx(ArrowLeft, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold", children: "Choose your plan" })
    ] }),
    trial && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 mb-4 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[11px] uppercase tracking-wider text-emerald-300/80", children: "Free trial" }),
      /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold tabular-nums", children: formatCountdown(ms) }),
      /* @__PURE__ */ jsx("div", { className: "text-[11px] text-zinc-400", children: "remaining · full access" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3", children: PLANS.map((p) => {
      const Icon = p.icon;
      const isCurrent = currentPlan === p.id && sub?.status === "active";
      return /* @__PURE__ */ jsxs("div", { className: `relative rounded-2xl border ${p.border} bg-zinc-900/60 backdrop-blur p-4 ${p.popular ? "ring-2 ring-amber-400/40" : ""}`, children: [
        p.popular && /* @__PURE__ */ jsx("span", { className: "absolute -top-2 right-4 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-black px-2 py-0.5 rounded-full", children: "Most popular" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: `h-10 w-10 rounded-xl bg-gradient-to-br ${p.accent} flex items-center justify-center`, children: /* @__PURE__ */ jsx(Icon, { className: "h-5 w-5 text-black" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-lg font-bold", children: p.name }),
              isCurrent && /* @__PURE__ */ jsx("span", { className: "text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full", children: "CURRENT" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-2xl font-extrabold", children: [
                "₹",
                p.price
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-zinc-400", children: p.period })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-3 space-y-1.5", children: [
          p.features.map((f) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-sm text-zinc-200", children: [
            /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 text-emerald-400 shrink-0" }),
            " ",
            f
          ] }, f)),
          p.locked.map((f) => /* @__PURE__ */ jsx("li", { className: "flex items-center gap-2 text-xs text-zinc-500 line-through", children: f }, f))
        ] }),
        /* @__PURE__ */ jsx(Button, { disabled: isCurrent || paying === p.id, onClick: () => handleBuy(p.id), className: `w-full mt-3 font-semibold ${p.id === "platinum" ? "bg-emerald-500 hover:bg-emerald-400 text-black" : p.id === "gold" ? "bg-amber-400 hover:bg-amber-300 text-black" : "bg-zinc-200 hover:bg-white text-black"}`, children: isCurrent ? "Current plan" : paying === p.id ? "Opening checkout…" : `Get ${p.name}` })
      ] }, p.id);
    }) }),
    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-zinc-500 text-center mt-4", children: "Secured by Razorpay · Cancel anytime · Prices in INR" })
  ] });
}
export {
  PricingPage as component
};
