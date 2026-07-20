import { useState, useMemo } from "react";
import type { LucideIcon } from "lucide-react";

function cleanQuery(name: string, items?: string) {
  const base = (name || items || "healthy meal")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s&+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/[,.•·]/)[0]
    ?.trim()
    .split(" ")
    .slice(0, 6)
    .join(" ");
  return base || "healthy meal";
}

export function MealThumb({
  name,
  items,
  fallbackColor,
  FallbackIcon,
  size = 44,
}: {
  name: string;
  items?: string;
  fallbackColor: string;
  FallbackIcon: LucideIcon;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  const query = useMemo(() => cleanQuery(name, items), [name, items]);
  // AI-generated photo matching the exact meal — deterministic via seed
  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < query.length; i++) h = (h * 31 + query.charCodeAt(i)) | 0;
    return Math.abs(h);
  }, [query]);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `professional food photography of ${query}, top-down, on dark plate, moody lighting, appetizing, high detail, 4k`
  )}?width=256&height=256&nologo=true&seed=${seed}`;

  return (
    <div
      className="rounded-xl overflow-hidden shrink-0 relative border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${fallbackColor}25, ${fallbackColor}08)`,
      }}
    >
      {!errored ? (
        <img
          src={url}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FallbackIcon className="h-5 w-5" style={{ color: fallbackColor }} />
        </div>
      )}
    </div>
  );
}
