import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, Sparkles, Loader2, Check, X, Image as ImageIcon, Pencil, Wand2 } from "lucide-react";
import { analyzeFood } from "@/lib/scan.functions";
import { logFood, listFoods } from "@/lib/food.functions";
import { hapticTap, pickNativeFoodImage } from "@/lib/native";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/scan")({ component: Scan });

const examples = [
  { emoji: "🍕", name: "Pizza" }, { emoji: "🥗", name: "Salad" },
  { emoji: "🍔", name: "Burger" }, { emoji: "🍣", name: "Sushi" },
  { emoji: "🥑", name: "Bowl" }, { emoji: "🍝", name: "Pasta" },
];

function fileToBase64(file: File): Promise<{ b64: string; preview: string; mime: string }> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      const b64 = result.split(",")[1];
      res({ b64, preview: result, mime: file.type || "image/jpeg" });
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function Scan() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Awaited<ReturnType<typeof analyzeFood>> | null>(null);
  const [edit, setEdit] = useState<{ name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number } | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (analysis) setEdit({
      name: analysis.name, calories: analysis.calories, protein_g: analysis.protein_g,
      carbs_g: analysis.carbs_g, fat_g: analysis.fat_g,
    });
  }, [analysis]);

  const recent = useQuery({ queryKey: ["foods"], queryFn: () => listFoods() });

  const analyzeMut = useMutation({
    mutationFn: (p: { image_base64: string; mime_type: string }) => analyzeFood({ data: p }),
    onSuccess: r => setAnalysis(r),
    onError: (e: any) => toast.error(e.message ?? "Analysis failed"),
  });

  const logMut = useMutation({
    mutationFn: (input: any) => logFood({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["foods"] });
      toast.success("Logged!");
      setPreview(null); setAnalysis(null);
      navigate({ to: "/diet" });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  async function onPick(file?: File) {
    if (!file) return;
    const { b64, preview, mime } = await fileToBase64(file);
    setPreview(preview);
    setAnalysis(null);
    analyzeMut.mutate({ image_base64: b64, mime_type: mime });
  }

  async function pickImage(source: "camera" | "photos") {
    await hapticTap();
    try {
      const nativeImage = await pickNativeFoodImage(source);
      if (nativeImage) {
        setPreview(nativeImage.preview);
        setAnalysis(null);
        analyzeMut.mutate({ image_base64: nativeImage.b64, mime_type: nativeImage.mime });
        return;
      }
      (source === "camera" ? camRef : fileRef).current?.click();
    } catch (e: any) {
      if (e?.message && !/cancel/i.test(e.message)) toast.error(e.message);
    }
  }

  return (
    <div className="px-5 pt-12 pb-8 space-y-5">
      <header className="animate-slide-up">
        <p className="text-xs text-muted-foreground">AI Vision</p>
        <h1 className="text-2xl font-bold tracking-tight">Scan your meal</h1>
        <p className="text-sm text-muted-foreground mt-1">Point your camera at any food — Gemini will estimate the macros.</p>
      </header>

      {/* Scan window */}
      <div className="relative aspect-square rounded-[32px] glass overflow-hidden animate-slide-up" style={{ animationDelay: ".05s" }}>
        {preview ? (
          <img src={preview} alt="preview" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        )}
        {/* Corner brackets */}
        {["top-4 left-4 border-l-2 border-t-2", "top-4 right-4 border-r-2 border-t-2", "bottom-4 left-4 border-l-2 border-b-2", "bottom-4 right-4 border-r-2 border-b-2"].map(c => (
          <div key={c} className={`absolute h-10 w-10 rounded-[12px] border-primary ${c}`} style={{ boxShadow: "0 0 18px oklch(0.84 0.18 145 / 50%)" }} />
        ))}
        {/* Scan line */}
        {(analyzeMut.isPending || !preview) && (
          <div className="absolute inset-x-8 top-0 bottom-0 overflow-hidden pointer-events-none">
            <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-sweep" style={{ boxShadow: "0 0 18px oklch(0.84 0.18 145)" }} />
          </div>
        )}
        {analyzeMut.isPending && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm font-medium">Analyzing your food…</p>
          </div>
        )}
        {!preview && !analyzeMut.isPending && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-ring animate-float">
              <Camera className="h-7 w-7 text-primary-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Center the food in the frame</p>
          </div>
        )}
      </div>

      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => onPick(e.target.files?.[0])} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onPick(e.target.files?.[0])} />

      {/* Actions */}
      {!analysis && (
        <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{ animationDelay: ".1s" }}>
          <button onClick={() => pickImage("camera")}
            className="py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-ring active:scale-[.98]">
            <Camera className="h-5 w-5" /> Camera
          </button>
          <button onClick={() => pickImage("photos")}
            className="py-4 rounded-2xl glass font-semibold flex items-center justify-center gap-2 active:scale-[.98]">
            <Upload className="h-5 w-5" /> Upload
          </button>
        </div>
      )}

      {/* Analysis result */}
      {analysis && (
        <div className="glass rounded-3xl p-5 animate-slide-up">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">AI detected</span>
            <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary">{Math.round(analysis.confidence * 100)}% sure</span>
          </div>
          <h3 className="mt-2 text-xl font-bold">{analysis.name}</h3>
          {analysis.notes && <p className="text-xs text-muted-foreground mt-1">{analysis.notes}</p>}

          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { l: "kcal", v: analysis.calories, c: "oklch(0.84 0.18 145)" },
              { l: "P", v: `${Math.round(analysis.protein_g)}g`, c: "oklch(0.74 0.22 295)" },
              { l: "C", v: `${Math.round(analysis.carbs_g)}g`, c: "oklch(0.82 0.16 80)" },
              { l: "F", v: `${Math.round(analysis.fat_g)}g`, c: "oklch(0.7 0.2 25)" },
            ].map(m => (
              <div key={m.l} className="bg-white/5 rounded-2xl p-2.5 text-center border border-white/5">
                <div className="text-sm font-bold tabular-nums" style={{ color: m.c }}>{m.v}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{m.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => { setAnalysis(null); setPreview(null); }}
              className="py-3 rounded-2xl glass font-medium flex items-center justify-center gap-2"><X className="h-4 w-4" /> Discard</button>
            <button disabled={logMut.isPending}
              onClick={() => logMut.mutate({
                name: analysis.name, meal_type: analysis.meal_type,
                calories: analysis.calories, protein_g: analysis.protein_g,
                carbs_g: analysis.carbs_g, fat_g: analysis.fat_g, image_url: preview,
              })}
              className="py-3 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-ring">
              {logMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Log it
            </button>
          </div>
        </div>
      )}

      {/* Examples */}
      {!analysis && !analyzeMut.isPending && (
        <section className="animate-slide-up" style={{ animationDelay: ".15s" }}>
          <h3 className="text-sm font-semibold px-1 mb-2">Try with</h3>
          <div className="grid grid-cols-3 gap-2">
            {examples.map(e => (
              <div key={e.name} className="glass rounded-2xl p-3 text-center">
                <div className="text-2xl">{e.emoji}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{e.name}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent scans */}
      <section className="animate-slide-up" style={{ animationDelay: ".2s" }}>
        <h3 className="text-sm font-semibold px-1 mb-2 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" /> Recent scans
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
          {(recent.data ?? []).slice(0, 8).map(f => (
            <div key={f.id} className="shrink-0 w-32 glass rounded-2xl p-2.5">
              <div className="h-20 w-full rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl overflow-hidden">
                {f.image_url ? <img src={f.image_url} alt="" className="h-full w-full object-cover" /> : "🍽️"}
              </div>
              <div className="mt-2 text-xs font-medium truncate">{f.name}</div>
              <div className="text-[10px] text-muted-foreground">{f.calories} kcal</div>
            </div>
          ))}
          {!recent.data?.length && <div className="text-xs text-muted-foreground">No scans yet</div>}
        </div>
      </section>
    </div>
  );
}
