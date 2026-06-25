import { Link, useLocation } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function NutriBotFab() {
  const { pathname } = useLocation();
  // Hide on auth / onboarding / chat itself
  const hidden = ["/", "/login", "/onboarding", "/chat", "/scan"].includes(pathname);
  if (hidden) return null;
  return (
    <Link
      to="/chat"
      aria-label="Open NutriBot"
      className="fixed right-4 z-30 group"
      style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
    >
      <span className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl animate-pulse" aria-hidden />
      <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_10px_30px_-6px_rgba(16,185,129,0.6)] border border-emerald-300/40 active:scale-95 transition">
        <Sparkles className="h-5 w-5 text-black" strokeWidth={2.4} />
      </div>
      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white border-2 border-zinc-950" />
    </Link>
  );
}
