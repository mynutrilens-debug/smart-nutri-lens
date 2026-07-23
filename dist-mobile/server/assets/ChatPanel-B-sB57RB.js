import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { c as createSsrRpc, u as useServerFn } from "./router-D-2d6VGp.js";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { X, Lock, Crown, Sparkles, Trash2, Send } from "lucide-react";
import { u as useSubscription, h as hasFeature, B as Button } from "./button-Dk3VrbiD.js";
import { c as cn } from "./utils-H80jjgLf.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as createServerFn } from "./server-BadC42R4.js";
import * as SheetPrimitive from "@radix-ui/react-dialog";
const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "textarea",
      {
        className: cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";
const listChatMessages = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("f420645be31b8962619debb2aadab1f79a4cf07ebdbcd2d087ffa02a64c44de6"));
const sendChatMessage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  message: z.string().trim().min(1).max(2e3)
}).parse(d)).handler(createSsrRpc("abb0f390d0d9d5c002c238029f7d6ac7eceb5f795c2ff0103d4fb2cfd687a422"));
const clearChatHistory = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("36fcad8fa115824771d0087d522e204a1947fcb8b36e2b10465c276702b2ea3a"));
const Dialog = SheetPrimitive.Root;
const DialogPortal = SheetPrimitive.Portal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = SheetPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = SheetPrimitive.Content.displayName;
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = SheetPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = SheetPrimitive.Description.displayName;
function useUpgradeGate(feat) {
  const { data: sub } = useSubscription();
  const allowed = hasFeature(sub, feat);
  return { allowed, sub };
}
function UpgradeModal({
  open,
  onOpenChange,
  feature
}) {
  const labels = {
    diet: "Diet plans",
    workout: "Workout plans",
    scanner: "Nutri Scanner",
    ai_chat: "AI Fitness Coach"
  };
  const suggested = {
    diet: "silver",
    workout: "gold",
    scanner: "platinum",
    ai_chat: "platinum"
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "bg-zinc-950 border-emerald-500/20 text-white max-w-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
      /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center", children: /* @__PURE__ */ jsx(Lock, { className: "h-4 w-4 text-emerald-400" }) }),
      /* @__PURE__ */ jsxs(DialogTitle, { className: "text-lg", children: [
        "Unlock ",
        labels[feature]
      ] })
    ] }),
    /* @__PURE__ */ jsx(DialogDescription, { className: "text-zinc-400 text-sm", children: "Your trial has ended or this feature isn't in your current plan. Upgrade to keep going." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-700/5 border border-emerald-500/20 p-3 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Crown, { className: "h-5 w-5 text-emerald-400" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold", children: [
          "Recommended: ",
          suggested[feature]
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-[11px] text-zinc-400", children: "Tap below to view all plans" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Button, { asChild: true, className: "mt-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold", children: /* @__PURE__ */ jsx(Link, { to: "/pricing", onClick: () => onOpenChange(false), children: "View plans" }) })
  ] }) });
}
const SUGGESTIONS = [
  "I have a B12 deficiency — what foods should I eat?",
  "Suggest a high-protein breakfast for muscle gain.",
  "I'm feeling low energy in the afternoon — why?",
  "How can I hit my protein target as a vegetarian?"
];
function ChatPanel({ onClose, embedded = false }) {
  const { allowed } = useUpgradeGate("ai_chat");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [input, setInput] = useState("");
  const qc = useQueryClient();
  const listFn = useServerFn(listChatMessages);
  const sendFn = useServerFn(sendChatMessage);
  const clearFn = useServerFn(clearChatHistory);
  const scrollRef = useRef(null);
  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: () => listFn(),
    enabled: allowed
  });
  const send = useMutation({
    mutationFn: (message) => sendFn({ data: { message } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-messages"] })
  });
  const clear = useMutation({
    mutationFn: () => clearFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-messages"] })
  });
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, send.isPending]);
  const submit = () => {
    if (!allowed) {
      setShowUpgrade(true);
      return;
    }
    const t = input.trim();
    if (!t || send.isPending) return;
    setInput("");
    send.mutate(t);
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-zinc-950 text-white", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-950/80 backdrop-blur shrink-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-black" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold leading-tight", children: "NutriBot" }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] text-emerald-400/80 leading-tight", children: "Your AI nutrition coach" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        messages.length > 0 && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => clear.mutate(),
            className: "text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5",
            "aria-label": "Clear chat",
            children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
          }
        ),
        onClose && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onClose,
            className: "text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5",
            "aria-label": "Close chat",
            children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { ref: scrollRef, className: "flex-1 overflow-y-auto px-4 py-4 space-y-4", children: [
      messages.length === 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-700/5 border border-emerald-500/20 p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-emerald-400" }),
            /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm", children: "Hey there! I'm NutriBot 👋" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-zinc-300", children: "Ask me anything about your diet, workouts, deficiencies, or healthy habits. I'll personalize answers using your profile and goals." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-wide text-zinc-500", children: "Try asking" }),
          SUGGESTIONS.map((s) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setInput(s),
              className: "w-full text-left text-sm rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition",
              children: s
            },
            s
          ))
        ] })
      ] }),
      messages.map((m) => /* @__PURE__ */ jsx("div", { className: `flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`, children: /* @__PURE__ */ jsx(
        "div",
        {
          className: `max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${m.role === "user" ? "bg-emerald-500 text-black rounded-br-md" : "bg-white/[0.06] border border-white/10 text-zinc-100 rounded-bl-md"}`,
          children: m.role === "assistant" ? /* @__PURE__ */ jsx("div", { className: "prose prose-sm prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2", children: /* @__PURE__ */ jsx(ReactMarkdown, { children: m.content }) }) : /* @__PURE__ */ jsx("div", { className: "whitespace-pre-wrap", children: m.content })
        }
      ) }, m.id)),
      send.isPending && /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsx("div", { className: "bg-white/[0.06] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-400 animate-bounce" }),
        /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.15s]" }),
        /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.3s]" })
      ] }) }) }),
      send.isError && /* @__PURE__ */ jsx("div", { className: "text-xs text-red-400 text-center", children: send.error?.message ?? "Something went wrong." })
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "shrink-0 px-3 pt-2 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-zinc-950/0",
        style: { paddingBottom: embedded ? "1rem" : "calc(1rem + env(safe-area-inset-bottom))" },
        children: !allowed ? /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/pricing",
            onClick: onClose,
            className: "flex items-center justify-center gap-2 w-full rounded-full bg-emerald-500 text-black font-semibold py-3 shadow-lg",
            children: [
              /* @__PURE__ */ jsx(Lock, { className: "h-4 w-4" }),
              " Unlock NutriBot with Platinum"
            ]
          }
        ) : /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-2 rounded-3xl bg-white/[0.06] border border-white/10 p-2 backdrop-blur-xl", children: [
          /* @__PURE__ */ jsx(
            Textarea,
            {
              value: input,
              onChange: (e) => setInput(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              },
              placeholder: "Ask NutriBot anything…",
              rows: 1,
              className: "flex-1 resize-none bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-500 min-h-[40px] max-h-32"
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: submit,
              disabled: !input.trim() || send.isPending,
              size: "icon",
              className: "rounded-full h-10 w-10 bg-emerald-500 hover:bg-emerald-400 text-black shrink-0",
              children: /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" })
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsx(UpgradeModal, { open: showUpgrade, onOpenChange: setShowUpgrade, feature: "ai_chat" })
  ] });
}
export {
  ChatPanel as C
};
