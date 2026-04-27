import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sanitizeTouch } from "@/lib/attribution";

const eventSchema = z.object({
  event_name: z.string().trim().min(1).max(80),
  props: z.record(z.string(), z.unknown()).optional().nullable(),
  page_url: z.string().trim().max(2000).optional().nullable(),
  page_path: z.string().trim().max(1000).optional().nullable(),
  referrer: z.string().trim().max(2000).optional().nullable(),
  occurred_at: z.string().trim().max(50).optional().nullable(),
});

const payloadSchema = z.object({
  visitor_id: z.string().trim().min(8).max(64),
  session_id: z.string().trim().min(8).max(64),
  first_touch: z.unknown().optional(),
  last_touch: z.unknown().optional(),
  events: z.array(eventSchema).min(1).max(50),
});

function getServerSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid input" },
            { status: 400 }
          );
        }

        const supa = getServerSupabase();
        if (!supa) return Response.json({ ok: true, skipped: true });

        const { visitor_id, session_id, events } = parsed.data;
        const first = sanitizeTouch(parsed.data.first_touch);
        const last = sanitizeTouch(parsed.data.last_touch);
        const now = new Date().toISOString();

        try {
          // Upsert visitor.
          const { data: existingVisitor } = await supa
            .from("analytics_visitors")
            .select("visitor_id")
            .eq("visitor_id", visitor_id)
            .maybeSingle();

          if (existingVisitor) {
            await supa
              .from("analytics_visitors")
              .update({ last_seen: now })
              .eq("visitor_id", visitor_id);
          } else {
            await supa.from("analytics_visitors").insert({
              visitor_id,
              first_seen: now,
              last_seen: now,
              first_touch: first as never,
            });
          }

          // Upsert session.
          const { data: existingSession } = await supa
            .from("analytics_sessions")
            .select("session_id, page_count")
            .eq("session_id", session_id)
            .maybeSingle();

          const landingFromEvents =
            events.find((e) => e.event_name === "page_view")?.page_url ?? null;

          if (existingSession) {
            await supa
              .from("analytics_sessions")
              .update({
                ended_at: now,
                page_count:
                  (existingSession.page_count ?? 1) +
                  events.filter((e) => e.event_name === "page_view").length,
                last_touch: last as never,
                exit_url: landingFromEvents ?? undefined,
              })
              .eq("session_id", session_id);
          } else {
            await supa.from("analytics_sessions").insert({
              session_id,
              visitor_id,
              started_at: now,
              ended_at: now,
              last_touch: last as never,
              landing_url: last.landing_url ?? landingFromEvents ?? undefined,
              referrer: last.referrer ?? undefined,
              device: last.device ?? undefined,
              browser: last.browser ?? undefined,
              os: last.os ?? undefined,
              page_count:
                events.filter((e) => e.event_name === "page_view").length || 1,
            });

            const { data: v } = await supa
              .from("analytics_visitors")
              .select("total_sessions")
              .eq("visitor_id", visitor_id)
              .maybeSingle();
            await supa
              .from("analytics_visitors")
              .update({ total_sessions: (v?.total_sessions ?? 0) + 1 })
              .eq("visitor_id", visitor_id);
          }

          // Insert events in bulk.
          const rows = events.map((e) => ({
            visitor_id,
            session_id,
            event_name: e.event_name,
            props: (e.props ?? {}) as never,
            page_url: e.page_url ?? null,
            page_path: e.page_path ?? null,
            referrer: e.referrer ?? null,
            occurred_at: e.occurred_at ?? now,
          }));
          await supa.from("analytics_events").insert(rows);
        } catch (err) {
          console.error("track ingest error:", err);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
