import { useEffect, useRef } from "react";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

/**
 * Audio-reactive AI voice orb.
 * `level` is a 0..1 amplitude that drives the pulse of the core, the rings
 * and the orbiting dots — fed by the mic while listening and by a synthetic
 * envelope while Reva speaks.
 */
export function VoiceOrb({
  level = 0,
  state = "idle",
  size = 190,
  onClick,
}: {
  level?: number;
  state?: OrbState;
  size?: number;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Smooth the incoming level so the orb never jitters.
  const smooth = useRef(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      smooth.current += (level - smooth.current) * 0.18;
      const el = ref.current;
      if (el) el.style.setProperty("--amp", smooth.current.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [level]);

  const hue =
    state === "listening"
      ? "oklch(0.82 0.16 215)"
      : state === "speaking"
        ? "oklch(0.78 0.20 155)"
        : state === "thinking"
          ? "oklch(0.72 0.22 240)"
          : "oklch(0.70 0.10 240)";

  const DOTS = 24;

  return (
    <div
      ref={ref}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? "Tap to talk to Reva" : undefined}
      className="relative mx-auto select-none"
      style={{
        width: size,
        height: size,
        // @ts-expect-error custom property
        "--amp": 0,
        "--hue": hue,
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      {/* outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, ${hue} 0%, transparent 68%)`,
          opacity: `calc(0.22 + var(--amp) * 0.55)`,
          transform: `scale(calc(0.9 + var(--amp) * 0.4))`,
        }}
      />

      {/* reactive rings */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            inset: 8 + i * 14,
            borderColor: hue,
            opacity: `calc(${0.35 - i * 0.08} + var(--amp) * 0.5)`,
            transform: `scale(calc(1 + var(--amp) * ${0.10 + i * 0.07}))`,
            transition: "transform 90ms linear",
          }}
        />
      ))}

      {/* orbiting audio dots */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: "18s" }}>
        {Array.from({ length: DOTS }).map((_, i) => {
          const a = (i / DOTS) * Math.PI * 2;
          const wobble = 0.55 + 0.45 * Math.abs(Math.sin(i * 1.7));
          return (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: "50%",
                top: "50%",
                width: 4,
                height: 4,
                background: hue,
                opacity: `calc(0.30 + var(--amp) * ${wobble})`,
                transform: `translate(-50%,-50%) rotate(${a}rad) translateY(calc(${-size / 2 + 12}px * (1 + var(--amp) * ${0.16 * wobble})))`,
                transition: "transform 90ms linear",
              }}
            />
          );
        })}
      </div>

      {/* core */}
      <div
        className="absolute rounded-full backdrop-blur-xl border border-white/15"
        style={{
          inset: size * 0.26,
          background: `radial-gradient(circle at 35% 30%, ${hue}, oklch(0.22 0.03 250))`,
          boxShadow: `0 0 calc(24px + var(--amp) * 60px) ${hue}`,
          transform: `scale(calc(1 + var(--amp) * 0.22))`,
          transition: "transform 80ms linear",
        }}
      />

      {/* breathing idle / thinking shimmer */}
      {(state === "idle" || state === "thinking") && (
        <div
          className="absolute rounded-full animate-pulse"
          style={{ inset: size * 0.26, background: `${hue}`, opacity: 0.12 }}
        />
      )}
    </div>
  );
}
