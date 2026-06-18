import { Link, useLocation } from "@tanstack/react-router";
import { Home, Utensils, Dumbbell, User, Camera } from "lucide-react";

type Tab = { to: "/home" | "/diet" | "/scan" | "/workout" | "/profile"; icon: typeof Home; label: string; center?: boolean };
const tabs: Tab[] = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/diet", icon: Utensils, label: "Diet" },
  { to: "/scan", icon: Camera, label: "Scan", center: true },
  { to: "/workout", icon: Dumbbell, label: "Train" },
  { to: "/profile", icon: User, label: "Me" },
];

export function BottomNav() {
  const { pathname } = useLocation();
  if (pathname === "/onboarding" || pathname === "/" || pathname === "/login") return null;
  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 z-40 w-[min(420px,calc(100vw-24px))]"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="relative rounded-full px-1.5 h-16 flex items-stretch justify-between backdrop-blur-xl bg-black/60 border border-white/[0.08] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        {tabs.map(t => {
          const active = pathname === t.to;
          const Icon = t.icon;
          if (t.center) {
            return (
              <div key={t.to} className="flex items-center justify-center px-1">
                <Link to={t.to} aria-label={t.label} className="-mt-7">
                  <div className={`h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_10px_28px_-6px_oklch(0.72_0.22_240/70%)] ring-4 ring-black/60 active:scale-95 transition ${active ? "scale-105" : ""}`}>
                    <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.4} />
                  </div>
                </Link>
              </div>
            );
          }
          return (
            <Link
              key={t.to}
              to={t.to}
              aria-current={active ? "page" : undefined}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-200 ${
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground/70 hover:text-foreground/90"
              }`}
            >
              <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.6 : 1.9} />
              <span className={`text-[10px] tracking-wide ${active ? "font-semibold" : "font-medium"}`}>{t.label}</span>
              {active && (
                <span className="absolute -bottom-1 h-1 w-6 rounded-full bg-primary shadow-[0_0_10px_oklch(0.72_0.22_240/80%)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
