import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SquadDetailPanel } from "@/components/mobile/SquadDetailPanel";

export const Route = createFileRoute("/_app/squads/$squadId")({
  component: SquadDetail,
});

function SquadDetail() {
  const { squadId } = Route.useParams();
  return (
    <div className="px-5 pt-12 pb-28 space-y-5 relative">
      <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <header className="flex items-center gap-3 animate-slide-up">
        <Link to="/squads" className="h-9 w-9 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Squad</p>
          <h1 className="text-2xl font-bold tracking-tight">Details</h1>
        </div>
      </header>
      <SquadDetailPanel squadId={squadId} />
    </div>
  );
}
