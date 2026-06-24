import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Sparkles, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/subscription.functions";
import { useSubscription, PLAN_META, isTrialActive, trialMsLeft, formatCountdown } from "@/lib/subscription";

export const Route = createFileRoute("/_app/pricing")({
  component: PricingPage,
});

const PLANS = [
  {
    id: "silver" as const,
    name: "Silver",
    price: 99,
    period: "one-time",
    icon: Sparkles,
    accent: "from-zinc-300 to-zinc-500",
    border: "border-zinc-400/30",
    features: [
      "15 personalized diet plans",
      "BMI & macro targets",
      "Region & cuisine matching",
      "One-time payment, no renewal",
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
  const createOrder = useServerFn(createRazorpayOrder);
  const verify = useServerFn(verifyRazorpayPayment);
  const [paying, setPaying] = useState<string | null>(null);
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
      const order = await createOrder({ data: { plan } });
      const rzp = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "MyNutriLens",
        description: `${PLAN_META[plan].name} plan`,
        order_id: order.orderId,
        theme: { color: "#10b981" },
        handler: async (resp: any) => {
          try {
            await verify({ data: {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              plan,
            }});
            toast.success(`${PLAN_META[plan].name} plan activated!`);
            await qc.invalidateQueries({ queryKey: ["subscription"] });
            navigate({ to: "/home" });
          } catch (e: any) {
            toast.error(e?.message ?? "Verification failed");
          }
        },
        modal: { ondismiss: () => setPaying(null) },
      });
      rzp.on("payment.failed", () => toast.error("Payment failed"));
      rzp.open();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start payment");
    } finally {
      setPaying(null);
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
          <div className="text-[11px] text-zinc-400">remaining · full access</div>
        </div>
      )}

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
                {isCurrent ? "Current plan" : paying === p.id ? "Opening checkout…" : `Get ${p.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-zinc-500 text-center mt-4">
        Secured by Razorpay · Cancel anytime · Prices in INR
      </p>
    </div>
  );
}
