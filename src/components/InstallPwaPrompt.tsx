import { useEffect, useState } from "react";
import { Download, X, Share, Plus, Smartphone, Sparkles } from "lucide-react";
import { isNative } from "@/lib/native";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mynutrilens.installDismissedAt";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 3; // 3 days — nudge again soon

function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = ua.includes("Mac") && "ontouchend" in document;
  return iOS || iPadOS;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari hint
    window.navigator.standalone === true
  );
}

export function InstallPwaPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosSheet, setShowIosSheet] = useState(false);
  const [platformIos, setPlatformIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || isNative()) return;
    if (isStandalone()) return;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;

    const ios = isIos();
    setPlatformIos(ios);

    // iOS Safari has no beforeinstallprompt — show manual instructions banner.
    if (ios) {
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);

    // Fallback: show a manual-instructions banner if beforeinstallprompt never fires
    // (e.g. desktop Safari, Firefox on Android, or unsupported browsers).
    const fallbackTimer = window.setTimeout(() => {
      setVisible(prev => prev || true);
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as EventListener);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setShowIosSheet(false);
    setEvt(null);
  };

  const onInstall = async () => {
    if (evt) {
      try {
        await evt.prompt();
        await evt.userChoice.catch(() => null);
      } catch {
        /* noop */
      }
      dismiss();
      return;
    }
    if (platformIos) {
      setShowIosSheet(true);
      return;
    }
    setShowIosSheet(true);
  };

  return (
    <>
      <div
        className="fixed left-1/2 -translate-x-1/2 z-[60] w-[min(460px,calc(100vw-20px))] px-1 animate-slide-up"
        style={{ bottom: "calc(92px + env(safe-area-inset-bottom))" }}
      >
        <div className="relative rounded-3xl border-2 border-[oklch(0.78_0.20_150/0.55)] bg-gradient-to-br from-[oklch(0.14_0.03_160)] via-black/85 to-[oklch(0.10_0.02_160)] backdrop-blur-2xl shadow-[0_25px_70px_-12px_oklch(0.78_0.20_150/0.6)] overflow-hidden">
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[oklch(0.78_0.20_150/0.35)] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-[oklch(0.62_0.18_160/0.28)] blur-3xl pointer-events-none" />

          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 z-10"
          >
            <X className="h-4 w-4 text-white/80" />
          </button>

          <div className="relative p-4 pr-12 flex items-center gap-3.5">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-[oklch(0.78_0.20_150/0.5)] blur-lg animate-pulse" />
              <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-[oklch(0.85_0.20_140)] to-[oklch(0.62_0.18_160)] flex items-center justify-center shadow-lg">
                <Smartphone className="h-7 w-7 text-[oklch(0.10_0.02_160)]" strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[oklch(0.85_0.20_140)]" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-[oklch(0.85_0.20_140)]">
                  Install App
                </span>
              </div>
              <p className="text-[17px] font-extrabold leading-tight text-white mt-0.5">
                Get MyNutriLens on your home screen
              </p>
              <p className="text-[12px] text-white/65 leading-snug mt-1">
                Faster access · Push reminders · Works offline
              </p>
            </div>
          </div>

          <div className="relative px-4 pb-4">
            <button
              onClick={onInstall}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[oklch(0.85_0.20_140)] via-[oklch(0.78_0.20_150)] to-[oklch(0.62_0.18_160)] text-[oklch(0.08_0.02_160)] font-extrabold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-[0_10px_30px_-8px_oklch(0.78_0.20_150/0.9)]"
            >
              <Download className="h-5 w-5" strokeWidth={2.8} />
              {platformIos ? "Show me how" : "Install Now"}
            </button>
          </div>
        </div>
      </div>

      {showIosSheet && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={dismiss}>
          <div
            className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[oklch(0.14_0.03_160)] to-black border-2 border-[oklch(0.78_0.20_150/0.5)] p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-extrabold text-white">Install MyNutriLens</h3>
              <button onClick={dismiss} className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ol className="space-y-4 text-sm text-white/90">
              <li className="flex items-start gap-3">
                <span className="h-7 w-7 rounded-full bg-[oklch(0.78_0.20_150/0.2)] border border-[oklch(0.78_0.20_150/0.5)] flex items-center justify-center font-bold text-[oklch(0.85_0.20_140)] shrink-0">1</span>
                <span className="pt-0.5">Tap the <Share className="inline h-4 w-4 mx-1 text-[oklch(0.85_0.20_140)]" /> <b>Share</b> button in your browser toolbar.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-7 w-7 rounded-full bg-[oklch(0.78_0.20_150/0.2)] border border-[oklch(0.78_0.20_150/0.5)] flex items-center justify-center font-bold text-[oklch(0.85_0.20_140)] shrink-0">2</span>
                <span className="pt-0.5">Scroll and choose <Plus className="inline h-4 w-4 mx-1 text-[oklch(0.85_0.20_140)]" /> <b>Add to Home Screen</b>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-7 w-7 rounded-full bg-[oklch(0.78_0.20_150/0.2)] border border-[oklch(0.78_0.20_150/0.5)] flex items-center justify-center font-bold text-[oklch(0.85_0.20_140)] shrink-0">3</span>
                <span className="pt-0.5">Tap <b>Add</b>. Launch MyNutriLens from your home screen like a native app.</span>
              </li>
            </ol>
            <button
              onClick={dismiss}
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-[oklch(0.85_0.20_140)] to-[oklch(0.62_0.18_160)] text-[oklch(0.08_0.02_160)] font-bold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
