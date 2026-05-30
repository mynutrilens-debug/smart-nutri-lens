import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardQuery } from "@/lib/queries";
import { CalorieRing } from "@/components/mobile/CalorieRing";
import { Flame, Beef, Wheat, Droplet, Sparkles, TrendingUp, Trophy, Plus, Loader2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { generateInsight } from "@/lib/scan.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/home")({
  component: Home,
});

function MacroBar({ icon: Icon, label, value, goal, color }: any) {
  const pct = Math.min(100, goal > 0 ? (value / goal) * 100 : 0);
  return (
    <div className="glass rounded-2xl p-3.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" style={{ color }} /> {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-xl font-bold tabular-nums">{Math.round(value)}</span>
        <span className="text-[11px] text-muted-foreground">/{goal}g</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, oklch(0.74 0.22 295))`, boxShadow: `0 0 12px ${color}` }} />
      </div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(dashboardQuery);
  const qc = useQueryClient();
  const profile = data.profile;
  useEffect(() => {
    if (profile && !profile.onboarded_at) navigate({ to: "/onboarding", replace: true });
  }, [profile, navigate]);
  const goal = profile?.daily_calorie_goal ?? 2200;
  const greet = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const insightMut = useMutation({
    mutationFn: () => generateInsight(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("New insight"); },
    onError: (e: any) => toast.error(e.message),
  });

  const weights = data.weights.map(w => ({ d: new Date(w.logged_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }), kg: Number(w.weight_kg) }));

  return (
    <div className="px-5 pt-12 pb-8 space-y-5">
      <header className="flex items-center justify-between animate-slide-up">
        <div>
          <p className="text-xs text-muted-foreground">{greet},</p>
          <h1 className="text-2xl font-bold tracking-tight">{profile?.display_name ?? "Athlete"} 👋</h1>
        </div>
        <div className="glass rounded-2xl px-3 py-2 flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tabular-nums">{profile?.streak_count ?? 0}</span>
          <span className="text-[11px] text-muted-foreground">day streak</span>
        </div>
      </header>

      <section className="glass rounded-3xl p-5 animate-slide-up" style={{ animationDelay: ".05s" }}>
        <CalorieRing consumed={data.totals.calories} goal={goal} />
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-muted-foreground">Eaten</div>
            <div className="font-semibold mt-0.5 tabular-nums">{data.totals.calories}</div>
          </div>
          <div className="border-x border-white/10">
            <div className="text-muted-foreground">Burned</div>
            <div className="font-semibold mt-0.5 tabular-nums text-accent">{data.burned}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Net</div>
            <div className="font-semibold mt-0.5 tabular-nums">{data.totals.calories - data.burned}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: ".1s" }}>
        <MacroBar icon={Beef} label="Protein" value={data.totals.protein} goal={profile?.protein_goal_g ?? 140} color="oklch(0.84 0.18 145)" />
        <MacroBar icon={Wheat} label="Carbs" value={data.totals.carbs} goal={profile?.carbs_goal_g ?? 250} color="oklch(0.82 0.16 80)" />
        <MacroBar icon={Droplet} label="Fat" value={data.totals.fat} goal={profile?.fat_goal_g ?? 70} color="oklch(0.74 0.22 295)" />
      </section>

      <section className="glass rounded-3xl p-5 animate-slide-up" style={{ animationDelay: ".15s" }}>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-ring shrink-0">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">AI Coach insight</h3>
              <button onClick={() => insightMut.mutate()} disabled={insightMut.isPending}
                className="text-[11px] text-primary flex items-center gap-1">
                {insightMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Refresh"}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {data.insight?.content ?? "Tap refresh to get a personalized tip based on today's meals."}
            </p>
          </div>
        </div>
      </section>

      <section className="glass rounded-3xl p-5 animate-slide-up" style={{ animationDelay: ".2s" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Weight trend</h3>
          <span className="text-[11px] text-muted-foreground">Last 30 days</span>
        </div>
        {weights.length > 1 ? (
          <div className="h-32 -mx-2 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weights}>
                <defs>
                  <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.84 0.18 145)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.84 0.18 145)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" hide />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.025 270)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="kg" stroke="oklch(0.84 0.18 145)" strokeWidth={2.5} fill="url(#wg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-3">Log your weight in Profile to see your trend.</p>
        )}
      </section>

      <section className="animate-slide-up" style={{ animationDelay: ".25s" }}>
        <div className="flex items-center justify-between px-1 mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Flame className="h-4 w-4 text-primary" /> Today's meals</h3>
          <a href="/diet" className="text-[11px] text-primary">See all</a>
        </div>
        <div className="space-y-2">
          {data.recentFoods.length === 0 && (
            <div className="glass rounded-2xl p-5 text-center text-sm text-muted-foreground">
              No meals yet. Tap <Plus className="inline h-3 w-3" /> Scan to log your first.
            </div>
          )}
          {data.recentFoods.map(f => (
            <div key={f.id} className="glass rounded-2xl p-3.5 flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-lg">🍽️</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.name}</div>
                <div className="text-[11px] text-muted-foreground capitalize">{f.meal_type}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums">{f.calories}</div>
                <div className="text-[10px] text-muted-foreground">kcal</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
