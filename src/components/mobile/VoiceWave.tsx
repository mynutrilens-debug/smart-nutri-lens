import { useEffect, useRef } from "react";

export type WaveState = "idle" | "listening" | "thinking" | "speaking";

/**
 * Cinematic audio-reactive particle wave.
 * A dense swarm of glowing particles forms a soft "wing" spread across the
 * screen and swells with the live amplitude (mic RMS or Reva's speech envelope).
 */
export function VoiceWave({
  level,
  state,
  height = 220,
  className = "",
}: {
  level: number;
  state: WaveState;
  height?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelRef = useRef(0);
  const targetRef = useRef(0);
  const stateRef = useRef<WaveState>(state);

  targetRef.current = level;
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const COUNT = 220;
    const particles = Array.from({ length: COUNT }, (_, i) => {
      const t = i / (COUNT - 1); // 0..1 across the width
      return {
        t,
        seed: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.6,
        spread: Math.random(),
        size: 0.6 + Math.random() * 1.9,
        hueMix: Math.random(),
      };
    });

    let raf = 0;
    const t0 = performance.now();

    const draw = () => {
      const now = (performance.now() - t0) / 1000;
      // smooth the amplitude
      levelRef.current += (targetRef.current - levelRef.current) * 0.14;
      const amp = levelRef.current;
      const st = stateRef.current;

      const base =
        st === "listening" ? 0.22 : st === "speaking" ? 0.26 : st === "thinking" ? 0.16 : 0.1;
      const energy = Math.min(1, base + amp * 0.95);

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const cy = h / 2;

      for (const p of particles) {
        // wing envelope: tall in the middle, feathering out to the edges
        const x = p.t * w;
        const centered = (p.t - 0.5) * 2; // -1..1
        const wing = Math.pow(Math.cos(centered * Math.PI * 0.5), 2.1);
        const flare = 1 - Math.pow(Math.abs(centered), 2.6);
        const env = Math.max(0, wing * 0.75 + flare * 0.25);

        const wobble =
          Math.sin(now * p.speed * 1.7 + p.seed + centered * 5.2) * 0.55 +
          Math.sin(now * p.speed * 0.9 + p.seed * 2.1) * 0.45;

        const reach = (h * 0.42) * env * (0.22 + energy * 1.05);
        const y = cy + wobble * reach * (0.35 + p.spread * 0.85);

        const dist = Math.abs(y - cy) / (h * 0.5 || 1);
        const alpha = Math.max(0, (0.85 - dist * 0.75) * (0.28 + energy * 0.9) * env);
        if (alpha <= 0.01) continue;

        // teal → cyan → warm amber highlight at the core, like the reference
        const warm = p.hueMix > 0.86 && Math.abs(centered) < 0.22;
        const hue = warm ? 42 : 168 + p.hueMix * 26;
        const sat = warm ? 95 : 90;
        const light = warm ? 62 : 52 + energy * 22;

        const r = p.size * (0.8 + energy * 0.9);
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // soft core glow line
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "hsla(170,90%,60%,0)");
      grad.addColorStop(0.5, `hsla(175,95%,68%,${0.12 + energy * 0.4})`);
      grad.addColorStop(1, "hsla(170,90%,60%,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(w / 2, cy, w * 0.34, 1.6 + energy * 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`w-full block ${className}`}
      style={{ height }}
    />
  );
}
