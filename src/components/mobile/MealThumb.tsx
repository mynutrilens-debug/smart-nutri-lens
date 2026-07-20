import { useEffect, useMemo, useState } from "react";
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

// --- Persistent cache (localStorage) + in-memory cache ---
const LS_PREFIX = "mealthumb:v1:";
const LS_INDEX_KEY = "mealthumb:v1:index";
const MAX_ENTRIES = 60; // cap to avoid blowing localStorage quota
const memCache = new Map<string, string>();

function lsGet(key: string): string | null {
  try { return localStorage.getItem(LS_PREFIX + key); } catch { return null; }
}
function lsSet(key: string, value: string) {
  try {
    localStorage.setItem(LS_PREFIX + key, value);
    const idxRaw = localStorage.getItem(LS_INDEX_KEY);
    const idx: string[] = idxRaw ? JSON.parse(idxRaw) : [];
    const filtered = idx.filter((k) => k !== key);
    filtered.push(key);
    while (filtered.length > MAX_ENTRIES) {
      const evict = filtered.shift();
      if (evict) localStorage.removeItem(LS_PREFIX + evict);
    }
    localStorage.setItem(LS_INDEX_KEY, JSON.stringify(filtered));
  } catch {
    // quota exceeded — clear index and continue silently
    try { localStorage.removeItem(LS_INDEX_KEY); } catch {}
  }
}

async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size > 250_000) return null; // skip huge blobs
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function MealThumb({
  name,
  items,
  fallbackColor,
  FallbackIcon,
  size = 64,
}: {
  name: string;
  items?: string;
  fallbackColor: string;
  FallbackIcon: LucideIcon;
  size?: number;
}) {
  const query = useMemo(() => cleanQuery(name, items), [name, items]);
  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < query.length; i++) h = (h * 31 + query.charCodeAt(i)) | 0;
    return Math.abs(h);
  }, [query]);
  const remoteUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `professional food photography of ${query}, top-down, on dark plate, moody lighting, appetizing, high detail, 4k`
  )}?width=256&height=256&nologo=true&seed=${seed}`;

  const initial = memCache.get(query) ?? lsGet(query) ?? remoteUrl;
  const [src, setSrc] = useState<string>(initial);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const cached = memCache.get(query) ?? lsGet(query);
    if (cached) {
      memCache.set(query, cached);
      setSrc(cached);
      setErrored(false);
      return;
    }
    setSrc(remoteUrl);
    setErrored(false);
    // After first load, persist as data URL so future visits skip network.
    let cancelled = false;
    (async () => {
      const dataUrl = await urlToDataUrl(remoteUrl);
      if (cancelled || !dataUrl) return;
      memCache.set(query, dataUrl);
      lsSet(query, dataUrl);
    })();
    return () => { cancelled = true; };
  }, [query, remoteUrl]);

  return (
    <div
      className="rounded-full overflow-hidden shrink-0 relative border border-white/10 shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${fallbackColor}25, ${fallbackColor}08)`,
      }}
    >
      {!errored ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FallbackIcon className="h-6 w-6" style={{ color: fallbackColor }} />
        </div>
      )}
    </div>
  );
}
