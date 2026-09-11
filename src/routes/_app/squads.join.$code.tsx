import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { joinSquadByCode, normalizeSquadCode } from "@/lib/squad.functions";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/squads/join/$code")({
  component: JoinPage,
  head: () => ({
    meta: [
      { title: "Join a Squad · MyNutriLens" },
      { name: "description", content: "Accept a MyNutriLens squad invite and start competing with your friends." },
      { property: "og:title", content: "Join a Squad · MyNutriLens" },
      { property: "og:description", content: "Accept a MyNutriLens squad invite and start competing with your friends." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function JoinPage() {
  const { code: rawCode } = Route.useParams();
  const code = normalizeSquadCode(rawCode);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const joinFn = useServerFn(joinSquadByCode);
  const ran = useRef(false);

  const mut = useMutation({
    mutationFn: () => joinFn({ data: { code } }),
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ["squads"] });
      toast.success(r?.already_member ? "You're already in this squad" : "Joined squad!");
      navigate({ to: "/squads/$squadId", params: { squadId: r.squad_id }, replace: true });
    },
    onError: (e: any) => toast.error(e?.message ?? "Invalid code"),
  });

  useEffect(() => {
    if (ran.current || code.length < 4) return;
    ran.current = true;
    mut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const failed = mut.isError || code.length < 4;

  return (
    <div className="app-shell flex flex-col items-center justify-center pt-32 gap-3 px-6 text-center">
      {!failed ? (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
          <p className="text-sm text-muted-foreground">
            Joining squad <span className="font-mono text-emerald-200">{code}</span>…
          </p>
        </>
      ) : (
        <>
          <AlertCircle className="h-6 w-6 text-amber-300" />
          <p className="text-sm font-semibold">Couldn't join this squad</p>
          <p className="text-[11px] text-muted-foreground">
            {code.length < 4 ? "That invite link looks incomplete." : (mut.error as any)?.message ?? "Invalid code"}
          </p>
          <div className="flex gap-2 pt-2">
            {code.length >= 4 && (
              <button
                onClick={() => mut.mutate()}
                disabled={mut.isPending}
                className="rounded-2xl px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 text-black disabled:opacity-50"
              >
                {mut.isPending ? "Retrying…" : "Try again"}
              </button>
            )}
            <Link
              to="/squads"
              className="rounded-2xl px-4 py-2.5 text-sm border border-white/[0.08] bg-white/[0.03]"
            >
              Enter code manually
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
