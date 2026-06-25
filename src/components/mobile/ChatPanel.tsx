import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, Trash2, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { listChatMessages, sendChatMessage, clearChatHistory } from "@/lib/chat.functions";
import { useUpgradeGate, UpgradeModal } from "@/components/mobile/UpgradeGate";

const SUGGESTIONS = [
  "I have a B12 deficiency — what foods should I eat?",
  "Suggest a high-protein breakfast for muscle gain.",
  "I'm feeling low energy in the afternoon — why?",
  "How can I hit my protein target as a vegetarian?",
];

export function ChatPanel({ onClose, embedded = false }: { onClose?: () => void; embedded?: boolean }) {
  const { allowed } = useUpgradeGate("ai_chat");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [input, setInput] = useState("");
  const qc = useQueryClient();
  const listFn = useServerFn(listChatMessages);
  const sendFn = useServerFn(sendChatMessage);
  const clearFn = useServerFn(clearChatHistory);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: () => listFn(),
    enabled: allowed,
  });

  const send = useMutation({
    mutationFn: (message: string) => sendFn({ data: { message } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-messages"] }),
  });

  const clear = useMutation({
    mutationFn: () => clearFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-messages"] }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, send.isPending]);

  const submit = () => {
    if (!allowed) { setShowUpgrade(true); return; }
    const t = input.trim();
    if (!t || send.isPending) return;
    setInput("");
    send.mutate(t);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-950/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <div>
            <div className="font-semibold leading-tight">NutriBot</div>
            <div className="text-[10px] text-emerald-400/80 leading-tight">Your AI nutrition coach</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => clear.mutate()}
              className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5"
              aria-label="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/5"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-700/5 border border-emerald-500/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <div className="font-semibold text-sm">Hey there! I'm NutriBot 👋</div>
              </div>
              <p className="text-sm text-zinc-300">
                Ask me anything about your diet, workouts, deficiencies, or healthy habits. I'll personalize answers using your profile and goals.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-zinc-500">Try asking</div>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="w-full text-left text-sm rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "bg-emerald-500 text-black rounded-br-md"
                  : "bg-white/[0.06] border border-white/10 text-zinc-100 rounded-bl-md"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
          </div>
        ))}

        {send.isPending && (
          <div className="flex justify-start">
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.15s]" />
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}

        {send.isError && (
          <div className="text-xs text-red-400 text-center">
            {(send.error as Error)?.message ?? "Something went wrong."}
          </div>
        )}
      </div>

      <div
        className="shrink-0 px-3 pt-2 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-zinc-950/0"
        style={{ paddingBottom: embedded ? "1rem" : "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        {!allowed ? (
          <Link
            to="/pricing"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full rounded-full bg-emerald-500 text-black font-semibold py-3 shadow-lg"
          >
            <Lock className="h-4 w-4" /> Unlock NutriBot with Platinum
          </Link>
        ) : (
          <div className="flex items-end gap-2 rounded-3xl bg-white/[0.06] border border-white/10 p-2 backdrop-blur-xl">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
              }}
              placeholder="Ask NutriBot anything…"
              rows={1}
              className="flex-1 resize-none bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-500 min-h-[40px] max-h-32"
            />
            <Button
              onClick={submit}
              disabled={!input.trim() || send.isPending}
              size="icon"
              className="rounded-full h-10 w-10 bg-emerald-500 hover:bg-emerald-400 text-black shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} feature="ai_chat" />
    </div>
  );
}
