import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardQuery } from "@/lib/queries";
import { logWeight, updateProfile } from "@/lib/weight.functions";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Target, Scale, Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  component: Profile,
});

function Profile() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(dashboardQuery);
  const p = data.profile;
  const [name, setName] = useState(p?.display_name ?? "");
  const [cal, setCal] = useState(p?.daily_calorie_goal ?? 2200);
  const [protein, setProtein] = useState(p?.protein_goal_g ?? 140);
  const [carbs, setCarbs] = useState(p?.carbs_goal_g ?? 250);
  const [fat, setFat] = useState(p?.fat_goal_g ?? 70);
  const [weight, setWeight] = useState<string>(p?.weight_kg ? String(p.weight_kg) : "");

  const save = useMutation({
    mutationFn: () => updateProfile({ data: { display_name: name, daily_calorie_goal: cal, protein_goal_g: protein, carbs_goal_g: carbs, fat_goal_g: fat } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Saved"); },
  });
  const wlog = useMutation({
    mutationFn: () => logWeight({ data: { weight_kg: Number(weight) } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Weight logged"); },
    onError: (e: any) => toast.error(e.message),
  });

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="px-5 pt-12 pb-8 space-y-5">
      <header className="animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground glow-ring">
            {(p?.display_name ?? "U")[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{p?.display_name ?? "You"}</h1>
            <p className="text-xs text-muted-foreground">{p?.streak_count ?? 0} day streak · {p?.weight_kg ?? "—"} kg</p>
          </div>
        </div>
      </header>

      <section className="glass rounded-3xl p-5 space-y-3 animate-slide-up" style={{ animationDelay: ".05s" }}>
        <div className="flex items-center gap-2 text-sm font-semibold"><Scale className="h-4 w-4 text-primary" /> Log weight</div>
        <div className="flex gap-2">
          <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="kg"
            className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-primary/60" />
          <button onClick={() => wlog.mutate()} disabled={!weight || wlog.isPending}
            className="px-5 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold glow-ring flex items-center gap-2">
            {wlog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log"}
          </button>
        </div>
      </section>

      <section className="glass rounded-3xl p-5 space-y-4 animate-slide-up" style={{ animationDelay: ".1s" }}>
        <div className="flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-primary" /> Daily goals</div>
        <label className="block">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><User className="h-3 w-3" /> Display name</div>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-primary/60" />
        </label>
        {[
          { l: "Calories", v: cal, s: setCal, min: 800, max: 5000, unit: "kcal" },
          { l: "Protein", v: protein, s: setProtein, min: 30, max: 400, unit: "g" },
          { l: "Carbs", v: carbs, s: setCarbs, min: 30, max: 800, unit: "g" },
          { l: "Fat", v: fat, s: setFat, min: 20, max: 300, unit: "g" },
        ].map(g => (
          <div key={g.l}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">{g.l}</span>
              <span className="font-semibold tabular-nums">{g.v} {g.unit}</span>
            </div>
            <input type="range" min={g.min} max={g.max} value={g.v} onChange={e => g.s(+e.target.value)} className="w-full accent-primary" />
          </div>
        ))}
        <button disabled={save.isPending} onClick={() => save.mutate()}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold glow-ring flex items-center justify-center gap-2">
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save goals
        </button>
      </section>

      <button onClick={logout} className="w-full glass rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-medium text-destructive">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}
