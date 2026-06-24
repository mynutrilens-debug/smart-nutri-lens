import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubscription, hasFeature, Feature } from "@/lib/subscription";

export function useUpgradeGate(feat: Feature) {
  const { data: sub } = useSubscription();
  const allowed = hasFeature(sub as any, feat);
  return { allowed, sub };
}

export function UpgradeModal({
  open, onOpenChange, feature,
}: { open: boolean; onOpenChange: (v: boolean) => void; feature: Feature }) {
  const labels: Record<Feature, string> = {
    diet: "Diet plans",
    workout: "Workout plans",
    scanner: "Nutri Scanner",
    ai_chat: "AI Fitness Coach",
  };
  const suggested: Record<Feature, "silver" | "gold" | "platinum"> = {
    diet: "silver",
    workout: "gold",
    scanner: "platinum",
    ai_chat: "platinum",
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-emerald-500/20 text-white max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <Lock className="h-4 w-4 text-emerald-400" />
          </div>
          <DialogTitle className="text-lg">Unlock {labels[feature]}</DialogTitle>
        </div>
        <DialogDescription className="text-zinc-400 text-sm">
          Your trial has ended or this feature isn't in your current plan. Upgrade to keep going.
        </DialogDescription>
        <div className="mt-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-700/5 border border-emerald-500/20 p-3 flex items-center gap-3">
          <Crown className="h-5 w-5 text-emerald-400" />
          <div className="flex-1">
            <div className="text-sm font-semibold">Recommended: {suggested[feature]}</div>
            <div className="text-[11px] text-zinc-400">Tap below to view all plans</div>
          </div>
        </div>
        <Button asChild className="mt-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
          <Link to="/pricing" onClick={() => onOpenChange(false)}>View plans</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function FeatureGate({
  feature, children, fallback,
}: { feature: Feature; children: ReactNode; fallback?: ReactNode }) {
  const { allowed } = useUpgradeGate(feature);
  if (allowed) return <>{children}</>;
  return <>{fallback ?? null}</>;
}
