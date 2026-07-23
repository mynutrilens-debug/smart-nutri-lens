import { useQuery } from "@tanstack/react-query";
import { c as createSsrRpc, u as useServerFn } from "./router-D-2d6VGp.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as createServerFn } from "./server-BadC42R4.js";
import { jsx } from "react/jsx-runtime";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { c as cn } from "./utils-H80jjgLf.js";
createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("e8ca207400c705e936756cb84c6682821429ba96421106353792c0ca66b52c94"));
const getMySubscription = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("9426669075fecaa116539005d65966feb0dd23a91150d7afcc43e32fbbca7cc6"));
const createRazorpayOrder = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  plan: z.enum(["silver", "gold", "platinum"])
}).parse(d)).handler(createSsrRpc("340365f48e3bf13502a7d1344042670dc21fc3238848737d09b42cf4c9c0314c"));
const verifyRazorpayPayment = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  plan: z.enum(["silver", "gold", "platinum"])
}).parse(d)).handler(createSsrRpc("bd1deeb6b77426771f0b79aa868807394867d8d40d6c55872a45b77220a2324d"));
const PLAN_META = {
  silver: { name: "Silver", price: 99, recurring: false, blurb: "15 diet plans · one-time" },
  gold: { name: "Gold", price: 199, recurring: true, blurb: "Unlimited diet + workout plans" },
  platinum: { name: "Platinum", price: 399, recurring: true, blurb: "Everything + Scanner + AI Coach" }
};
function isTrialActive(sub) {
  if (!sub) return false;
  if (sub.plan !== "trial") return false;
  if (sub.status !== "active") return false;
  return new Date(sub.trial_expires_at).getTime() > Date.now();
}
function isPaidActive(sub) {
  if (!sub || sub.status !== "active") return false;
  if (sub.plan === "silver") return (sub.silver_plans_used ?? 0) < 15;
  if (sub.plan === "gold" || sub.plan === "platinum") {
    return !sub.current_period_expires_at || new Date(sub.current_period_expires_at).getTime() > Date.now();
  }
  return false;
}
function hasFeature(sub, feat) {
  if (isTrialActive(sub)) return true;
  if (!isPaidActive(sub)) return false;
  const plan = sub.plan;
  if (plan === "platinum") return true;
  if (plan === "gold") return feat === "diet" || feat === "workout";
  if (plan === "silver") return feat === "diet";
  return false;
}
function trialMsLeft(sub) {
  if (!sub || sub.plan !== "trial") return 0;
  return Math.max(0, new Date(sub.trial_expires_at).getTime() - Date.now());
}
function formatCountdown(ms) {
  if (ms <= 0) return "Expired";
  const totalSec = Math.floor(ms / 1e3);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor(totalSec % 86400 / 3600);
  const m = Math.floor(totalSec % 3600 / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
function useSubscription() {
  const fn = useServerFn(getMySubscription);
  return useQuery({
    queryKey: ["subscription"],
    queryFn: () => fn(),
    staleTime: 3e4,
    refetchOnWindowFocus: true
  });
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
export {
  Button as B,
  PLAN_META as P,
  isPaidActive as a,
  createRazorpayOrder as c,
  formatCountdown as f,
  hasFeature as h,
  isTrialActive as i,
  trialMsLeft as t,
  useSubscription as u,
  verifyRazorpayPayment as v
};
