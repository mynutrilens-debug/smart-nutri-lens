import { useEffect, useState } from "react";
import splash from "@/assets/splash.png.asset.json";

/**
 * Branded splash overlay shown on app boot.
 * On native (Capacitor) the OS splash hides via SplashScreen.hide() in initNative();
 * this overlay then takes over and fades into the React UI for a seamless transition.
 * On web, it appears for ~900ms then fades out.
 */
export function SplashOverlay() {
  const [stage, setStage] = useState<"in" | "out" | "gone">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("out"), 900);
    const t2 = setTimeout(() => setStage("gone"), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (stage === "gone") return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{
        background:
          "radial-gradient(80% 60% at 50% 45%, oklch(0.22 0.08 250) 0%, #0b0b14 70%)",
        opacity: stage === "out" ? 0 : 1,
        transition: "opacity 600ms cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <div
        className="relative flex flex-col items-center"
        style={{
          transform: stage === "out" ? "scale(1.06)" : "scale(1)",
          transition: "transform 700ms cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div
          className="absolute inset-0 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.72 0.22 240 / 55%), transparent 65%)",
            animation: "pulse-glow 2.2s ease-out infinite",
          }}
        />
        <img
          src={splash.url}
          alt=""
          width={260}
          height={260}
          className="relative h-[260px] w-[260px] object-contain drop-shadow-[0_0_40px_rgba(80,140,255,0.45)]"
          style={{ animation: "float-realistic-a 4s ease-in-out infinite" }}
        />
        <div className="relative mt-6 h-1 w-32 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full w-1/2 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.82 0.16 215), transparent)",
              animation: "shimmer 1.2s linear infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}
