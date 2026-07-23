const stripFences = (t) => t.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function tryGemini(model, system, user, geminiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { role: "system", parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
    })
  });
  return res;
}
async function tryGateway(model, system, user, key) {
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `google/${model}`,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  });
}
async function callGeminiJson(opts) {
  const { system, user } = opts;
  const geminiKey = process.env.GEMINI_API_KEY;
  const requested = opts.model || "gemini-2.5-flash";
  const models = Array.from(/* @__PURE__ */ new Set([requested, "gemini-2.5-flash", "gemini-2.5-flash-lite"]));
  let lastErr = "";
  let lastStatus = 0;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = geminiKey ? await tryGemini(model, system, user, geminiKey) : await tryGateway(model, system, user, process.env.LOVABLE_API_KEY || "");
        if (!geminiKey && !process.env.LOVABLE_API_KEY) {
          throw new Error("Missing GEMINI_API_KEY or LOVABLE_API_KEY");
        }
        if (res.ok) {
          const json = await res.json();
          const text = geminiKey ? json?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("") ?? "{}" : json?.choices?.[0]?.message?.content ?? "{}";
          return stripFences(text);
        }
        lastStatus = res.status;
        lastErr = (await res.text().catch(() => "")).slice(0, 200);
        if (res.status === 503 || res.status === 429 || res.status >= 500) {
          await sleep(500 * Math.pow(2, attempt));
          continue;
        }
        if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
        if (res.status === 403) throw new Error(`AI access denied (403): ${lastErr}`);
        throw new Error(`AI error ${res.status}: ${lastErr}`);
      } catch (e) {
        if (e?.message?.startsWith("AI error") || e?.message?.startsWith("AI access") || e?.message?.startsWith("AI credits") || e?.message?.startsWith("Missing GEMINI")) {
          if (attempt === 2) break;
          if (!/^AI error 5|^AI error 429/.test(e.message)) throw e;
        }
        lastErr = e?.message || String(e);
        await sleep(500 * Math.pow(2, attempt));
      }
    }
  }
  throw new Error(
    lastStatus === 503 ? "The AI model is temporarily overloaded. Please try again in a moment." : `AI request failed after retries (${lastStatus}): ${lastErr}`
  );
}
export {
  callGeminiJson as c
};
