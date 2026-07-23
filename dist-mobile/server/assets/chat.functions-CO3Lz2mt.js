import { c as createServerRpc } from "./createServerRpc-S7gwSw9F.js";
import { z } from "zod";
import { r as requireSupabaseAuth } from "./auth-middleware-B4NMxYBh.js";
import { c as createServerFn } from "./server-BadC42R4.js";
import "@supabase/supabase-js";
import "./createMiddleware-BvN2ghIY.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const GEMINI_MODEL = "gemini-2.5-flash";
async function callGeminiChat(opts) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;
    const contents = [...opts.history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{
        text: m.content
      }]
    })), {
      role: "user",
      parts: [{
        text: opts.user
      }]
    }];
    const res2 = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          role: "system",
          parts: [{
            text: opts.system
          }]
        },
        contents,
        generationConfig: {
          temperature: 0.85
        }
      })
    });
    if (!res2.ok) {
      const body = await res2.text().catch(() => "");
      if (res2.status === 429) throw new Error("NutriBot is busy. Please try again in a moment.");
      throw new Error(`Gemini error ${res2.status}: ${body.slice(0, 200)}`);
    }
    const json2 = await res2.json();
    return json2?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("") ?? "Sorry, I couldn't generate a response.";
  }
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY or LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: `google/${GEMINI_MODEL}`,
      messages: [{
        role: "system",
        content: opts.system
      }, ...opts.history.map((m) => ({
        role: m.role,
        content: m.content
      })), {
        role: "user",
        content: opts.user
      }]
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("NutriBot is busy. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    throw new Error(`AI error ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
}
const listChatMessages_createServerFn_handler = createServerRpc({
  id: "f420645be31b8962619debb2aadab1f79a4cf07ebdbcd2d087ffa02a64c44de6",
  name: "listChatMessages",
  filename: "src/lib/chat.functions.ts"
}, (opts) => listChatMessages.__executeServer(opts));
const listChatMessages = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listChatMessages_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data,
    error
  } = await supabase.from("chat_messages").select("id, role, content, created_at").eq("user_id", userId).order("created_at", {
    ascending: true
  }).limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
});
const sendChatMessage_createServerFn_handler = createServerRpc({
  id: "abb0f390d0d9d5c002c238029f7d6ac7eceb5f795c2ff0103d4fb2cfd687a422",
  name: "sendChatMessage",
  filename: "src/lib/chat.functions.ts"
}, (opts) => sendChatMessage.__executeServer(opts));
const sendChatMessage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
  message: z.string().trim().min(1).max(2e3)
}).parse(d)).handler(sendChatMessage_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: sub
  } = await supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
  const now = /* @__PURE__ */ new Date();
  const trialActive = sub?.plan === "trial" && sub?.status === "active" && new Date(sub.trial_expires_at) > now;
  const platActive = sub?.plan === "platinum" && sub?.status === "active" && (!sub.current_period_expires_at || new Date(sub.current_period_expires_at) > now);
  if (!trialActive && !platActive) {
    throw new Error("NutriBot is included with the Platinum plan. Please upgrade to chat.");
  }
  const {
    data: p
  } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
  const {
    data: history
  } = await supabase.from("chat_messages").select("role, content").eq("user_id", userId).order("created_at", {
    ascending: false
  }).limit(20);
  const ordered = (history ?? []).reverse();
  const profileBlock = p ? `USER PROFILE
- Name: ${p.display_name ?? "User"}
- Gender: ${p.gender ?? "n/a"} · Age: ${p.age ?? "n/a"}
- Height: ${p.height_cm ?? "?"}cm · Weight: ${p.weight_kg ?? "?"}kg · Target: ${p.target_weight_kg ?? "?"}kg
- Goal: ${p.physique_goal ?? "n/a"} · Activity: ${p.activity_level ?? "n/a"}
- Diet preference: ${p.diet_preference ?? "n/a"}
- Region/Cuisine: ${p.region ?? "Global"} / ${p.cuisine ?? "n/a"}
- Allergies: ${(p.allergies ?? []).join(", ") || "none"}
- Medical conditions: ${(p.medical_conditions ?? []).join(", ") || "none"}
- Daily targets: ${p.daily_calorie_goal} kcal · P:${p.protein_goal_g}g C:${p.carbs_goal_g}g F:${p.fat_goal_g}g` : "USER PROFILE: not completed yet.";
  const system = `You are NutriBot, the friendly in-app nutrition & fitness coach for MyNutriLens.
${profileBlock}

STYLE
- Personalize every answer using the profile above (goal, diet preference, region, allergies, medical conditions).
- Be warm, concise, and practical. Use short paragraphs and markdown bullet lists.
- Prefer locally-available foods that match the user's region/cuisine.
- For medical or deficiency questions (e.g. B12, iron, vitamin D, PCOS, diabetes), give food/lifestyle guidance AND clearly recommend consulting a doctor before supplements.
- Never invent facts about the user. If something isn't in the profile, ask.
- ALWAYS end your reply with ONE engaging follow-up question to keep the conversation going, on its own line prefixed with "👉".

SAFETY
- You are not a doctor. Do not diagnose. Flag red-flag symptoms and recommend medical care.
- Respect allergies and dietary preference strictly in every recommendation.`;
  const {
    error: insErr
  } = await supabase.from("chat_messages").insert({
    user_id: userId,
    role: "user",
    content: data.message
  });
  if (insErr) throw new Error(insErr.message);
  let reply;
  try {
    reply = await callGeminiChat({
      system,
      history: ordered,
      user: data.message
    });
  } catch (e) {
    reply = `Sorry — I hit a hiccup: ${e?.message ?? "unknown error"}. Try again in a moment.`;
  }
  await supabase.from("chat_messages").insert({
    user_id: userId,
    role: "assistant",
    content: reply
  });
  return {
    reply
  };
});
const clearChatHistory_createServerFn_handler = createServerRpc({
  id: "36fcad8fa115824771d0087d522e204a1947fcb8b36e2b10465c276702b2ea3a",
  name: "clearChatHistory",
  filename: "src/lib/chat.functions.ts"
}, (opts) => clearChatHistory.__executeServer(opts));
const clearChatHistory = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(clearChatHistory_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("chat_messages").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  clearChatHistory_createServerFn_handler,
  listChatMessages_createServerFn_handler,
  sendChatMessage_createServerFn_handler
};
