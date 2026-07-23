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
const platformSchema = z.enum(["web", "android", "ios"]);
const savePushToken_createServerFn_handler = createServerRpc({
  id: "281f8d7a4a4a30294e6b39063c1a7ccc795c3c154f3ea64df4010cec4c7d0a07",
  name: "savePushToken",
  filename: "src/lib/push.functions.ts"
}, (opts) => savePushToken.__executeServer(opts));
const savePushToken = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => z.object({
  token: z.string().min(20).max(4096),
  platform: platformSchema
}).parse(data)).handler(savePushToken_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const row = {
    user_id: userId,
    token: data.token,
    platform: data.platform,
    last_seen_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const {
    error
  } = await supabase.from("push_subscriptions").upsert(row, {
    onConflict: "user_id,token"
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  savePushToken_createServerFn_handler
};
