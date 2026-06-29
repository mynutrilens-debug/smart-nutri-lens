import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Download, Rocket, ScanLine, Bell, Zap, Leaf } from "lucide-react";
import { isNative } from "@/lib/native";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SKIP_KEY = "mynutrilens.installGateSkippedAt";
const SKIP_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}

/**
 * Full-screen install-first gate shown before signup/login.
 * Skipped automatically when running natively or already installed.
 */
export function InstallGate({ to = "/login" }: { to?: string }) {
  const navigate = useNavigate();
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isNative() || isStandalone()) {
      navigate({ to: to as never, replace: true });
      return;
    }
    const skippedAt = Number(localStorage.getItem(SKIP_KEY) || 0);
    if (skippedAt && Date.now() - skippedAt < SKIP_TTL_MS) {
      navigate({ to: to as never, replace: true });
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, [navigate, to]);

  const onInstall = async () => {
    if (!evt) {
      // iOS / unsupported: show inline instructions
      alert("To install: tap Share → Add to Home Screen.");
      return;
    }
    setInstalling(true);
    try {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(SKIP_KEY, String(Date.now()));
      }
    } finally {
      setInstalling(false);
      navigate({ to: to as never, replace: true });
    }
  };

  const onContinue = () => {
    localStorage.setItem(SKIP_KEY, String(Date.now()));
    navigate({ to: to as never, replace: true });
  };

  return (
    <div className="app-shell relative overflow-hidden flex flex-col">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-[oklch(0.78_0.20_150/0.35)] blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[oklch(0.78_0.20_150/0.15)] to-transparent" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-6 text-center">
        {/* App icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-3xl bg-[oklch(0.78_0.20_150/0.5)] blur-2xl animate-pulse" />
          <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-[oklch(0.85_0.20_140)] to-[oklch(0.62_0.18_160)] flex items-center justify-center shadow-[0_20px_60px_-15px_oklch(0.78_0.20_150/0.9)]">
            <Leaf className="h-12 w-12 text-[oklch(0.10_0.02_160)]" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[oklch(0.78_0.20_150/0.12)] border border-[oklch(0.78_0.20_150/0.4)] mb-4">
          <Rocket className="h-3 w-3 text-[oklch(0.85_0.20_140)]" />
          <span className="text-[11px] font-medium text-[oklch(0.92_0.10_145)]">Recommended</span>
        </div>

        <h1 className="text-[28px] leading-[1.1] font-extrabold tracking-tight text-white max-w-[320px]">
          Get the full MyNutriLens experience <span className="inline-block">🚀</span>
        </h1>
        <p className="mt-3 text-[13px] text-white/65 max-w-[320px] leading-relaxed">
          Install the app for faster scans, better tracking, and daily reminders.
        </p>

        {/* Benefits */}
        <div className="mt-7 w-full max-w-[340px] space-y-2.5">
          <Benefit icon={<ScanLine className="h-4 w-4 text-[oklch(0.85_0.20_140)]" />} title="Faster scans" sub="Instant camera, no tabs to find" />
          <Benefit icon={<Zap className="h-4 w-4 text-[oklch(0.85_0.20_140)]" />} title="Better tracking" sub="One-tap logging from home screen" />
          <Benefit icon={<Bell className="h-4 w-4 text-[oklch(0.85_0.20_140)]" />} title="Daily reminders" sub="Stay on streak with push alerts" />
        </div>
      </div>

      {/* Sticky CTAs */}
      <div className="relative px-5 pb-8 pt-3 space-y-3" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
        <button
          onClick={onInstall}
          disabled={installing}
          className="group relative w-full py-4 rounded-2xl bg-gradient-to-r from-[oklch(0.85_0.20_140)] via-[oklch(0.78_0.20_150)] to-[oklch(0.62_0.18_160)] text-[oklch(0.10_0.02_160)] font-bold shadow-[0_18px_50px_-12px_oklch(0.78_0.20_150/0.9)] flex items-center justify-center gap-2 active:scale-[.98] transition overflow-hidden disabled:opacity-70"
          style={{ animation: "pulse-cta 2.6s ease-out infinite" }}
        >
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <Download className="h-4 w-4" />
          {installing ? "Installing…" : "Install Now"}
        </button>
        <button
          onClick={onContinue}
          className="w-full text-center text-[12px] text-white/55 hover:text-white/80 transition py-2"
        >
          Continue in Browser
        </button>
      </div>

      <style>{`
        @keyframes pulse-cta {
          0%, 100% { box-shadow: 0 18px 50px -12px oklch(0.78 0.20 150 / 0.85), 0 0 0 0 oklch(0.78 0.20 150 / 0.55); }
          50%      { box-shadow: 0 18px 60px -10px oklch(0.78 0.20 150 / 0.95), 0 0 0 14px oklch(0.78 0.20 150 / 0); }
        }
      `}</style>
    </div>
  );
}

function Benefit({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="glass rounded-2xl p-3 flex items-center gap-3 border-white/10 text-left">
      <div className="h-9 w-9 rounded-xl bg-[oklch(0.78_0.20_150/0.12)] border border-[oklch(0.78_0.20_150/0.35)] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-white leading-tight">{title}</div>
        <div className="text-[11px] text-white/55 leading-tight mt-0.5">{sub}</div>
      </div>
    </div>
  );
}
