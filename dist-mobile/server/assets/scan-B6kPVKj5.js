import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Camera, Upload, Sparkles, Pencil, Wand2, X, Check, Image } from "lucide-react";
import { a as analyzeFood } from "./scan.functions-Dup3n4S4.js";
import { l as listFoods, a as logFood } from "./food.functions-C13l6RKQ.js";
import { h as hapticTap, p as pickNativeFoodImage } from "./router-D-2d6VGp.js";
import { toast } from "sonner";
import "zod";
import "./auth-middleware-B4NMxYBh.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "./server-BadC42R4.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "./client-BMbiJotd.js";
import "@capacitor/core";
const examples = [{
  emoji: "🍕",
  name: "Pizza"
}, {
  emoji: "🥗",
  name: "Salad"
}, {
  emoji: "🍔",
  name: "Burger"
}, {
  emoji: "🍣",
  name: "Sushi"
}, {
  emoji: "🥑",
  name: "Bowl"
}, {
  emoji: "🍝",
  name: "Pasta"
}];
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result;
      const b64 = result.split(",")[1];
      res({
        b64,
        preview: result,
        mime: file.type || "image/jpeg"
      });
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function Scan() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const camRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [edit, setEdit] = useState(null);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (analysis) setEdit({
      name: analysis.name,
      calories: analysis.calories,
      protein_g: analysis.protein_g,
      carbs_g: analysis.carbs_g,
      fat_g: analysis.fat_g
    });
  }, [analysis]);
  const recent = useQuery({
    queryKey: ["foods"],
    queryFn: () => listFoods()
  });
  const analyzeMut = useMutation({
    mutationFn: (p) => analyzeFood({
      data: p
    }),
    onSuccess: (r) => setAnalysis(r),
    onError: (e) => toast.error(e.message ?? "Analysis failed")
  });
  const logMut = useMutation({
    mutationFn: (input) => logFood({
      data: input
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["dashboard"]
      });
      qc.invalidateQueries({
        queryKey: ["foods"]
      });
      toast.success("Logged!");
      setPreview(null);
      setAnalysis(null);
      navigate({
        to: "/diet"
      });
    },
    onError: (e) => toast.error(e.message ?? "Failed")
  });
  async function onPick(file) {
    if (!file) return;
    const {
      b64,
      preview: preview2,
      mime
    } = await fileToBase64(file);
    setPreview(preview2);
    setAnalysis(null);
    analyzeMut.mutate({
      image_base64: b64,
      mime_type: mime
    });
  }
  async function pickImage(source) {
    await hapticTap();
    try {
      const nativeImage = await pickNativeFoodImage(source);
      if (nativeImage) {
        setPreview(nativeImage.preview);
        setAnalysis(null);
        analyzeMut.mutate({
          image_base64: nativeImage.b64,
          mime_type: nativeImage.mime
        });
        return;
      }
      (source === "camera" ? camRef : fileRef).current?.click();
    } catch (e) {
      if (e?.message && !/cancel/i.test(e.message)) toast.error(e.message);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "px-5 pt-12 pb-8 space-y-5", children: [
    /* @__PURE__ */ jsxs("header", { className: "animate-slide-up", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "AI Vision" }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Scan your meal" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Point your camera at any food — Gemini will estimate the macros." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative aspect-square rounded-[32px] glass overflow-hidden animate-slide-up", style: {
      animationDelay: ".05s"
    }, children: [
      preview ? /* @__PURE__ */ jsx("img", { src: preview, alt: "preview", className: "absolute inset-0 h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" }),
      ["top-4 left-4 border-l-2 border-t-2", "top-4 right-4 border-r-2 border-t-2", "bottom-4 left-4 border-l-2 border-b-2", "bottom-4 right-4 border-r-2 border-b-2"].map((c) => /* @__PURE__ */ jsx("div", { className: `absolute h-10 w-10 rounded-[12px] border-primary ${c}`, style: {
        boxShadow: "0 0 18px oklch(0.84 0.18 145 / 50%)"
      } }, c)),
      (analyzeMut.isPending || !preview) && /* @__PURE__ */ jsx("div", { className: "absolute inset-x-8 top-0 bottom-0 overflow-hidden pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-sweep", style: {
        boxShadow: "0 0 18px oklch(0.84 0.18 145)"
      } }) }),
      analyzeMut.isPending && /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-background/40 backdrop-blur-sm flex flex-col items-center justify-center", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm font-medium", children: "Analyzing your food…" })
      ] }),
      !preview && !analyzeMut.isPending && /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-center px-8", children: [
        /* @__PURE__ */ jsx("div", { className: "h-16 w-16 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-ring animate-float", children: /* @__PURE__ */ jsx(Camera, { className: "h-7 w-7 text-primary-foreground" }) }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: "Center the food in the frame" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("input", { ref: camRef, type: "file", accept: "image/*", capture: "environment", className: "hidden", onChange: (e) => onPick(e.target.files?.[0]) }),
    /* @__PURE__ */ jsx("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: (e) => onPick(e.target.files?.[0]) }),
    !analysis && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 animate-slide-up", style: {
      animationDelay: ".1s"
    }, children: [
      /* @__PURE__ */ jsxs("button", { onClick: () => pickImage("camera"), className: "py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-ring active:scale-[.98]", children: [
        /* @__PURE__ */ jsx(Camera, { className: "h-5 w-5" }),
        " Camera"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => pickImage("photos"), className: "py-4 rounded-2xl glass font-semibold flex items-center justify-center gap-2 active:scale-[.98]", children: [
        /* @__PURE__ */ jsx(Upload, { className: "h-5 w-5" }),
        " Upload"
      ] })
    ] }),
    analysis && edit && /* @__PURE__ */ jsxs("div", { className: "glass rounded-3xl p-5 animate-slide-up space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-primary" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: "AI detected" }),
        /* @__PURE__ */ jsxs("span", { className: "ml-auto text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary", children: [
          Math.round(analysis.confidence * 100),
          "% sure"
        ] })
      ] }),
      editing ? /* @__PURE__ */ jsx("input", { autoFocus: true, value: edit.name, onChange: (e) => setEdit({
        ...edit,
        name: e.target.value
      }), onBlur: () => setEditing(false), onKeyDown: (e) => e.key === "Enter" && setEditing(false), className: "w-full text-xl font-bold bg-white/5 rounded-xl px-3 py-2 border border-primary/40 outline-none" }) : /* @__PURE__ */ jsxs("button", { onClick: () => setEditing(true), className: "flex items-center gap-2 group", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-left", children: edit.name }),
        /* @__PURE__ */ jsx(Pencil, { className: "h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" })
      ] }),
      analysis.notes && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground -mt-2", children: analysis.notes }),
      analysis.alternatives?.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [
          /* @__PURE__ */ jsx(Wand2, { className: "h-3.5 w-3.5 text-primary" }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] uppercase tracking-wider text-muted-foreground", children: "Not this? Tap a match" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-2 overflow-x-auto -mx-1 px-1 pb-1", children: analysis.alternatives.map((a) => {
          const active = a.name.toLowerCase() === edit.name.toLowerCase();
          return /* @__PURE__ */ jsxs("button", { onClick: () => setEdit({
            name: a.name,
            calories: a.calories,
            protein_g: a.protein_g,
            carbs_g: a.carbs_g,
            fat_g: a.fat_g
          }), className: `shrink-0 rounded-2xl px-3 py-2 text-left border transition ${active ? "bg-primary/15 border-primary/60" : "bg-white/5 border-white/10 hover:border-primary/40"}`, children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold", children: a.name }),
            /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground mt-0.5", children: [
              a.calories,
              " kcal · ",
              Math.round(a.protein_g),
              "P"
            ] })
          ] }, a.name);
        }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: [{
        k: "calories",
        l: "kcal",
        c: "oklch(0.84 0.18 145)"
      }, {
        k: "protein_g",
        l: "P (g)",
        c: "oklch(0.74 0.22 295)"
      }, {
        k: "carbs_g",
        l: "C (g)",
        c: "oklch(0.82 0.16 80)"
      }, {
        k: "fat_g",
        l: "F (g)",
        c: "oklch(0.7 0.2 25)"
      }].map((m) => /* @__PURE__ */ jsxs("div", { className: "bg-white/5 rounded-2xl p-2 text-center border border-white/5", children: [
        /* @__PURE__ */ jsx("input", { type: "number", inputMode: "decimal", value: Math.round(edit[m.k] * 10) / 10, onChange: (e) => setEdit({
          ...edit,
          [m.k]: Math.max(0, Number(e.target.value) || 0)
        }), className: "w-full bg-transparent text-sm font-bold tabular-nums text-center outline-none focus:ring-1 focus:ring-primary/40 rounded", style: {
          color: m.c
        } }),
        /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground mt-0.5", children: m.l })
      ] }, m.k)) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: () => {
          setAnalysis(null);
          setPreview(null);
          setEdit(null);
        }, className: "py-3 rounded-2xl glass font-medium flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          " Discard"
        ] }),
        /* @__PURE__ */ jsxs("button", { disabled: logMut.isPending, onClick: () => logMut.mutate({
          name: edit.name,
          meal_type: analysis.meal_type,
          calories: Math.round(edit.calories),
          protein_g: edit.protein_g,
          carbs_g: edit.carbs_g,
          fat_g: edit.fat_g,
          image_url: preview
        }), className: "py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-ring", children: [
          logMut.isPending ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
          " Log it"
        ] })
      ] })
    ] }),
    !analysis && !analyzeMut.isPending && /* @__PURE__ */ jsxs("section", { className: "animate-slide-up", style: {
      animationDelay: ".15s"
    }, children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold px-1 mb-2", children: "Try with" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: examples.map((e) => /* @__PURE__ */ jsxs("div", { className: "glass rounded-2xl p-3 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl", children: e.emoji }),
        /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground mt-1", children: e.name })
      ] }, e.name)) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "animate-slide-up", style: {
      animationDelay: ".2s"
    }, children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold px-1 mb-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Image, { className: "h-4 w-4 text-primary" }),
        " Recent scans"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 overflow-x-auto pb-2 -mx-5 px-5", children: [
        (recent.data ?? []).slice(0, 8).map((f) => /* @__PURE__ */ jsxs("div", { className: "shrink-0 w-32 glass rounded-2xl p-2.5", children: [
          /* @__PURE__ */ jsx("div", { className: "h-20 w-full rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl overflow-hidden", children: f.image_url ? /* @__PURE__ */ jsx("img", { src: f.image_url, alt: "", className: "h-full w-full object-cover" }) : "🍽️" }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 text-xs font-medium truncate", children: f.name }),
          /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
            f.calories,
            " kcal"
          ] })
        ] }, f.id)),
        !recent.data?.length && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: "No scans yet" })
      ] })
    ] })
  ] });
}
export {
  Scan as component
};
