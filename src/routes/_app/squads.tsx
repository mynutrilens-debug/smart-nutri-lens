import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createSquad, joinSquadByCode, listMySquads } from "@/lib/squad.functions";
import { Users, Trophy, Plus, ArrowLeft, Sparkles, Target, ChevronRight, Flame, Copy, Lock, Globe, Gift, Crown, Zap, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/squads")({
  component: SquadsPage,
});

const CHALLENGES = [
  { id: "weight_loss", label: "Weight Loss", emoji: "⚖️" },
  { id: "muscle_gain", label: "Muscle Gain", emoji: "💪" },
  { id: "steps", label: "Steps", emoji: "🏃" },
  { id: "healthy_eating", label: "Healthy Eating", emoji: "🥗" },
  { id: "workout", label: "Workout", emoji: "🏋️" },
  { id: "hydration", label: "Hydration", emoji: "💧" },
  { id: "sleep", label: "Sleep", emoji: "😴" },
  { id: "custom", label: "Custom", emoji: "✨" },
] as const;

function SquadsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listMySquads);
  const { data: squads = [] } = useQuery({ queryKey: ["squads"], queryFn: () => list() });

  const [mode, setMode] = useState<"none" | "create" | "join">("none");
  const [name, setName] = useState("");
  const [challenge, setChallenge] = useState<typeof CHALLENGES[number]["id"]>("workout");
  const [customChallenge, setCustomChallenge] = useState("");
  const [goal, setGoal] = useState("");
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [maxMembers, setMaxMembers] = useState<number>(10);
  const [reward, setReward] = useState<"coupon" | "platinum" | "badge">("coupon");
  const [code, setCode] = useState("");

  const createFn = useServerFn(createSquad);
  const joinFn = useServerFn(joinSquadByCode);

  const createMut = useMutation({
    mutationFn: () => createFn({
      data: {
        name: name.trim(),
        challenge_type: challenge,
        custom_challenge: challenge === "custom" ? customChallenge.trim() : null,
        goal_description: goal.trim() || null,
        period,
      },
    }),
    onSuccess: (s: any) => {
      toast.success("Squad ready!");
      qc.invalidateQueries({ queryKey: ["squads"] });
      navigate({ to: "/squads/$squadId", params: { squadId: s.id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const joinMut = useMutation({
    mutationFn: () => joinFn({ data: { code: code.trim() } }),
    onSuccess: (r: any) => {
      toast.success("Joined!");
      qc.invalidateQueries({ queryKey: ["squads"] });
      navigate({ to: "/squads/$squadId", params: { squadId: r.squad_id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Invalid code"),
  });

  return (
    <div className="px-5 pt-12 pb-28 space-y-5 relative">
      <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <header className="flex items-center gap-3 animate-slide-up">
        <Link to="/home" className="h-9 w-9 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Community</p>
          <h1 className="text-2xl font-bold tracking-tight">Squad Challenges</h1>
        </div>
      </header>

      {mode === "none" && (
        <>
          <section className="animate-slide-up">
            <button
              onClick={() => setMode("create")}
              className="group relative w-full overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.14] via-white/[0.02] to-cyan-500/[0.10] p-5 text-left shadow-[0_20px_60px_-30px_rgba(52,211,153,0.55)] backdrop-blur-2xl"
            >
              <div className="absolute -top-14 -right-10 h-40 w-40 rounded-full bg-emerald-400/25 blur-3xl" />
              <div className="absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
              <div className="relative flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_28px_rgba(52,211,153,0.55)]">
                  <Plus className="h-6 w-6 text-black" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300 font-semibold">Premium</p>
                  <p className="text-lg font-bold">Create your squad</p>
                  <p className="text-[11px] text-muted-foreground">Public or private · pick rewards, member limits & duration</p>
                </div>
                <ChevronRight className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="relative mt-4 grid grid-cols-4 gap-2">
                {[
                  { icon: <Lock className="h-3.5 w-3.5 text-emerald-300" />, l: "Private" },
                  { icon: <Users className="h-3.5 w-3.5 text-cyan-300" />, l: "Limits" },
                  { icon: <Calendar className="h-3.5 w-3.5 text-fuchsia-300" />, l: "Duration" },
                  { icon: <Gift className="h-3.5 w-3.5 text-amber-300" />, l: "Rewards" },
                ].map((r) => (
                  <div key={r.l} className="rounded-xl bg-black/30 border border-white/[0.06] px-1.5 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">{r.icon}<span className="text-[9px] uppercase tracking-widest text-muted-foreground">{r.l}</span></div>
                  </div>
                ))}
              </div>
            </button>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: ".05s" }}>
            <button onClick={() => setMode("join")} className="w-full rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-4 text-left flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center">
                <Users className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Join with invite code</p>
                <p className="text-[11px] text-muted-foreground">Got a FIT-XXXXXX code from a friend?</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: ".1s" }}>
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-300" /> My squads</h3>
              <span className="text-[11px] text-muted-foreground tabular-nums">{squads.length}</span>
            </div>
            {squads.length === 0 ? (
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center animate-pulse">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-semibold mt-3">Start your first squad</p>
                <p className="text-xs text-muted-foreground mt-1">Compete weekly, earn coupons, Platinum days, and badges.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {squads.map((s: any) => {
                  const done = s.finalized_at || new Date(s.ends_at) < new Date();
                  const daysLeft = Math.max(0, Math.ceil((new Date(s.ends_at).getTime() - Date.now()) / 86400000));
                  return (
                    <Link key={s.id} to="/squads/$squadId" params={{ squadId: s.id }} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 flex items-center justify-center text-xl">
                        {CHALLENGES.find(c => c.id === s.challenge_type)?.emoji ?? "🏆"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{s.period} · {s.challenge_type.replace("_", " ")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-emerald-300">{done ? "Ended" : `${daysLeft}d left`}</p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{s.code}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {mode === "create" && (
        <section className="space-y-4 animate-slide-up">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Squad name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Iron Circle" className="mt-1 w-full rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-3 text-sm focus:outline-none focus:border-emerald-400/40" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Challenge type</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {CHALLENGES.map((c) => (
                  <button key={c.id} onClick={() => setChallenge(c.id)} className={`rounded-2xl p-2.5 text-center border transition-all ${challenge === c.id ? "border-emerald-400/50 bg-emerald-500/[0.12] shadow-[0_0_18px_rgba(52,211,153,0.25)]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                    <div className="text-lg">{c.emoji}</div>
                    <p className="text-[10px] mt-0.5 leading-tight">{c.label}</p>
                  </button>
                ))}
              </div>
            </div>
            {challenge === "custom" && (
              <div>
                <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Custom challenge</label>
                <input value={customChallenge} onChange={(e) => setCustomChallenge(e.target.value)} maxLength={80} placeholder="e.g. No sugar week" className="mt-1 w-full rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-3 text-sm focus:outline-none focus:border-emerald-400/40" />
              </div>
            )}
            <div>
              <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Goal (optional)</label>
              <input value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={200} placeholder="Lose 2kg / 70k steps / 5 workouts" className="mt-1 w-full rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-3 text-sm focus:outline-none focus:border-emerald-400/40" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Period</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["weekly", "monthly"] as const).map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className={`rounded-2xl py-3 text-sm capitalize border ${period === p ? "border-emerald-400/50 bg-emerald-500/[0.12]" : "border-white/[0.06] bg-white/[0.02]"}`}>{p}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMode("none")} className="rounded-2xl py-3 border border-white/[0.06] bg-white/[0.03] text-sm">Cancel</button>
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || name.trim().length < 2}
              className="rounded-2xl py-3 text-sm font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 text-black shadow-[0_0_24px_rgba(52,211,153,0.4)] disabled:opacity-50"
            >
              {createMut.isPending ? "Creating…" : "Create squad"}
            </button>
          </div>
        </section>
      )}

      {mode === "join" && (
        <section className="space-y-4 animate-slide-up">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5">
            <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Invite code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12} placeholder="ABC123" className="mt-1 w-full rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-4 text-lg font-mono tracking-widest text-center focus:outline-none focus:border-emerald-400/40" />
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5"><Target className="h-3 w-3" /> 6 characters, letters + numbers</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setMode("none")} className="rounded-2xl py-3 border border-white/[0.06] bg-white/[0.03] text-sm">Cancel</button>
            <button
              onClick={() => joinMut.mutate()}
              disabled={joinMut.isPending || code.trim().length < 4}
              className="rounded-2xl py-3 text-sm font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 text-black shadow-[0_0_24px_rgba(52,211,153,0.4)] disabled:opacity-50"
            >
              {joinMut.isPending ? "Joining…" : "Join squad"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
