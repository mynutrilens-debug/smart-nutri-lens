import { createFileRoute } from "@tanstack/react-router";

// Cron entry point for the smart notification engine.
// Called by pg_cron every 15 minutes with the project's anon key in `apikey`.
export const Route = createFileRoute("/api/public/notifications/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey =
          request.headers.get("apikey") ||
          request.headers.get("authorization")?.replace("Bearer ", "") ||
          "";
        const expected =
          process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";
        if (!expected || apikey !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        const { runReminderSweep, runSquadSweep } = await import("@/lib/notify.server");
        try {
          const reminders = await runReminderSweep();
          const squads = await runSquadSweep();
          return new Response(JSON.stringify({ ok: true, reminders, squads }), {
            headers: { "content-type": "application/json" },
          });
        } catch (e) {
          console.error("[notifications] sweep failed", e);
          return new Response(
            JSON.stringify({ ok: false, error: (e as Error).message }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
