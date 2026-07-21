import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSquadLeaderboard } from "@/lib/squad.functions";
import { Crown, Users, Flame, Zap, Trophy, Copy, Share2, UserPlus, ChevronRight, Sparkles, Gift } from "lucide-react";
import { toast } from "sonner";

const CHALLENGE_EMOJI: Record<string, string> = {
  weight_loss: "⚖️", muscle_gain: "💪", steps: "🏃", healthy_eating: "🥗",
  workout: "🏋️", hydration: "💧", sleep: "😴", custom: "✨",
};

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "A";
}

function avatarTone(i: number) {
  const tones = [
    "from-emerald-400 to-cyan-400",
    "from-fuchsia-400 to-pink-400",
    "from-amber-400 to-orange-400",
    "from-sky-400 to-indigo-400",
    "from-lime-400 to-emerald-400",
  ];
  return tones[i % tones.length];
}

export function SquadHeroCard({ squad }: { squad: any }) {
  const lbFn = useServerFn(getSquadLeaderboard);
  const { data } = useQuery({
    queryKey: ["squad", squad.id, "leaderboard"],
    queryFn: () => lbFn({ data: { squad_id: squad.id } }),
    staleTime: 60_000,
  });

  const leaderboard: any[] = data?.leaderboard ?? [];
  const me = data?.me;
  const leader = leaderboard[0];
  const myRank = me ? leaderboard.findIndex((l) => l.user_id === me.user_id) + 1 : 0;
  const memberCount = leaderboard.length || 1;
  const streak = me?.streak_days ?? 0;
  const weeklyXP = me?.points ?? 0;
  const daysLeft = Math.max(0, Math.ceil((new Date(squad.ends_at).getTime() - Date.now()) / 86400000));
  const totalDays = squad.period === "monthly" ? 30 : 7;
  const elapsed = Math.min(totalDays, totalDays - daysLeft);
  const progress = Math.round((elapsed / totalDays) * 100);

  const goalPts = squad.period === "monthly" ? 1500 : 400;
  const rewardProgress = Math.min(100, Math.round(((me?.points ?? 0) / goalPts) * 100));

  const inviteCode = `FIT-${squad.code}`;
  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/squads/join/${squad.code}`
    : `/squads/join/${squad.code}`;

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(inviteCode); toast.success("Code copied"); } catch { toast.error("Copy failed"); }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(inviteLink); toast.success("Link copied"); } catch { toast.error("Copy failed"); }
  };
  const shareInvite = async () => {
    const payload = { title: `Join ${squad.name} on MyNutriLens`, text: `Squad code: ${inviteCode}`, url: inviteLink };
    try {
      if (navigator.share) await navigator.share(payload);
      else await copyLink();
    } catch { /* user cancelled */ }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.10] via-white/[0.02] to-cyan-500/[0.06] backdrop-blur-2xl p-5 shadow-[0_20px_60px_-30px_rgba(52,211,153,0.6)]">
      {/* soft glow */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

      {/* Header */}
      <div className="relative flex items-start gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-2xl shadow-[0_0_24px_rgba(52,211,153,0.45)]">
          {CHALLENGE_EMOJI[squad.challenge_type] ?? "🏆"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300 font-semibold">Your Squad</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-400/15 border border-emerald-400/25 text-emerald-200 uppercase tracking-wider">Live</span>
          </div>
          <h3 className="text-lg font-bold tracking-tight truncate">{squad.name}</h3>
          <p className="text-[11px] text-muted-foreground capitalize">{String(squad.challenge_type).replace("_", " ")} · {squad.period}</p>
        </div>
        <Link to="/squads/$squadId" params={{ squadId: squad.id }} className="h-8 w-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="relative mt-4 grid grid-cols-4 gap-2">
        {[
          { icon: <Trophy className="h-3.5 w-3.5 text-amber-300" />, label: "Rank", val: myRank ? `#${myRank}` : "—" },
          { icon: <Users className="h-3.5 w-3.5 text-cyan-300" />, label: "Members", val: memberCount },
          { icon: <Flame className="h-3.5 w-3.5 text-orange-300" />, label: "Streak", val: `${streak}d` },
          { icon: <Zap className="h-3.5 w-3.5 text-emerald-300" />, label: "XP", val: weeklyXP },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-black/30 border border-white/[0.06] px-2 py-2.5 text-center backdrop-blur-xl">
            <div className="flex items-center justify-center gap-1">{s.icon}<span className="text-[9px] uppercase tracking-widest text-muted-foreground">{s.label}</span></div>
            <p className="text-sm font-bold tabular-nums mt-0.5">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Members row + days left */}
      <div className="relative mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {leaderboard.slice(0, 5).map((m, i) => (
            <div key={m.user_id} className="relative">
              <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${avatarTone(i)} border-2 border-[#0a0f0d] flex items-center justify-center text-[10px] font-bold text-black shadow-[0_0_10px_rgba(52,211,153,0.35)]`}>
                {initials(m.display_name || "A")}
              </div>
              {i === 0 && leader && (
                <Crown className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-3.5 w-3.5 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
              )}
            </div>
          ))}
          {memberCount > 5 && (
            <div className="h-8 w-8 rounded-full bg-white/[0.06] border-2 border-[#0a0f0d] flex items-center justify-center text-[10px] font-semibold">
              +{memberCount - 5}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Days left</p>
          <p className="text-base font-bold text-emerald-300 tabular-nums">{daysLeft}<span className="text-[10px] text-muted-foreground">/{totalDays}</span></p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative mt-3">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-muted-foreground uppercase tracking-widest">Challenge progress</span>
          <span className="text-emerald-300 tabular-nums font-semibold">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-300 shadow-[0_0_12px_rgba(52,211,153,0.6)] transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Reward progress */}
      <div className="relative mt-3 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2.5">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-[0_0_16px_rgba(251,191,36,0.45)]">
          <Gift className="h-4 w-4 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold">Coupon + 3 Platinum days</p>
          <div className="mt-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-300 to-orange-300" style={{ width: `${rewardProgress}%` }} />
          </div>
        </div>
        <span className="text-[10px] font-mono text-amber-200">{rewardProgress}%</span>
      </div>

      {/* Invite code */}
      <div className="relative mt-3 flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-black/30 px-3 py-2.5 backdrop-blur-xl">
        <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Invite</span>
        <span className="flex-1 font-mono text-sm font-bold tracking-widest text-emerald-200">{inviteCode}</span>
        <button onClick={copyCode} className="text-[10px] px-2 py-1 rounded-lg bg-emerald-400/15 border border-emerald-400/25 text-emerald-200 font-medium">Copy</button>
      </div>

      {/* CTA row */}
      <div className="relative mt-3 grid grid-cols-3 gap-2">
        <button onClick={shareInvite} className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-emerald-400/15 to-emerald-400/5 py-2.5 backdrop-blur-xl active:scale-95 transition-transform">
          <UserPlus className="h-4 w-4 text-emerald-300" />
          <span className="text-[10px] font-semibold">Invite</span>
        </button>
        <button onClick={copyCode} className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] py-2.5 backdrop-blur-xl active:scale-95 transition-transform">
          <Copy className="h-4 w-4 text-cyan-300" />
          <span className="text-[10px] font-semibold">Copy Code</span>
        </button>
        <button onClick={copyLink} className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] py-2.5 backdrop-blur-xl active:scale-95 transition-transform">
          <Share2 className="h-4 w-4 text-fuchsia-300" />
          <span className="text-[10px] font-semibold">Share Link</span>
        </button>
      </div>

      {/* Mini leaderboard */}
      {leaderboard.length > 0 && (
        <div className="relative mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"><Trophy className="h-3 w-3 text-amber-300" /> Leaderboard</p>
            <Link to="/squads/$squadId" params={{ squadId: squad.id }} className="text-[10px] text-emerald-300 font-medium">View all</Link>
          </div>
          <div className="space-y-1.5">
            {leaderboard.slice(0, 3).map((m, i) => {
              const isMe = me && m.user_id === me.user_id;
              return (
                <div key={m.user_id} className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 border ${isMe ? "border-emerald-400/30 bg-emerald-400/[0.08]" : "border-white/[0.05] bg-white/[0.02]"}`}>
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold tabular-nums ${i === 0 ? "bg-amber-400/20 text-amber-300 border border-amber-400/30" : i === 1 ? "bg-slate-400/20 text-slate-200 border border-slate-400/30" : i === 2 ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "bg-white/[0.04] text-muted-foreground"}`}>
                    {i + 1}
                  </div>
                  <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${avatarTone(i)} flex items-center justify-center text-[9px] font-bold text-black`}>
                    {initials(m.display_name || "A")}
                  </div>
                  <p className="flex-1 text-xs font-medium truncate">{m.display_name}{isMe && <span className="ml-1 text-[9px] text-emerald-300">(you)</span>}</p>
                  <p className="text-xs font-bold tabular-nums text-emerald-200">{m.points}<span className="text-[9px] text-muted-foreground ml-0.5">XP</span></p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
