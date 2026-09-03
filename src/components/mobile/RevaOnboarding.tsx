import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Send, SkipForward, RotateCcw, Pencil, Volume2, VolumeX, Loader2, Check } from "lucide-react";
import { revaTurn } from "@/lib/reva.functions";
import { VoiceOrb, type OrbState } from "@/components/mobile/VoiceOrb";

type Msg = { role: "user" | "assistant"; content: string };

const FIELD_LABELS: Record<string, string> = {
  display_name: "Name",
  gender: "Gender",
  age: "Age",
  height_cm: "Height",
  weight_kg: "Weight",
  physique_goal: "Goal",
  activity_level: "Activity",
  diet_preference: "Diet",
  region: "Region",
  cuisine: "Cuisine",
  allergies: "Allergies",
  medical_conditions: "Conditions",
  deficiencies: "Deficiencies",
  lifestyle: "Lifestyle",
  sleep_hours: "Sleep",
  water_intake_l: "Water",
};

const fmt = (k: string, v: any) => {
  if (Array.isArray(v)) return v.length ? v.join(", ") : "None";
  if (k === "height_cm") return `${v} cm`;
  if (k === "weight_kg") return `${v} kg`;
  if (k === "sleep_hours") return `${v} h`;
  if (k === "water_intake_l") return `${v} L`;
  return String(v);
};

