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
    <nav className="fixed left-1/2 -translate-x-1/2 z-40 w-[min(420px,calc(100vw-32px))]" style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
      <div className="rounded-full px-2 py-2 flex items-center justify-between backdrop-blur-xl bg-black/40 border border-white/[0.06] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
        {tabs.map(t => {
          const active = pathname === t.to;
          const Icon = t.icon;
          if (t.center) {
            return (
              <Link key={t.to} to={t.to} className="-mt-5">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_8px_24px_-6px_oklch(0.72_0.22_240/60%)] active:scale-95 transition">
                  <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
                </div>
              </Link>
            );
          }
          return (
            <Link key={t.to} to={t.to}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all ${active ? "text-foreground" : "text-muted-foreground/70"}`}>
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
              {active && <span className="absolute -bottom-0.5 h-0.5 w-5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
