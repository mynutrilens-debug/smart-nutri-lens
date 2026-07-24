import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getSquadLeaderboard,
  finalizeSquad,
  leaveSquad,
  updateSquad,
  deleteSquad,
} from "@/lib/squad.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Copy, Share2, Trophy, Flame, Crown, Medal, Award, LogOut, Loader2,
  Sparkles, Users, Pencil, Trash2, Radio, Check, X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/squads/$squadId")({
  component: SquadDetail,
});

function SquadDetail() {
  const { squadId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const board = useServerFn(getSquadLeaderboard);

  const { data, isLoading } = useQuery({
    queryKey: ["squad", squadId],
    queryFn: () => board({ data: { squad_id: squadId } }),
    refetchInterval: 30000,
  });

  const finalizeFn = useServerFn(finalizeSquad);
  const leaveFn = useServerFn(leaveSquad);
  const updateFn = useServerFn(updateSquad);
  const deleteFn = useServerFn(deleteSquad);

  const finalizeMut = useMutation({
    mutationFn: () => finalizeFn({ data: { squad_id: squadId } }),
    onSuccess: (r: any) => {
      toast.success(r.youWon ? "🏆 You placed on the podium!" : "Rewards distributed");
      qc.invalidateQueries({ queryKey: ["squad", squadId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const leaveMut = useMutation({
    mutationFn: () => leaveFn({ data: { squad_id: squadId } }),
    onSuccess: () => {
      toast.success("Left squad");
      qc.invalidateQueries({ queryKey: ["squads"] });
      navigate({ to: "/squads" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteFn({ data: { squad_id: squadId } }),
    onSuccess: () => {
      toast.success("Squad deleted");
      qc.invalidateQueries({ queryKey: ["squads"] });
      navigate({ to: "/squads" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const squad = data?.squad;
  const leaderboard = data?.leaderboard ?? [];
  const me = data?.me;
  const rewards = data?.rewards ?? [];

  // Owner detection via current auth user
  const [meId, setMeId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);
  const isOwner = !!(squad && meId && squad.owner_id === meId);

  // Realtime: any change in members/rewards/squad OR activity by squad members refetches
  const memberIds = useMemo(() => leaderboard.map((l) => l.user_id).join(","), [leaderboard]);
  useEffect(() => {
    const refetch = () => qc.invalidateQueries({ queryKey: ["squad", squadId] });
    const channel = supabase
      .channel(`squad-live-${squadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "squads", filter: `id=eq.${squadId}` }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "squad_members", filter: `squad_id=eq.${squadId}` }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "squad_rewards", filter: `squad_id=eq.${squadId}` }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "food_logs" }, (p: any) => {
        if (memberIds.includes(p.new?.user_id ?? p.old?.user_id ?? "")) refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "workouts" }, (p: any) => {
        if (memberIds.includes(p.new?.user_id ?? p.old?.user_id ?? "")) refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "weight_entries" }, (p: any) => {
        if (memberIds.includes(p.new?.user_id ?? p.old?.user_id ?? "")) refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "health_snapshots" }, (p: any) => {
        if (memberIds.includes(p.new?.user_id ?? p.old?.user_id ?? "")) refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [squadId, memberIds, qc]);

  const now = Date.now();
  const endMs = squad ? new Date(squad.ends_at).getTime() : 0;
  const startMs = squad ? new Date(squad.starts_at).getTime() : 0;
  const totalMs = Math.max(1, endMs - startMs);
  const elapsedPct = Math.min(100, Math.max(0, ((now - startMs) / totalMs) * 100));
  const daysLeft = Math.max(0, Math.ceil((endMs - now) / 86400000));
  const isEnded = squad ? new Date(squad.ends_at) < new Date() : false;
  const finalized = !!squad?.finalized_at;

  useEffect(() => {
    if (isEnded && !finalized && !finalizeMut.isPending) finalizeMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnded, finalized]);

  const shareLink = useMemo(() => {
    if (!squad || typeof window === "undefined") return "";
    return `${window.location.origin}/squads/join/${squad.code}`;
  }, [squad]);

  const copyCode = () => { if (squad) { navigator.clipboard.writeText(squad.code); toast.success("Code copied"); } };
  const copyLink = () => { navigator.clipboard.writeText(shareLink); toast.success("Invite link copied"); };
  const doShare = async () => {
    if (!squad) return;
    if (navigator.share) {
      try { await navigator.share({ title: `Join my squad: ${squad.name}`, text: `Compete with me on MyNutriLens · Code ${squad.code}`, url: shareLink }); } catch {}
    } else copyLink();
  };

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (squad && !editing) {
      setEditName(squad.name);
      setEditGoal(squad.goal_description ?? "");
    }
  }, [squad, editing]);

  const editMut = useMutation({
    mutationFn: () => updateFn({ data: {
      squad_id: squadId,
      name: editName.trim(),
      goal_description: editGoal.trim() ? editGoal.trim() : null,
    }}),
    onSuccess: () => {
      toast.success("Squad updated");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["squad", squadId] });
      qc.invalidateQueries({ queryKey: ["squads"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !squad) {
    return <div className="app-shell flex items-center justify-center pt-24"><Loader2 className="h-6 w-6 animate-spin text-emerald-300" /></div>;
  }

  const rankIcon = (i: number) => i === 0 ? <Crown className="h-4 w-4 text-amber-300" /> : i === 1 ? <Medal className="h-4 w-4 text-slate-300" /> : i === 2 ? <Award className="h-4 w-4 text-orange-300" /> : null;

  return (
    <div className="px-5 pt-12 pb-28 space-y-5 relative">
      <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <header className="flex items-center gap-3 animate-slide-up">
        <Link to="/squads" className="h-9 w-9 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground capitalize flex items-center gap-1.5">
            {squad.period} · {squad.challenge_type.replace("_", " ")}
            <span className="inline-flex items-center gap-1 text-emerald-300 normal-case tracking-normal"><Radio className="h-3 w-3 animate-pulse" /> live</span>
          </p>
          {editing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={60}
              className="mt-1 w-full bg-white/[0.04] border border-emerald-400/30 rounded-xl px-3 py-2 text-xl font-bold tracking-tight focus:outline-none"
            />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight truncate">{squad.name}</h1>
          )}
        </div>
        {isOwner && !editing && (
          <button onClick={() => setEditing(true)} className="h-9 w-9 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <Pencil className="h-4 w-4 text-emerald-300" />
          </button>
        )}
      </header>

      {/* Owner edit panel */}
      {isOwner && editing && (
        <section className="rounded-3xl border border-emerald-400/25 bg-white/[0.03] backdrop-blur-xl p-4 space-y-3 animate-slide-up">
          <div>
            <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Goal description</label>
            <input
              value={editGoal}
              onChange={(e) => setEditGoal(e.target.value)}
              maxLength={200}
              placeholder="e.g. Lose 2kg together"
              className="mt-1 w-full rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-2xl py-2.5 border border-white/[0.06] bg-white/[0.03] text-sm flex items-center justify-center gap-1.5"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              onClick={() => editMut.mutate()}
              disabled={editMut.isPending || editName.trim().length < 2}
              className="rounded-2xl py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 text-black flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> {editMut.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </section>
      )}

      {/* Invite card */}
      <section className="relative rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.08] via-white/[0.02] to-cyan-500/[0.06] backdrop-blur-xl p-5 animate-slide-up" style={{ animationDelay: ".05s" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Invite code</p>
            <p className="text-3xl font-mono font-bold tracking-widest text-emerald-200 mt-1">{squad.code}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyCode} className="h-10 w-10 rounded-2xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center"><Copy className="h-4 w-4" /></button>
            <button onClick={doShare} className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_18px_rgba(52,211,153,0.4)]"><Share2 className="h-4 w-4 text-black" /></button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {leaderboard.length} member{leaderboard.length === 1 ? "" : "s"}</span>
          <span className="tabular-nums text-emerald-300">{finalized ? "Finalized" : isEnded ? "Ended" : `${daysLeft}d left`}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-[width] duration-1000" style={{ width: `${elapsedPct}%` }} />
        </div>
      </section>

      {/* Your stats */}
      {me && (
        <section className="animate-slide-up" style={{ animationDelay: ".1s" }}>
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Your rank</p>
                <p className="text-2xl font-bold mt-0.5">#{leaderboard.findIndex(l => l.user_id === me.user_id) + 1} <span className="text-sm text-muted-foreground font-normal">of {leaderboard.length}</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Points</p>
                <p className="text-2xl font-bold tabular-nums text-emerald-300">{me.points}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[
                { label: "Meals", val: me.breakdown.meals },
                { label: "Workouts", val: me.breakdown.workouts },
                { label: "Steps", val: me.breakdown.steps },
                { label: "Streak", val: me.breakdown.streak },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-bold tabular-nums text-emerald-200 mt-0.5">{s.val}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Rewards podium (if finalized) */}
      {finalized && rewards.length > 0 && (
        <section className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.1] via-white/[0.02] to-orange-500/[0.06] backdrop-blur-xl p-5 animate-slide-up" style={{ animationDelay: ".15s" }}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-amber-300" />
            <h3 className="text-sm font-semibold">Podium & prizes</h3>
          </div>
          <div className="space-y-2">
            {[...rewards].sort((a, b) => a.rank - b.rank).map((r: any) => {
              const winner = leaderboard.find(l => l.user_id === r.user_id);
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center font-bold text-black">#{r.rank}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{winner?.display_name ?? "Athlete"}</p>
                    <p className="text-[10px] text-muted-foreground">+{r.platinum_days}d Platinum · +{r.xp_bonus} XP · {r.badge}</p>
                  </div>
                  {r.coupon_code && (
                    <button onClick={() => { navigator.clipboard.writeText(r.coupon_code); toast.success("Coupon copied"); }} className="rounded-xl bg-white/[0.06] border border-white/[0.06] px-2.5 py-1.5 text-[10px] font-mono">{r.coupon_code}</button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Leaderboard */}
      <section className="animate-slide-up" style={{ animationDelay: ".2s" }}>
        <div className="flex items-center justify-between px-1 mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-300" /> Leaderboard</h3>
          <span className="text-[10px] uppercase tracking-wider text-emerald-300 flex items-center gap-1"><Radio className="h-3 w-3 animate-pulse" /> Real-time</span>
        </div>
        {leaderboard.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-6 text-center">
            <Sparkles className="h-6 w-6 text-emerald-300 mx-auto" />
            <p className="text-sm font-semibold mt-2">No members yet</p>
            <p className="text-xs text-muted-foreground mt-1">Share your invite code to fill the roster.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((row, i) => {
              const isMe = me && row.user_id === me.user_id;
              const isSquadOwner = row.user_id === squad.owner_id;
              return (
                <div key={row.user_id} className={`flex items-center gap-3 rounded-2xl border p-3.5 backdrop-blur-xl transition-all ${
                  isMe ? "border-emerald-400/40 bg-emerald-500/[0.08] shadow-[0_0_20px_rgba(52,211,153,0.15)]"
                       : "border-white/[0.06] bg-white/[0.03]"
                }`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold tabular-nums ${
                    i === 0 ? "bg-gradient-to-br from-amber-400 to-orange-400 text-black shadow-[0_0_16px_rgba(251,191,36,0.5)]" :
                    i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-black" :
                    i === 2 ? "bg-gradient-to-br from-orange-500 to-orange-700 text-white" :
                    "bg-white/[0.06] text-foreground/70"
                  }`}>
                    {i < 3 ? rankIcon(i) : `#${i + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                      {row.display_name}
                      {isSquadOwner && <Crown className="h-3 w-3 text-amber-300" />}
                      {isMe && <span className="text-[10px] text-emerald-300">(you)</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      <Flame className="h-3 w-3 text-orange-300" /> {row.streak_days}d active · {row.breakdown.workouts / 30 | 0} workouts
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold tabular-nums text-emerald-300">{row.points}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">points</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="animate-slide-up space-y-2" style={{ animationDelay: ".25s" }}>
        {isOwner ? (
          confirmDelete ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/[0.08] p-3 space-y-2">
              <p className="text-xs text-rose-200">Delete this squad for everyone? This can't be undone.</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setConfirmDelete(false)} className="rounded-xl py-2 text-xs border border-white/[0.08] bg-white/[0.04]">Cancel</button>
                <button
                  onClick={() => deleteMut.mutate()}
                  disabled={deleteMut.isPending}
                  className="rounded-xl py-2 text-xs font-semibold bg-rose-500 text-white disabled:opacity-50"
                >
                  {deleteMut.isPending ? "Deleting…" : "Delete squad"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] text-rose-300 py-3 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" /> Delete squad (owner)
            </button>
          )
        ) : (
          <button onClick={() => leaveMut.mutate()} disabled={leaveMut.isPending} className="w-full rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] text-rose-300 py-3 text-sm font-medium flex items-center justify-center gap-2">
            <LogOut className="h-4 w-4" /> {leaveMut.isPending ? "Leaving…" : "Leave squad"}
          </button>
        )}
      </section>
    </div>
  );
}