export function RevaOnboarding({
  initialName,
  onComplete,
  onSwitchToForm,
}: {
  initialName?: string;
  onComplete: (collected: Record<string, any>) => void;
  onSwitchToForm: () => void;
}) {
  const turn = useServerFn(revaTurn);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [collected, setCollected] = useState<Record<string, any>>(
    initialName ? { display_name: initialName } : {},
  );
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);
  const [input, setInput] = useState("");
  const [interim, setInterim] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const audioRef = useRef<{ ctx: AudioContext; stream: MediaStream; raf: number } | null>(null);
  const startedRef = useRef(false);
  const collectedRef = useRef(collected);
  collectedRef.current = collected;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const orbState: OrbState = speaking ? "speaking" : thinking ? "thinking" : listening ? "listening" : "idle";

  const supportsSpeech =
    typeof window !== "undefined" &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  /* ── Text-to-speech ─────────────────────────────────────── */
  const speak = useCallback(
    (text: string) => {
      if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ""));
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find((v) => /female|samantha|zira|aria|jenny|google uk english female/i.test(v.name)) ||
          voices.find((v) => v.lang?.startsWith("en"));
        if (preferred) u.voice = preferred;
        u.rate = 1.02;
        u.pitch = 1.05;
        u.onstart = () => setSpeaking(true);
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(u);
      } catch {
        setSpeaking(false);
      }
    },
    [muted],
  );

  // Synthetic amplitude envelope while Reva is speaking.
  useEffect(() => {
    if (!speaking) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      const v = 0.32 + 0.28 * Math.abs(Math.sin(t * 7.3)) + 0.16 * Math.abs(Math.sin(t * 3.1));
      setLevel(Math.min(1, v));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setLevel(0);
    };
  }, [speaking]);

  /* ── Mic amplitude meter ────────────────────────────────── */
  const startMeter = useCallback(async () => {
    if (audioRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const d = (buf[i] - 128) / 128;
          sum += d * d;
        }
        const rms = Math.sqrt(sum / buf.length);
        setLevel(Math.min(1, rms * 4.5));
        audioRef.current!.raf = requestAnimationFrame(loop);
      };
      audioRef.current = { ctx, stream, raf: 0 };
      audioRef.current.raf = requestAnimationFrame(loop);
    } catch {
      setMicError("Mic access blocked — you can still type your answers.");
    }
  }, []);

  const stopMeter = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    cancelAnimationFrame(a.raf);
    a.stream.getTracks().forEach((t) => t.stop());
    a.ctx.close().catch(() => {});
    audioRef.current = null;
    setLevel(0);
  }, []);

  /* ── Server round trip ──────────────────────────────────── */
  const send = useCallback(
    async (text: string, action?: string) => {
      if (thinking) return;
      const history = [...messagesRef.current];
      if (text) history.push({ role: "user", content: text });
      setMessages(history);
      setThinking(true);
      setInterim("");
      try {
        const res: any = await turn({
          data: { history, collected: collectedRef.current, action: action ?? text ?? "" },
        });
        setCollected(res.collected ?? collectedRef.current);
        setMessages([...history, { role: "assistant", content: res.reply }]);
        speak(res.reply);
        if (res.done) {
          setDone(true);
          setTimeout(() => onComplete(res.collected), 1400);
        }
      } catch (e: any) {
        setMessages([
          ...history,
          { role: "assistant", content: e?.message ?? "I lost my train of thought — say that once more?" },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [turn, speak, thinking, onComplete],
  );

  /* ── Speech recognition ─────────────────────────────────── */
  const stopListening = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch { /* noop */ }
    recRef.current = null;
    setListening(false);
    stopMeter();
  }, [stopMeter]);

  const startListening = useCallback(async () => {
    if (!supportsSpeech) {
      setMicError("Voice input isn't supported in this browser — type your answer below.");
      return;
    }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeaking(false);
    setMicError(null);
    await startMeter();

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";

    rec.onresult = (e: any) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else live += r[0].transcript;
      }
      setInterim(live);
    };
    rec.onerror = () => setMicError("Didn't catch that — try again or type it.");
    rec.onend = () => {
      setListening(false);
      stopMeter();
      recRef.current = null;
      const t = finalText.trim();
      if (t) send(t);
    };

    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }, [supportsSpeech, startMeter, stopMeter, send]);

  /* ── Kick off the conversation ──────────────────────────── */
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    send("", "start");
    return () => {
      stopListening();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  const answered = useMemo(
    () => Object.entries(collected).filter(([, v]) => v !== undefined && v !== null && v !== ""),
    [collected],
  );
  const progress = Math.min(100, Math.round((answered.length / 16) * 100));

  const lastReva = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* header */}
      <div className="px-5 pt-8 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[oklch(0.82_0.16_215)]">Meet Reva</div>
            <h1 className="text-xl font-bold">Your AI coach</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMuted((m) => !m);
                if (typeof window !== "undefined") window.speechSynthesis?.cancel();
                setSpeaking(false);
              }}
              aria-label={muted ? "Unmute Reva" : "Mute Reva"}
              className="glass rounded-full p-2.5"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button onClick={onSwitchToForm} className="glass rounded-full px-3 py-2 text-xs">
              Use form
            </button>
          </div>
        </div>
        <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "var(--gradient-hero)" }}
          />
        </div>
      </div>

      {/* orb */}
      <div className="shrink-0 pt-3 pb-1">
        <VoiceOrb level={level} state={orbState} size={180} onClick={listening ? stopListening : startListening} />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {done
            ? "All set — building your plan…"
            : thinking
              ? "Reva is thinking…"
              : listening
                ? interim || "Listening…"
                : speaking
                  ? "Reva is speaking…"
                  : "Tap the orb and speak, or type below"}
        </p>
      </div>

      {/* transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[oklch(0.72_0.22_240)] text-primary-foreground rounded-br-md"
                  : "glass rounded-bl-md"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.82_0.16_215)] animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-[oklch(0.82_0.16_215)] animate-bounce [animation-delay:0.15s]" />
              <span className="h-2 w-2 rounded-full bg-[oklch(0.82_0.16_215)] animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
        )}
        {micError && <p className="text-xs text-amber-400 text-center">{micError}</p>}

        {/* collected chips — tap to edit */}
        {answered.length > 0 && (
          <div className="pt-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">What Reva knows</div>
            <div className="flex flex-wrap gap-1.5">
              {answered.map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => send(`Let's change my ${FIELD_LABELS[k] ?? k}.`, `edit:${k}`)}
                  className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px]"
                >
                  <Check className="h-3 w-3 text-[oklch(0.78_0.20_155)]" />
                  <span className="text-muted-foreground">{FIELD_LABELS[k] ?? k}:</span>
                  <span className="font-medium">{fmt(k, v)}</span>
                  <Pencil className="h-2.5 w-2.5 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* controls */}
      <div
        className="shrink-0 px-4 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <ControlBtn icon={SkipForward} label="Skip" onClick={() => send("Let's skip this one.", "skip")} disabled={thinking || done} />
          <ControlBtn icon={RotateCcw} label="Repeat" onClick={() => (lastReva ? speak(lastReva) : send("Can you repeat that?", "repeat"))} disabled={thinking || done} />
          <ControlBtn
            icon={listening ? MicOff : Mic}
            label={listening ? "Stop" : "Talk"}
            onClick={listening ? stopListening : startListening}
            disabled={thinking || done}
            primary
          />
        </div>

        <div className="flex items-end gap-2 rounded-3xl glass p-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                const t = input.trim();
                setInput("");
                send(t);
              }
            }}
            placeholder="Or type your answer…"
            disabled={done}
            className="flex-1 bg-transparent outline-none px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
          <button
            onClick={() => {
              const t = input.trim();
              if (!t) return;
              setInput("");
              send(t);
            }}
            disabled={!input.trim() || thinking || done}
            aria-label="Send answer"
            className="h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground disabled:opacity-50"
            style={{ background: "var(--gradient-hero)" }}
          >
            {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ControlBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
  primary,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition active:scale-95 disabled:opacity-40 ${
        primary ? "text-primary-foreground glow-ring" : "glass"
      }`}
      style={primary ? { background: "var(--gradient-hero)" } : undefined}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
