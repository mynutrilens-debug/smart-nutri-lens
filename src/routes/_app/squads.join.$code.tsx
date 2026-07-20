import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { joinSquadByCode } from "@/lib/squad.functions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/squads/join/$code")({
  component: JoinPage,
});

function JoinPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const joinFn = useServerFn(joinSquadByCode);
  const ran = useRef(false);

  const mut = useMutation({
    mutationFn: () => joinFn({ data: { code } }),
    onSuccess: (r: any) => {
      toast.success("Joined squad!");
      navigate({ to: "/squads/$squadId", params: { squadId: r.squad_id }, replace: true });
    },
    onError: (e: any) => {
      toast.error(e.message ?? "Invalid code");
      navigate({ to: "/squads", replace: true });
    },
  });

  useEffect(() => { if (!ran.current) { ran.current = true; mut.mutate(); } }, [mut]);

  return (
    <div className="app-shell flex flex-col items-center justify-center pt-32 gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
      <p className="text-sm text-muted-foreground">Joining squad <span className="font-mono text-emerald-200">{code}</span>…</p>
    </div>
  );
}
