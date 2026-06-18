import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { isNative } from "@/lib/native";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mynutrilens.installDismissedAt";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export function InstallPwaPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || isNative()) return;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari standalone hint
      window.navigator.standalone === true;
    if (standalone) return;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  if (!visible || !evt) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-50 w-[min(420px,calc(100vw-32px))]" style={{ bottom: "calc(96px + env(safe-area-inset-bottom))" }}>
      <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl px-4 py-3 flex items-center gap-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <Download className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Install MyNutriLens</p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">Add to your home screen for an app-like experience.</p>
        </div>
        <button
          onClick={async () => {
            await evt.prompt();
            await evt.userChoice.catch(() => null);
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
            setVisible(false);
            setEvt(null);
          }}
          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-black active:scale-95 transition"
        >Install</button>
        <button
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
            setVisible(false);
            setEvt(null);
          }}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/5"
          aria-label="Dismiss"
        ><X className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}
