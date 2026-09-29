import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Sparkles, Zap, ArrowLeft, CreditCard, Smartphone, CalendarClock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createRazorpaySubscription, verifyRazorpaySubscription, cancelMySubscription } from "@/lib/subscription.functions";
import { useSubscription, PLAN_META, isTrialActive, trialMsLeft, formatCountdown } from "@/lib/subscription";

export const Route = createFileRoute("/_app/pricing")({
  component: PricingPage,
  head: () => ({ meta: [
    { title: "Plans & Billing — MyNutriLens" },
    { name: "description", content: "Choose a MyNutriLens plan with a seven-day trial and secure monthly UPI AutoPay or card billing." },
    { property: "og:title", content: "Plans & Billing — MyNutriLens" },
    { property: "og:description", content: "Choose a MyNutriLens plan with a seven-day trial and secure monthly billing." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

const PLANS = [
  {
    id: "silver" as const,
    name: "Silver",
    price: 99,
    period: "/month",
    icon: Sparkles,
    accent: "from-zinc-300 to-zinc-500",
    border: "border-zinc-400/30",
    features: [
      "15 personalized diet plans",
      "BMI & macro targets",
      "Region & cuisine matching",
      "Renews monthly after trial",
    ],
    locked: ["Workout plans", "Nutri Scanner", "AI Coach"],
  },
  {
    id: "gold" as const,
    name: "Gold",
    price: 199,
    period: "/month",
    icon: Crown,
    accent: "from-amber-300 to-yellow-600",
    border: "border-amber-400/40",
    popular: true,
    features: [
      "Unlimited diet plans",
      "Unlimited workout plans",
      "Daily macro tracking",
      "Progress analytics",
    ],
    locked: ["Nutri Scanner", "AI Coach"],
  },
  {
    id: "platinum" as const,
    name: "Platinum",
    price: 399,
    period: "/month",
    icon: Zap,
    accent: "from-emerald-300 to-emerald-600",
    border: "border-emerald-400/40",
    features: [
      "Everything in Gold",
      "Nutri Scanner (AI food scan)",
      "AI Fitness Coach chatbot",
      "Priority support",
    ],
    locked: [],
  },
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function PricingPage() {
  const { data: sub } = useSubscription();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createSubscription = useServerFn(createRazorpaySubscription);
  const verify = useServerFn(verifyRazorpaySubscription);
  const cancelSubscription = useServerFn(cancelMySubscription);
  const [paying, setPaying] = useState<string | null>(null);
  const [method, setMethod] = useState<"upi" | "card">("upi");
  const [cancelling, setCancelling] = useState(false);
  const [, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force(x => x + 1), 1000); return () => clearInterval(i); }, []);

  const trial = isTrialActive(sub as any);
  const ms = trialMsLeft(sub as any);
  const currentPlan = sub?.plan;

  async function handleBuy(plan: "silver" | "gold" | "platinum") {
    try {
      setPaying(plan);
      const ok = await loadRazorpayScript();
      if (!ok) { toast.error("Failed to load payment SDK"); return; }
      const order = await createSubscription({ data: { plan } });
      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        name: "MyNutriLens",
        description: `${PLAN_META[plan].name} monthly plan · 7 days free`,
        subscription_id: order.subscriptionId,
        method: method === "upi" ? { upi: true, card: false } : { card: true, upi: false },
        recurring: true,
        theme: { color: "#10b981" },
        handler: async (resp: any) => {
          try {
            await verify({ data: {
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_subscription_id: resp.razorpay_subscription_id,
              razorpay_signature: resp.razorpay_signature,
            }});
            toast.success(`${PLAN_META[plan].name} trial activated. First charge is in 7 days.`);
            await qc.invalidateQueries({ queryKey: ["subscription"] });
            navigate({ to: "/home" });
          } catch (e: any) {
            toast.error(e?.message ?? "Verification failed");
          }
        },
        modal: { ondismiss: () => setPaying(null) },
      });
       rzp.on("payment.failed", () => toast.error("Mandate authorization failed. You have not been charged."));
      rzp.open();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start payment");
    } finally {
      setPaying(null);
    }
  }

  async function handleCancel() {
    try {
      setCancelling(true);
      const result = await cancelSubscription();
      toast.success(result.immediate ? "Trial cancelled. You will not be charged." : "Renewal cancelled. Access remains until your current period ends.");
      await qc.invalidateQueries({ queryKey: ["subscription"] });
    } catch (error: any) {
      toast.error(error?.message ?? "Could not cancel subscription");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white pb-32 pt-3 px-4">
      <div className="flex items-center gap-2 mb-3">
        <Link to="/home" className="p-2 -ml-2"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold">Choose your plan</h1>
      </div>

      {trial && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 mb-4 text-center">
          <div className="text-[11px] uppercase tracking-wider text-emerald-300/80">Free trial</div>
          <div className="text-2xl font-bold tabular-nums">{formatCountdown(ms)}</div>
          <div className="text-[11px] text-zinc-400">remaining · ₹{PLAN_META[sub.plan as keyof typeof PLAN_META]?.price ?? 0} first charge on {sub.first_charge_at ? new Date(sub.first_charge_at).toLocaleDateString("en-IN") : "Day 8"}</div>
        </div>
      )}

      {sub?.razorpay_subscription_id && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold capitalize">{sub.status === "retrying" ? "Payment retrying" : sub.cancel_at_period_end ? "Cancellation scheduled" : `${sub.plan} membership`}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {sub.status === "retrying" ? "Razorpay will retry automatically. Access ends if retries fail." : sub.next_charge_at ? `Next charge: ${new Date(sub.next_charge_at).toLocaleDateString("en-IN")}` : "Billing status updates automatically."}
              </div>
            </div>
            {!sub.cancel_at_period_end && sub.status !== "cancelled" && (
              <Button variant="outline" size="sm" disabled={cancelling} onClick={handleCancel}>{cancelling ? "Cancelling…" : "Cancel"}</Button>
            )}
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Authorize with</div>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-zinc-900/70 p-1.5">
          <Button variant={method === "upi" ? "default" : "ghost"} onClick={() => setMethod("upi")} className={method === "upi" ? "bg-emerald-500 text-black hover:bg-emerald-400" : "text-zinc-300"}><Smartphone className="h-4 w-4" /> UPI AutoPay</Button>
          <Button variant={method === "card" ? "default" : "ghost"} onClick={() => setMethod("card")} className={method === "card" ? "bg-emerald-500 text-black hover:bg-emerald-400" : "text-zinc-300"}><CreditCard className="h-4 w-4" /> Card</Button>
        </div>
        <div className="mt-2 flex items-start gap-2 text-[11px] text-zinc-400"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" /><span>Authorize today. No plan fee now; the first monthly charge is on Day 8.</span></div>
      </div>

      <div className="space-y-3">
        {PLANS.map((p) => {
          const Icon = p.icon;
          const isCurrent = currentPlan === p.id && sub?.status === "active";
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl border ${p.border} bg-zinc-900/60 backdrop-blur p-4 ${p.popular ? "ring-2 ring-amber-400/40" : ""}`}
            >
              {p.popular && (
                <span className="absolute -top-2 right-4 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-black px-2 py-0.5 rounded-full">
                  Most popular
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${p.accent} flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-black" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold">{p.name}</span>
                    {isCurrent && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">CURRENT</span>}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold">₹{p.price}</span>
                    <span className="text-xs text-zinc-400">{p.period}</span>
                  </div>
                </div>
              </div>

              <ul className="mt-3 space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-200">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" /> {f}
                  </li>
                ))}
                {p.locked.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-zinc-500 line-through">
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                disabled={isCurrent || paying === p.id}
                onClick={() => handleBuy(p.id)}
                className={`w-full mt-3 font-semibold ${
                  p.id === "platinum" ? "bg-emerald-500 hover:bg-emerald-400 text-black" :
                  p.id === "gold" ? "bg-amber-400 hover:bg-amber-300 text-black" :
                  "bg-zinc-200 hover:bg-white text-black"
                }`}
              >
                {isCurrent ? "Current plan" : paying === p.id ? "Opening authorization…" : <><CalendarClock className="h-4 w-4" /> Start 7-day trial</>}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-zinc-500 text-center mt-4">
        Secured by Razorpay · Cancel before Day 8 to avoid the first charge · Prices in INR
      </p>
    </div>
  );
}
