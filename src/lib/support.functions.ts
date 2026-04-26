import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// Tickets
// ============================================================

export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export const TICKET_STATUSES = ["open", "pending", "resolved", "closed"] as const;
export const TICKET_CHANNELS = ["email", "chat", "portal", "api", "whatsapp"] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketChannel = (typeof TICKET_CHANNELS)[number];

export interface TicketRow {
  id: string;
  company_id: string | null;
  requester_email: string;
  requester_name: string | null;
  subject: string;
  body: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  channel: TicketChannel;
  assigned_to: string | null;
  sla_due_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const listTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ tickets: TicketRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        "id, company_id, requester_email, requester_name, subject, body, priority, status, channel, assigned_to, sla_due_at, first_response_at, resolved_at, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listTickets", error);
      return { tickets: [] };
    }
    return { tickets: (data ?? []) as TicketRow[] };
  });

const CreateTicketSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().max(50_000).optional().nullable(),
  requester_email: z.string().email(),
  requester_name: z.string().max(200).optional().nullable(),
  priority: z.enum(TICKET_PRIORITIES).default("normal"),
  channel: z.enum(TICKET_CHANNELS).default("portal"),
});

export const createTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateTicketSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("support_tickets").insert({
      subject: data.subject,
      body: data.body ?? null,
      requester_email: data.requester_email,
      requester_name: data.requester_name ?? null,
      priority: data.priority,
      channel: data.channel,
    });
    if (error) {
      console.error("createTicket", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

const PatchTicketSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
});

export const patchTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PatchTicketSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const patch: {
      status?: TicketStatus;
      priority?: TicketPriority;
      resolved_at?: string;
    } = {};
    if (data.status) {
      patch.status = data.status;
      if (data.status === "resolved" || data.status === "closed") {
        patch.resolved_at = new Date().toISOString();
      }
    }
    if (data.priority) patch.priority = data.priority;
    const { error } = await supabase.from("support_tickets").update(patch).eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// SLA Policies
// ============================================================

export interface SlaPolicyRow {
  id: string;
  name: string;
  priority: TicketPriority;
  first_response_minutes: number;
  resolution_minutes: number;
  is_active: boolean;
}

export const listSlaPolicies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ policies: SlaPolicyRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("sla_policies")
      .select("id, name, priority, first_response_minutes, resolution_minutes, is_active")
      .order("priority", { ascending: true });
    if (error) {
      console.error("listSlaPolicies", error);
      return { policies: [] };
    }
    return { policies: (data ?? []) as SlaPolicyRow[] };
  });

const PatchSlaSchema = z.object({
  id: z.string().uuid(),
  first_response_minutes: z.number().int().min(1).optional(),
  resolution_minutes: z.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
});

export const patchSlaPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PatchSlaSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { id, ...rest } = data;
    const { error } = await supabase.from("sla_policies").update(rest).eq("id", id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// KB Articles
// ============================================================

export interface KbArticleRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  status: "draft" | "scheduled" | "published" | "archived";
  view_count: number;
  published_at: string | null;
  updated_at: string;
}

export const listKbArticles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ articles: KbArticleRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("kb_articles")
      .select("id, slug, title, excerpt, category, status, view_count, published_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listKbArticles", error);
      return { articles: [] };
    }
    return { articles: (data ?? []) as KbArticleRow[] };
  });

const UpsertKbSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  body: z.string().max(100_000).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  status: z.enum(["draft", "scheduled", "published", "archived"]).default("draft"),
});

export const upsertKbArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertKbSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const payload = {
      ...data,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("kb_articles").upsert(payload, { onConflict: "slug" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
