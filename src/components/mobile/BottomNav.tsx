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
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(420px,calc(100vw-32px))]">
      <div className="glass-strong rounded-[28px] px-3 py-2.5 flex items-center justify-between shadow-2xl">
        {tabs.map(t => {
          const active = pathname === t.to;
          const Icon = t.icon;
          if (t.center) {
            return (
              <Link key={t.to} to={t.to} className="-mt-7">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-ring active:scale-95 transition ${active ? "animate-pulse-glow" : ""}`}>
                  <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
                </div>
              </Link>
            );
          }
          return (
            <Link key={t.to} to={t.to}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${active ? "text-primary" : "text-muted-foreground"}`}>
              {active && <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-primary glow-ring" />}
              <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
