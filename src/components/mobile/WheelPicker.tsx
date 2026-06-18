import { useEffect, useRef, useCallback } from "react";

interface WheelPickerProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  /** Number of visible items above/below the center (total = 2*visible+1) */
  visible?: number;
  itemHeight?: number;
  formatter?: (v: number) => string;
}

/**
 * Premium iOS-style wheel picker.
 * Uses native scroll-snap for buttery 60fps inertia + haptic feel.
 */
export function WheelPicker({
  min,
  max,
  step = 1,
  value,
  onChange,
  unit,
  visible = 2,
  itemHeight = 44,
  formatter,
}: WheelPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const lastEmitted = useRef<number>(value);

  const items: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step) {
    items.push(Math.round(v * 1000) / 1000);
  }

  const indexOf = (v: number) => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < items.length; i++) {
      const d = Math.abs(items[i] - v);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  };

  // Sync external value -> scroll position
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (Math.abs(lastEmitted.current - value) < step / 2) return;
    const idx = indexOf(value);
    el.scrollTo({ top: idx * itemHeight, behavior: "smooth" });
    lastEmitted.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Set initial position (no animation)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = indexOf(value) * itemHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const idx = Math.round(el.scrollTop / itemHeight);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      const v = items[clamped];
      if (v !== lastEmitted.current) {
        lastEmitted.current = v;
        onChange(v);
        // light haptic on supported devices
        if (typeof navigator !== "undefined" && (navigator as any).vibrate) {
          (navigator as any).vibrate(8);
        }
      }
      // snap perfectly
      const target = clamped * itemHeight;
      if (Math.abs(el.scrollTop - target) > 0.5) {
        el.scrollTo({ top: target, behavior: "smooth" });
      }
    }, 90);
  }, [items, itemHeight, onChange]);

  const padding = visible * itemHeight;
  const totalHeight = (visible * 2 + 1) * itemHeight;

  return (
    <div
      className="relative w-full select-none"
      style={{ height: totalHeight }}
    >
      {/* Center highlight band */}
      <div
        className="pointer-events-none absolute left-2 right-2 rounded-xl border border-[oklch(0.72_0.22_240/0.55)] bg-[oklch(0.72_0.22_240/0.10)] shadow-[0_0_24px_-6px_oklch(0.72_0.22_240/0.6)]"
        style={{ top: visible * itemHeight, height: itemHeight }}
      />
      {/* Top fade */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{
          height: padding,
          background:
            "linear-gradient(to bottom, var(--background) 0%, transparent 100%)",
        }}
      />
      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
        style={{
          height: padding,
          background:
            "linear-gradient(to top, var(--background) 0%, transparent 100%)",
        }}
      />

      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll scrollbar-hide"
        style={{
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ height: padding }} />
        {items.map((v, i) => {
          const isActive = Math.abs(v - value) < step / 2;
          return (
            <div
              key={i}
              style={{ height: itemHeight, scrollSnapAlign: "center" }}
              className={`flex items-center justify-center tabular-nums transition-all duration-150 ${
                isActive
                  ? "text-2xl font-bold text-foreground scale-110"
                  : "text-base text-muted-foreground/60"
              }`}
            >
              {formatter ? formatter(v) : v}
              {isActive && unit && (
                <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
          );
        })}
        <div style={{ height: padding }} />
      </div>
    </div>
  );
}
