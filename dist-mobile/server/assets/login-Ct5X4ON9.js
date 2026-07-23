import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { s as supabase } from "./client-BMbiJotd.js";
import { g as getAuthRedirectUrl, s as signInWithNativeOAuth } from "./router-D-2d6VGp.js";
import { toast } from "sonner";
import { Leaf, CheckCircle2, Flame, Dumbbell, Salad, Mail, Lock, Loader2, Sparkles } from "lucide-react";
import { h as heroBg } from "./fitness-hero-dark-Db3tEzAO.js";
import "@supabase/supabase-js";
import "@tanstack/react-query";
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
import "./createMiddleware-BvN2ghIY.js";
function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const {
          data,
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl("/home")
          }
        });
        if (error) throw error;
        if (data.session) {
          navigate({
            to: "/home",
            replace: true
          });
        } else {
          toast.success("Welcome — check your email to confirm.");
        }
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        navigate({
          to: "/home",
          replace: true
        });
      }
    } catch (err) {
      toast.error(err.message ?? "Auth failed");
    } finally {
      setLoading(false);
    }
  }
  async function google() {
    setLoading(true);
    try {
      const openedNative = await signInWithNativeOAuth("google");
      if (openedNative) return;
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthRedirectUrl("/home")
        }
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err?.message ?? "Google sign-in failed");
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "app-shell relative overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative h-[58vh] min-h-[440px] w-full overflow-hidden", children: [
      /* @__PURE__ */ jsx("img", { src: heroBg, alt: "Dark gym, athlete with emerald neon ring", className: "absolute inset-0 h-full w-full object-cover scale-105 animate-hero-pan" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-[oklch(0.07_0.01_160)]" }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-[oklch(0.78_0.20_150/0.30)] blur-[80px]" }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-72 w-[120%] bg-gradient-to-t from-[oklch(0.07_0.01_160)] to-transparent" }),
      /* @__PURE__ */ jsxs("div", { className: "absolute top-6 left-5 flex items-center gap-2 animate-slide-up", children: [
        /* @__PURE__ */ jsx("div", { className: "h-7 w-7 rounded-lg bg-[oklch(0.78_0.20_150/0.15)] border border-[oklch(0.78_0.20_150/0.4)] flex items-center justify-center", children: /* @__PURE__ */ jsx(Leaf, { className: "h-4 w-4 text-[oklch(0.85_0.20_140)]" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-[15px] font-bold tracking-tight", children: [
          /* @__PURE__ */ jsx("span", { className: "text-white", children: "my" }),
          /* @__PURE__ */ jsx("span", { className: "text-[oklch(0.85_0.20_140)]", children: "nutrilens" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(FloatChip, { className: "top-20 left-4 animate-float", icon: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5 text-[oklch(0.85_0.20_140)]" }), text: "+25g Protein" }),
      /* @__PURE__ */ jsx(FloatChip, { className: "top-24 right-4 animate-float-b [animation-delay:-2s]", icon: /* @__PURE__ */ jsx(Flame, { className: "h-3.5 w-3.5 text-[oklch(0.78_0.18_60)]" }), text: "2,751 kcal 🔥" }),
      /* @__PURE__ */ jsx(FloatChip, { className: "top-48 left-6 animate-float [animation-delay:-4s]", icon: /* @__PURE__ */ jsx(Dumbbell, { className: "h-3.5 w-3.5 text-[oklch(0.85_0.20_140)]" }), text: "Workout Ready 💪" }),
      /* @__PURE__ */ jsx(FloatChip, { className: "top-52 right-5 animate-float-b [animation-delay:-1.2s]", icon: /* @__PURE__ */ jsx(Salad, { className: "h-3.5 w-3.5 text-[oklch(0.85_0.20_140)]" }), text: "Personalized Plan" }),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-x-0 bottom-10 px-6 text-center animate-slide-up", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[oklch(0.78_0.20_150/0.12)] border border-[oklch(0.78_0.20_150/0.4)] backdrop-blur-md text-[10px] uppercase tracking-[0.2em] text-[oklch(0.92_0.10_145)]", children: [
          /* @__PURE__ */ jsx(Leaf, { className: "h-3 w-3" }),
          " Real Food. Real Results."
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "mt-3 text-[34px] leading-[1.05] font-extrabold tracking-tight text-white", children: [
          "Transform Your Body",
          /* @__PURE__ */ jsx("br", {}),
          "with ",
          /* @__PURE__ */ jsx("span", { className: "text-[oklch(0.85_0.20_140)]", children: "mynutrilens" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-white/65 max-w-[320px] mx-auto", children: "Scan meals, get diet plans & workouts instantly." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative px-6 pb-10 -mt-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-center gap-2 mb-6", children: [
        /* @__PURE__ */ jsx(ProofChip, { children: "10k+ meals scanned" }),
        /* @__PURE__ */ jsx(ProofChip, { children: "87% hit goals" }),
        /* @__PURE__ */ jsx(ProofChip, { children: "Instant AI" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "glass rounded-[28px] p-6 mt-8 animate-slide-up border-white/10", children: [
        /* @__PURE__ */ jsx("div", { className: "flex bg-white/[0.04] rounded-2xl p-1 mb-5", children: ["signin", "signup"].map((m) => /* @__PURE__ */ jsx("button", { onClick: () => setMode(m), className: `flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === m ? "bg-gradient-to-r from-[oklch(0.85_0.20_140)] to-[oklch(0.62_0.18_160)] text-[oklch(0.10_0.02_160)] shadow-[0_8px_30px_-10px_oklch(0.78_0.20_150/0.9)]" : "text-muted-foreground"}`, children: m === "signin" ? "Sign in" : "Sign up" }, m)) }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Mail, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx("input", { required: true, type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@email.com", className: "w-full pl-10 pr-3 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm outline-none focus:border-[oklch(0.72_0.22_240/0.7)] focus:bg-white/[0.07] transition" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Lock, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx("input", { required: true, type: "password", minLength: 6, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Password", className: "w-full pl-10 pr-3 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm outline-none focus:border-[oklch(0.72_0.22_240/0.7)] focus:bg-white/[0.07] transition" })
          ] }),
          /* @__PURE__ */ jsxs("button", { disabled: loading, type: "submit", className: "w-full py-3.5 rounded-2xl bg-gradient-to-r from-[oklch(0.85_0.20_140)] via-[oklch(0.78_0.20_150)] to-[oklch(0.62_0.18_160)] text-[oklch(0.10_0.02_160)] font-bold shadow-[0_14px_40px_-12px_oklch(0.78_0.20_150/0.95)] flex items-center justify-center gap-2 active:scale-[.98] transition", children: [
            loading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
            mode === "signin" ? "Start My Journey" : "Start My Transformation"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground", children: [
          /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-white/10" }),
          " or ",
          /* @__PURE__ */ jsx("div", { className: "h-px flex-1 bg-white/10" })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: google, disabled: loading, className: "w-full py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-foreground font-medium flex items-center justify-center gap-3 active:scale-[.98] transition", children: [
          /* @__PURE__ */ jsxs("svg", { className: "h-4 w-4", viewBox: "0 0 24 24", children: [
            /* @__PURE__ */ jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" }),
            /* @__PURE__ */ jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" }),
            /* @__PURE__ */ jsx("path", { fill: "#FBBC05", d: "M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z" }),
            /* @__PURE__ */ jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" })
          ] }),
          "Continue with Google"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-center text-[11px] text-muted-foreground", children: "By continuing you agree to our Terms & Privacy." })
      ] })
    ] })
  ] });
}
function FloatChip({
  className = "",
  icon,
  text
}) {
  return /* @__PURE__ */ jsxs("div", { className: `absolute glass-strong rounded-full pl-2 pr-3 py-1.5 flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] ${className}`, children: [
    icon,
    /* @__PURE__ */ jsx("span", { children: text })
  ] });
}
function ProofChip({
  children
}) {
  return /* @__PURE__ */ jsx("span", { className: "text-[11px] px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-muted-foreground", children });
}
export {
  Login as component
};
