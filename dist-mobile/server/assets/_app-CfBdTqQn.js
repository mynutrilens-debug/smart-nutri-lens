import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useLocation, Link, useNavigate, Outlet } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Home, Utensils, Camera, Dumbbell, User, Clock, Crown, Sparkles } from "lucide-react";
import { u as useSubscription, i as isTrialActive, a as isPaidActive, t as trialMsLeft, f as formatCountdown } from "./button-Dk3VrbiD.js";
import { S as Sheet, a as SheetContent, b as SheetTitle, c as SheetDescription } from "./sheet-WM_CB9Ob.js";
import { C as ChatPanel } from "./ChatPanel-B-sB57RB.js";
import { s as supabase } from "./client-BMbiJotd.js";
import "@tanstack/react-query";
import "./router-D-2d6VGp.js";
import "sonner";
import "@capacitor/core";
import "./server-BadC42R4.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "zod";
import "./auth-middleware-B4NMxYBh.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-dialog";
import "react-markdown";
const tabs = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/diet", icon: Utensils, label: "Diet" },
  { to: "/scan", icon: Camera, label: "Scan", center: true },
  { to: "/workout", icon: Dumbbell, label: "Train" },
  { to: "/profile", icon: User, label: "Me" }
];
function BottomNav() {
  const { pathname } = useLocation();
  if (pathname === "/onboarding" || pathname === "/" || pathname === "/login") return null;
  return /* @__PURE__ */ jsx(
    "nav",
    {
      className: "fixed left-1/2 -translate-x-1/2 z-40 w-[min(420px,calc(100vw-24px))]",
      style: { bottom: "calc(0.75rem + env(safe-area-inset-bottom))" },
      children: /* @__PURE__ */ jsx("div", { className: "relative rounded-full px-1.5 h-16 flex items-stretch justify-between backdrop-blur-xl bg-black/60 border border-white/[0.08] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]", children: tabs.map((t) => {
        const active = pathname === t.to;
        const Icon = t.icon;
        if (t.center) {
          return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center px-1", children: /* @__PURE__ */ jsx(Link, { to: t.to, "aria-label": t.label, className: "-mt-7", children: /* @__PURE__ */ jsx("div", { className: `h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_10px_28px_-6px_oklch(0.72_0.22_240/70%)] ring-4 ring-black/60 active:scale-95 transition ${active ? "scale-105" : ""}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6 text-primary-foreground", strokeWidth: 2.4 }) }) }) }, t.to);
        }
        return /* @__PURE__ */ jsxs(
          Link,
          {
            to: t.to,
            "aria-current": active ? "page" : void 0,
            className: `relative flex-1 flex flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-200 ${active ? "text-primary bg-primary/10" : "text-muted-foreground/70 hover:text-foreground/90"}`,
            children: [
              /* @__PURE__ */ jsx(Icon, { className: "h-[20px] w-[20px]", strokeWidth: active ? 2.6 : 1.9 }),
              /* @__PURE__ */ jsx("span", { className: `text-[10px] tracking-wide ${active ? "font-semibold" : "font-medium"}`, children: t.label }),
              active && /* @__PURE__ */ jsx("span", { className: "absolute -bottom-1 h-1 w-6 rounded-full bg-primary shadow-[0_0_10px_oklch(0.72_0.22_240/80%)]" })
            ]
          },
          t.to
        );
      }) })
    }
  );
}
function TrialBanner() {
  const { data: sub } = useSubscription();
  const { pathname } = useLocation();
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((x) => x + 1), 1e3);
    return () => clearInterval(i);
  }, []);
  if (pathname === "/" || pathname === "/login" || pathname === "/onboarding" || pathname === "/pricing") return null;
  if (!sub) return null;
  const trial = isTrialActive(sub);
  const paid = isPaidActive(sub);
  const ms = trialMsLeft(sub);
  if (paid && !trial) return null;
  if (trial) {
    const urgent = ms < 24 * 60 * 60 * 1e3;
    return /* @__PURE__ */ jsxs(
      Link,
      {
        to: "/pricing",
        className: `fixed top-2 left-1/2 -translate-x-1/2 z-30 w-[min(420px,calc(100vw-16px))] rounded-full px-3 py-1.5 flex items-center justify-between text-[11px] backdrop-blur-xl border shadow-lg ${urgent ? "bg-red-500/15 border-red-400/30 text-red-100" : "bg-emerald-500/15 border-emerald-400/30 text-emerald-100"}`,
        children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 font-semibold", children: [
            /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
            " Trial ends in ",
            formatCountdown(ms)
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-bold tracking-wide", children: "Upgrade →" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    Link,
    {
      to: "/pricing",
      className: "fixed top-2 left-1/2 -translate-x-1/2 z-30 w-[min(420px,calc(100vw-16px))] rounded-full px-3 py-1.5 flex items-center justify-between text-[11px] backdrop-blur-xl bg-amber-500/15 border border-amber-400/30 text-amber-100 shadow-lg",
      children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 font-semibold", children: [
          /* @__PURE__ */ jsx(Crown, { className: "h-3 w-3" }),
          " Trial ended — choose a plan"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "font-bold", children: "View plans →" })
      ]
    }
  );
}
function NutriBotFab() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const hidden = ["/", "/login", "/onboarding", "/scan"].includes(pathname);
  if (hidden) return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen(true),
        "aria-label": "Open NutriBot",
        className: "fixed right-4 z-30 group focus:outline-none",
        style: {
          // Sit above bottom nav (h-16 = 4rem) + nav offset (0.75rem) with ~20px breathing room
          bottom: "calc(5rem + 1.25rem + env(safe-area-inset-bottom))"
        },
        children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "absolute inset-0 rounded-full bg-emerald-400/40 blur-xl animate-ping",
              "aria-hidden": true,
              style: { animationDuration: "2.4s" }
            }
          ),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: "absolute -inset-1 rounded-full bg-emerald-500/30 blur-md animate-pulse",
              "aria-hidden": true
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_12px_30px_-6px_rgba(16,185,129,0.65)] border border-emerald-300/40 active:scale-95 transition-transform", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5 text-black", strokeWidth: 2.5 }),
            /* @__PURE__ */ jsx("span", { className: "absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-white border-2 border-zinc-950" })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx(Sheet, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxs(
      SheetContent,
      {
        side: "bottom",
        className: "h-[92dvh] p-0 border-0 bg-zinc-950 rounded-t-3xl overflow-hidden flex flex-col",
        children: [
          /* @__PURE__ */ jsx(SheetTitle, { className: "sr-only", children: "NutriBot AI Chat" }),
          /* @__PURE__ */ jsx(SheetDescription, { className: "sr-only", children: "Chat with your personalized AI nutrition coach." }),
          /* @__PURE__ */ jsx("div", { className: "mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/15 shrink-0" }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0", children: /* @__PURE__ */ jsx(ChatPanel, { onClose: () => setOpen(false) }) })
        ]
      }
    ) })
  ] });
}
function AppShell() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    const check = async () => {
      const {
        data: sessionData
      } = await supabase.auth.getSession();
      let user = sessionData.session?.user ?? null;
      if (!user) {
        const {
          data
        } = await supabase.auth.getUser();
        user = data.user ?? null;
      }
      if (!active) return;
      if (!user || user.is_anonymous) {
        navigate({
          to: "/",
          replace: true
        });
        return;
      }
      setReady(true);
    };
    void check();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (session?.user?.is_anonymous ?? false)) {
        navigate({
          to: "/",
          replace: true
        });
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);
  if (!ready) {
    return /* @__PURE__ */ jsx("div", { className: "app-shell flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "app-shell", children: [
    /* @__PURE__ */ jsx(TrialBanner, {}),
    /* @__PURE__ */ jsx(Outlet, {}),
    /* @__PURE__ */ jsx(NutriBotFab, {}),
    /* @__PURE__ */ jsx(BottomNav, {})
  ] });
}
export {
  AppShell as component
};
