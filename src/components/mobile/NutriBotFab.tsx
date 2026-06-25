import { useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ChatPanel } from "./ChatPanel";

export function NutriBotFab() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const hidden = ["/", "/login", "/onboarding", "/scan"].includes(pathname);
  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open NutriBot"
        className="fixed right-4 z-30 group focus:outline-none"
        style={{
          // Sit above bottom nav (h-16 = 4rem) + nav offset (0.75rem) with ~20px breathing room
          bottom: "calc(5rem + 1.25rem + env(safe-area-inset-bottom))",
        }}
      >
        <span
          className="absolute inset-0 rounded-full bg-emerald-400/40 blur-xl animate-ping"
          aria-hidden
          style={{ animationDuration: "2.4s" }}
        />
        <span
          className="absolute -inset-1 rounded-full bg-emerald-500/30 blur-md animate-pulse"
          aria-hidden
        />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_12px_30px_-6px_rgba(16,185,129,0.65)] border border-emerald-300/40 active:scale-95 transition-transform">
          <Sparkles className="h-5 w-5 text-black" strokeWidth={2.5} />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-white border-2 border-zinc-950" />
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[92dvh] p-0 border-0 bg-zinc-950 rounded-t-3xl overflow-hidden flex flex-col"
        >
          <SheetTitle className="sr-only">NutriBot AI Chat</SheetTitle>
          <SheetDescription className="sr-only">
            Chat with your personalized AI nutrition coach.
          </SheetDescription>
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/15 shrink-0" />
          <div className="flex-1 min-h-0">
            <ChatPanel onClose={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
