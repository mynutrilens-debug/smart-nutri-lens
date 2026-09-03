import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Send, SkipForward, RotateCcw, Pencil, Volume2, VolumeX, Loader2, Check, ChevronUp, ChevronDown } from "lucide-react";
import { revaTurn } from "@/lib/reva.functions";
import { VoiceWave, type WaveState } from "@/components/mobile/VoiceWave";

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

/** Tappable option sets — the user can select, type, or say any of these. */
const OPTIONS: Record<string, { multi?: boolean; items: { label: string; say: string }[] }> = {
  gender: { items: [{ label: "Male", say: "I'm male" }, { label: "Female", say: "I'm female" }] },
  physique_goal: {
    items: [
      { label: "🔥 Weight Loss", say: "My goal is weight loss" },
      { label: "💧 Fat Loss", say: "My goal is fat loss" },
      { label: "💪 Muscle Gain", say: "My goal is muscle gain" },
      { label: "⚡ Recomposition", say: "My goal is body recomposition" },
      { label: "🌿 Maintenance", say: "My goal is maintenance" },
    ],
  },
  activity_level: {
    items: [
      { label: "Sedentary", say: "I'm sedentary, little to no exercise" },
      { label: "Light · 1–2 days", say: "Light activity, 1 to 2 days a week" },
      { label: "Moderate · 3–5 days", say: "Moderate activity, 3 to 5 days a week" },
      { label: "Active · 6–7 days", say: "Active, 6 to 7 days a week" },
      { label: "Athlete", say: "Athlete, I train twice daily" },
    ],
  },
  diet_preference: {
    items: ["Vegetarian", "Eggetarian", "Non-Veg (No Beef)", "Non-Veg", "Vegan", "High-Protein", "Keto", "Low-Carb", "Diabetic-Friendly", "Gluten-Free", "Pescatarian", "Jain"].map(
      (d) => ({ label: d, say: `My diet preference is ${d}` }),
    ),
  },
  region: {
    items: ["India", "Global", "Middle East", "East Asia", "Europe", "Americas"].map((r) => ({
      label: r,
      say: `I'm in ${r}`,
    })),
  },
  cuisine: {
    items: ["Maharashtrian", "Kerala", "Tamil", "Rajasthani", "Punjabi", "Bengali", "Gujarati", "South Indian", "North Indian", "Hyderabadi", "Goan"].map((c) => ({
      label: c,
      say: `I prefer ${c} cuisine`,
    })),
  },
  lifestyle: {
    items: ["Desk-job", "Field-work", "Student", "Home-maker", "Shift-work", "Traveller"].map((l) => ({
      label: l,
      say: `My lifestyle is ${l}`,
    })),
  },
  allergies: {
    multi: true,
    items: ["Peanuts", "Tree nuts", "Dairy", "Eggs", "Gluten", "Soy", "Shellfish", "Fish", "None"].map((a) => ({ label: a, say: a })),
  },
  medical_conditions: {
    multi: true,
    items: ["Diabetes", "Hypertension", "PCOS", "Thyroid", "Cholesterol", "Asthma", "None"].map((m) => ({ label: m, say: m })),
  },
  deficiencies: {
    multi: true,
    items: ["Vitamin B12", "Vitamin D3", "Iron", "Calcium", "Magnesium", "Zinc", "Omega-3", "Vitamin C", "Folate", "None"].map((d) => ({ label: d, say: d })),
  },
  sleep_hours: {
    items: ["5 h", "6 h", "7 h", "8 h", "9 h"].map((s) => ({ label: s, say: `I sleep about ${parseInt(s)} hours` })),
  },
  water_intake_l: {
    items: ["1 L", "1.5 L", "2 L", "2.5 L", "3 L", "4 L"].map((w) => ({
      label: w,
      say: `I drink about ${parseFloat(w)} litres of water a day`,
    })),
  },
};

