import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Crown, Clock } from "lucide-react";
import { useSubscription, trialMsLeft, formatCountdown, isPaidActive, isTrialActive } from "@/lib/subscription";

export function TrialBanner() {
  const { data: sub } = useSubscription();
  const { pathname } = useLocation();
  const [, force] = useState(0);

  useEffect(() => {
    const i = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);

  if (pathname === "/" || pathname === "/login" || pathname === "/onboarding" || pathname === "/pricing") return null;
  if (!sub) return null;

  const trial = isTrialActive(sub as any);
  const paid = isPaidActive(sub as any);
  const ms = trialMsLeft(sub as any);

  if (paid && !trial) return null; // No banner for active paid users

  if (trial) {
    const urgent = ms < 24 * 60 * 60 * 1000;
    return (
      <Link
        to="/pricing"
        className={`fixed top-2 left-1/2 -translate-x-1/2 z-30 w-[min(420px,calc(100vw-16px))] rounded-full px-3 py-1.5 flex items-center justify-between text-[11px] backdrop-blur-xl border shadow-lg ${
          urgent
            ? "bg-red-500/15 border-red-400/30 text-red-100"
            : "bg-emerald-500/15 border-emerald-400/30 text-emerald-100"
        }`}
      >
        <span className="flex items-center gap-1.5 font-semibold">
          <Clock className="h-3 w-3" /> Trial ends in {formatCountdown(ms)}
        </span>
        <span className="font-bold tracking-wide">Upgrade →</span>
      </Link>
    );
  }

  // Expired / no active plan
  return (
    <Link
      to="/pricing"
      className="fixed top-2 left-1/2 -translate-x-1/2 z-30 w-[min(420px,calc(100vw-16px))] rounded-full px-3 py-1.5 flex items-center justify-between text-[11px] backdrop-blur-xl bg-amber-500/15 border border-amber-400/30 text-amber-100 shadow-lg"
    >
      <span className="flex items-center gap-1.5 font-semibold">
        <Crown className="h-3 w-3" /> Trial ended — choose a plan
      </span>
      <span className="font-bold">View plans →</span>
    </Link>
  );
}
