// Server-only helper: call Gemini via the user's GEMINI_API_KEY when available,
// otherwise fall back to the Lovable AI gateway with LOVABLE_API_KEY.
export async function callGeminiJson(opts: {
  system: string;
  user: string;
  model?: string;
}): Promise<string> {
  const { system, user } = opts;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    const model = opts.model || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { role: "system", parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Gemini rate limit reached. Please wait and try again.");
      if (res.status === 403) throw new Error("Gemini API access denied (403). Check that GEMINI_API_KEY is valid and the model is enabled.");
      throw new Error(`Gemini error ${res.status}: ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as any;
    const text: string = json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("") ?? "{}";
    return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  }

  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY or LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model ? `google/${opts.model}` : "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limit reached on AI gateway. Please wait and try again.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    if (res.status === 403) throw new Error("AI gateway access denied (403). Set GEMINI_API_KEY to use your own Gemini key.");
    throw new Error(`AI error ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as any;
  const text: string = json?.choices?.[0]?.message?.content ?? "{}";
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}
