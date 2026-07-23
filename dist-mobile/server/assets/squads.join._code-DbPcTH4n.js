import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { b as Route, u as useServerFn } from "./router-D-2d6VGp.js";
import { j as joinSquadByCode } from "./squad.functions-BwqOTUym.js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import "./client-BMbiJotd.js";
import "@supabase/supabase-js";
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
function JoinPage() {
  const {
    code
  } = Route.useParams();
  const navigate = useNavigate();
  const joinFn = useServerFn(joinSquadByCode);
  const ran = useRef(false);
  const mut = useMutation({
    mutationFn: () => joinFn({
      data: {
        code
      }
    }),
    onSuccess: (r) => {
      toast.success("Joined squad!");
      navigate({
        to: "/squads/$squadId",
        params: {
          squadId: r.squad_id
        },
        replace: true
      });
    },
    onError: (e) => {
      toast.error(e.message ?? "Invalid code");
      navigate({
        to: "/squads",
        replace: true
      });
    }
  });
  useEffect(() => {
    if (!ran.current) {
      ran.current = true;
      mut.mutate();
    }
  }, [mut]);
  return /* @__PURE__ */ jsxs("div", { className: "app-shell flex flex-col items-center justify-center pt-32 gap-3", children: [
    /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-emerald-300" }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
      "Joining squad ",
      /* @__PURE__ */ jsx("span", { className: "font-mono text-emerald-200", children: code }),
      "…"
    ] })
  ] });
}
export {
  JoinPage as component
};