const MULTI_PREFIX: Record<string, string> = {
  allergies: "My allergies are",
  medical_conditions: "My conditions are",
  deficiencies: "My deficiencies are",
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
  const [nextField, setNextField] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);
  const [input, setInput] = useState("");
  const [interim, setInterim] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [multiSel, setMultiSel] = useState<string[]>([]);
  const [showKnown, setShowKnown] = useState(false);

  const recRef = useRef<any>(null);
  const audioRef = useRef<{ ctx: AudioContext; stream: MediaStream; raf: number } | null>(null);
  const startedRef = useRef(false);
  const collectedRef = useRef(collected);
  collectedRef.current = collected;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const waveState: WaveState = speaking ? "speaking" : thinking ? "thinking" : listening ? "listening" : "idle";

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
    if (!speaking && !thinking) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      const v = thinking && !speaking
        ? 0.12 + 0.08 * Math.abs(Math.sin(t * 2.2))
        : 0.32 + 0.28 * Math.abs(Math.sin(t * 7.3)) + 0.16 * Math.abs(Math.sin(t * 3.1));
      setLevel(Math.min(1, v));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setLevel(0);
    };
  }, [speaking, thinking]);

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
      setMicError("Mic access blocked — you can still tap an option or type.");
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
      setMultiSel([]);
      try {
        const res: any = await turn({
          data: { history, collected: collectedRef.current, action: action ?? text ?? "" },
        });
        setCollected(res.collected ?? collectedRef.current);
        setNextField(res.next_field ?? null);
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
      setMicError("Voice input isn't supported here — tap an option or type your answer.");
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
    rec.onerror = () => setMicError("Didn't catch that — try again, tap an option, or type it.");
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

  const answered = useMemo(
    () => Object.entries(collected).filter(([, v]) => v !== undefined && v !== null && v !== ""),
    [collected],
  );
  const progress = Math.min(100, Math.round((answered.length / 16) * 100));

  const lastReva = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const opts = !done && nextField ? OPTIONS[nextField] : undefined;

  const submitMulti = () => {
    if (!nextField) return;
    const picked = multiSel.length ? multiSel : ["None"];
    const isNone = picked.length === 1 && picked[0] === "None";
    send(isNone ? `No ${FIELD_LABELS[nextField]?.toLowerCase() ?? "issues"} — none.` : `${MULTI_PREFIX[nextField] ?? "My answer is"} ${picked.join(", ")}.`);
  };

  return (
    <div className="relative flex flex-col h-[100dvh] overflow-hidden bg-[oklch(0.06_0.01_180)]">
      {/* cinematic backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(900px 520px at 50% 46%, oklch(0.55 0.13 190 / 16%), transparent 65%), radial-gradient(600px 400px at 50% 100%, oklch(0.62 0.16 160 / 10%), transparent 70%)",
        }}
      />

      {/* header */}
      <div className="relative px-5 pt-7 shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.35em] text-[oklch(0.82_0.12_190)]">Reva</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMuted((m) => !m);
                if (typeof window !== "undefined") window.speechSynthesis?.cancel();
                setSpeaking(false);
              }}
              aria-label={muted ? "Unmute Reva" : "Mute Reva"}
              className="rounded-full border border-white/10 bg-white/5 p-2"
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={onSwitchToForm}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-muted-foreground"
            >
              Use form
            </button>
          </div>
        </div>
        <div className="mt-4 h-[2px] rounded-full bg-white/[0.07] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, oklch(0.78 0.16 190), oklch(0.85 0.18 150))" }}
          />
        </div>
      </div>

      {/* stage — question + audio-reactive wave */}
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center px-7">
        <p
          key={lastReva}
          className="text-center text-[22px] leading-[1.35] font-light tracking-tight animate-fade-in max-w-[22rem]"
        >
          {done ? "Perfect. Building your plan…" : lastReva || "…"}
        </p>

        <VoiceWave level={level} state={waveState} height={200} className="mt-2" />

        <p className="min-h-5 text-center text-[11px] tracking-wide text-muted-foreground animate-fade-in">
          {done
            ? "Personalising calories, macros & meals"
            : thinking
              ? "Reva is thinking…"
              : listening
                ? interim || "Listening…"
                : speaking
                  ? "Reva is speaking…"
                  : lastUser
                    ? `You: ${lastUser}`
                    : "Tap an option, speak, or type"}
        </p>
        {micError && <p className="mt-2 text-[11px] text-amber-400">{micError}</p>}
      </div>

      {/* options + controls */}
      <div
        className="relative shrink-0 px-4 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.9rem)" }}
      >
        {/* option chips for the current question */}
        {opts && (
          <div className="mb-3 animate-fade-in">
            <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto">
              {opts.items.map((o) => {
                const active = opts.multi && multiSel.includes(o.say);
                return (
                  <button
                    key={o.label}
                    disabled={thinking || done}
                    onClick={() => {
                      if (opts.multi) {
                        setMultiSel((s) =>
                          o.say === "None"
                            ? ["None"]
                            : s.includes(o.say)
                              ? s.filter((x) => x !== o.say)
                              : [...s.filter((x) => x !== "None"), o.say],
                        );
                      } else {
                        send(o.say);
                      }
                    }}
                    className={`rounded-full border px-3.5 py-2 text-[12px] transition active:scale-95 disabled:opacity-40 ${
                      active
                        ? "border-[oklch(0.82_0.16_190)] bg-[oklch(0.82_0.16_190_/_18%)] text-foreground"
                        : "border-white/10 bg-white/[0.04] text-muted-foreground hover:border-white/25"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            {opts.multi && (
              <button
                onClick={submitMulti}
                disabled={thinking || done}
                className="mx-auto mt-2.5 block rounded-full px-5 py-2 text-[12px] font-medium text-primary-foreground disabled:opacity-40"
                style={{ background: "linear-gradient(90deg, oklch(0.82 0.16 190), oklch(0.85 0.18 150))" }}
              >
                {multiSel.length ? `Confirm ${multiSel.length} selected` : "Nothing applies"}
              </button>
            )}
          </div>
        )}

        {/* mic + quick controls */}
        <div className="flex items-center justify-center gap-2 mb-2.5">
          <ControlBtn icon={SkipForward} label="Skip" onClick={() => send("Let's skip this one.", "skip")} disabled={thinking || done} />
          <button
            onClick={listening ? stopListening : startListening}
            disabled={thinking || done}
            aria-label={listening ? "Stop listening" : "Talk to Reva"}
            className="relative h-14 w-14 rounded-full flex items-center justify-center text-primary-foreground disabled:opacity-40 active:scale-95 transition"
            style={{
              background: "linear-gradient(135deg, oklch(0.85 0.16 190), oklch(0.82 0.18 155))",
              boxShadow: listening
                ? "0 0 0 8px oklch(0.82 0.16 190 / 12%), 0 0 40px -6px oklch(0.82 0.16 190 / 80%)"
                : "0 0 30px -8px oklch(0.82 0.16 190 / 70%)",
            }}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <ControlBtn icon={RotateCcw} label="Repeat" onClick={() => (lastReva ? speak(lastReva) : send("Can you repeat that?", "repeat"))} disabled={thinking || done} />
        </div>

        {/* type */}
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1.5">
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
            className="flex-1 bg-transparent outline-none px-3 py-1.5 text-sm placeholder:text-muted-foreground"
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
            className="h-9 w-9 rounded-full flex items-center justify-center text-primary-foreground disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, oklch(0.85 0.16 190), oklch(0.82 0.18 155))" }}
          >
            {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        {/* what Reva knows */}
        {answered.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowKnown((s) => !s)}
              className="mx-auto flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              What Reva knows · {answered.length}
              {showKnown ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </button>
            {showKnown && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto animate-fade-in">
                {answered.map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => send(`Let's change my ${FIELD_LABELS[k] ?? k}.`, `edit:${k}`)}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px]"
                  >
                    <Check className="h-3 w-3 text-[oklch(0.82_0.16_155)]" />
                    <span className="text-muted-foreground">{FIELD_LABELS[k] ?? k}:</span>
                    <span className="font-medium">{fmt(k, v)}</span>
                    <Pencil className="h-2.5 w-2.5 opacity-50" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ControlBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[11px] text-muted-foreground transition active:scale-95 disabled:opacity-40"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
