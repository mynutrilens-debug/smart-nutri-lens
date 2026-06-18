import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirectUrl, signInWithNativeOAuth } from "@/lib/native";

import { toast } from "sonner";
import {
  Mail, Lock, Loader2, Sparkles, Flame, Dumbbell, Bot, CheckCircle2, Zap,
} from "lucide-react";
import heroBg from "@/assets/fitness-hero.jpg";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: getAuthRedirectUrl("/home") },
        });
        if (error) throw error;
        if (data.session) {
          // Email confirmations off → straight into the app.
          navigate({ to: "/home", replace: true });
        } else {
          toast.success("Welcome — check your email to confirm.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home", replace: true });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Auth failed");
    } finally { setLoading(false); }
  }

  async function google() {
    setLoading(true);
    try {
      const openedNative = await signInWithNativeOAuth("google");
      if (openedNative) return;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getAuthRedirectUrl("/home") },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
      setLoading(false);
    }
  }

  return (
    <div className="app-shell relative overflow-hidden">
      {/* Full-bleed hero image */}
      <div className="relative h-[58vh] min-h-[440px] w-full overflow-hidden">
        <img
          src={heroBg}
          alt="Neon-lit fitness studio"
          className="absolute inset-0 h-full w-full object-cover scale-110 animate-hero-pan"
        />
        {/* Cinematic gradient veil */}
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.10_0.03_245/0.35)] via-[oklch(0.10_0.03_245/0.55)] to-[oklch(0.08_0.03_245)]" />
        {/* Neon blue glow accents */}
        <div className="pointer-events-none absolute -top-24 -left-20 h-80 w-80 rounded-full bg-[oklch(0.72_0.22_240/0.55)] blur-3xl" />
        <div className="pointer-events-none absolute -top-10 -right-16 h-72 w-72 rounded-full bg-[oklch(0.82_0.16_215/0.45)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-72 w-[120%] bg-gradient-to-t from-[oklch(0.08_0.03_245)] to-transparent" />

        {/* Floating automation chips over image */}
        <FloatChip className="top-10 left-5 animate-float [animation-duration:7s]" icon={<CheckCircle2 className="h-3.5 w-3.5 text-[oklch(0.82_0.16_215)]" />} text="+25g Protein" />
        <FloatChip className="top-20 right-5 animate-float-b [animation-duration:8.5s] [animation-delay:-2s]" icon={<Flame className="h-3.5 w-3.5 text-[oklch(0.78_0.2_60)]" />} text="2751 kcal 🔥" />
        <FloatChip className="top-44 left-8 animate-float [animation-duration:9s] [animation-delay:-4s]" icon={<Dumbbell className="h-3.5 w-3.5 text-[oklch(0.72_0.22_240)]" />} text="Workout Ready 💪" />
        <FloatChip className="top-56 right-6 animate-float-b [animation-duration:7.5s] [animation-delay:-1.2s]" icon={<Bot className="h-3.5 w-3.5 text-[oklch(0.62_0.26_260)]" />} text="AI Diet Plan 🤖" />

        {/* Headline overlay */}
        <div className="absolute inset-x-0 bottom-10 px-6 text-center animate-slide-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[oklch(0.72_0.22_240/0.18)] border border-[oklch(0.72_0.22_240/0.5)] backdrop-blur-md text-[10px] uppercase tracking-[0.2em] text-[oklch(0.92_0.08_215)]">
            <Zap className="h-3 w-3" /> AI Powered
          </div>
          <h1 className="mt-3 text-[36px] leading-[1.05] font-bold tracking-tight">
            Transform Your Body <br />with <span className="neon-text">MyNutriLens</span>
          </h1>
          <p className="mt-3 text-sm text-foreground/70 max-w-[320px] mx-auto">
            Scan meals, get diet plans & workouts instantly. Save ₹10–15k/month.
          </p>
        </div>
      </div>

      <div className="relative px-6 pb-10 -mt-6">
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <ProofChip>10k+ meals scanned</ProofChip>
          <ProofChip>87% hit goals</ProofChip>
          <ProofChip>Instant AI</ProofChip>
        </div>


        {/* Login card */}
        <div className="glass rounded-[28px] p-6 mt-8 animate-slide-up border-white/10">
          <div className="flex bg-white/[0.04] rounded-2xl p-1 mb-5">
            {(["signin","signup"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  mode===m
                    ? "bg-gradient-to-r from-[oklch(0.82_0.16_215)] to-[oklch(0.62_0.26_260)] text-white shadow-[0_8px_30px_-10px_oklch(0.72_0.22_240/0.9)]"
                    : "text-muted-foreground"
                }`}>
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input required type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full pl-10 pr-3 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm outline-none focus:border-[oklch(0.72_0.22_240/0.7)] focus:bg-white/[0.07] transition" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input required type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-3 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm outline-none focus:border-[oklch(0.72_0.22_240/0.7)] focus:bg-white/[0.07] transition" />
            </div>

            <button disabled={loading} type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[oklch(0.82_0.16_215)] via-[oklch(0.72_0.22_240)] to-[oklch(0.62_0.26_260)] text-white font-semibold shadow-[0_14px_40px_-12px_oklch(0.72_0.22_240/0.95)] flex items-center justify-center gap-2 active:scale-[.98] transition">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {mode === "signin" ? "Start My Journey" : "Start My Transformation"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
          </div>

          <button onClick={google} disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 text-foreground font-medium flex items-center justify-center gap-3 active:scale-[.98] transition">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </button>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our Terms & Privacy.
          </p>
        </div>
      </div>
    </div>
  );
}

function FloatChip({ className = "", icon, text }: { className?: string; icon: React.ReactNode; text: string }) {
  return (
    <div className={`absolute glass-strong rounded-full pl-2 pr-3 py-1.5 flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] ${className}`}>
      {icon}<span>{text}</span>
    </div>
  );
}

function ProofChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-muted-foreground">
      {children}
    </span>
  );
}
