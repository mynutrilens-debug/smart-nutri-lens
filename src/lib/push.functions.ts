import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const platformSchema = z.enum(["web", "android", "ios"]);

export const savePushToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    token: z.string().min(20).max(4096),
    platform: platformSchema,
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const row = {
      user_id: userId,
      token: data.token,
      platform: data.platform,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await (supabase.from("push_subscriptions") as any)
      .upsert(row, { onConflict: "user_id,token" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
