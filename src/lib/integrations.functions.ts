import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const INTEGRATION_KINDS = [
  "payment",
  "email",
  "sms",
  "whatsapp",
  "webhook",
  "api",
  "storage",
  "analytics",
] as const;
export type IntegrationKind = (typeof INTEGRATION_KINDS)[number];

export interface IntegrationRow {
  id: string;
  kind: IntegrationKind;
  provider: string;
  label: string | null;
  is_enabled: boolean;
  last_synced_at: string | null;
  updated_at: string;
}

export const listIntegrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ kind: z.enum(INTEGRATION_KINDS).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ integrations: IntegrationRow[] }> => {
    const { supabase } = context;
    let q = supabase
      .from("integrations")
      .select("id, kind, provider, label, is_enabled, last_synced_at, updated_at")
      .order("updated_at", { ascending: false });
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) return { integrations: [] };
    return { integrations: (rows ?? []) as IntegrationRow[] };
  });

const UpsertIntegrationSchema = z.object({
  id: z.string().uuid().optional(),
  kind: z.enum(INTEGRATION_KINDS),
  provider: z.string().min(1).max(80),
  label: z.string().max(200).optional().nullable(),
  is_enabled: z.boolean().default(false),
});

export const upsertIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertIntegrationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    if (data.id) {
      const { error } = await supabase
        .from("integrations")
        .update({
          provider: data.provider,
          label: data.label,
          is_enabled: data.is_enabled,
          kind: data.kind,
        })
        .eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
    } else {
      const { error } = await supabase.from("integrations").insert({
        kind: data.kind,
        provider: data.provider,
        label: data.label,
        is_enabled: data.is_enabled,
      });
      if (error) return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

export const toggleIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), is_enabled: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("integrations")
      .update({ is_enabled: data.is_enabled })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Webhook endpoints
// ============================================================
export interface WebhookRow {
  id: string;
  label: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_status: number | null;
  last_called_at: string | null;
  created_at: string;
}

export const listWebhooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ webhooks: WebhookRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .select("id, label, url, events, is_active, last_status, last_called_at, created_at")
      .order("created_at", { ascending: false });
    if (error) return { webhooks: [] };
    return { webhooks: (data ?? []) as WebhookRow[] };
  });

const UpsertWebhookSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(200),
  url: z.string().url().max(2048),
  events: z.array(z.string().max(80)).max(50).default([]),
  is_active: z.boolean().default(true),
});

export const upsertWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertWebhookSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    if (data.id) {
      const { error } = await supabase
        .from("webhook_endpoints")
        .update(data)
        .eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
    } else {
      const { error } = await supabase.from("webhook_endpoints").insert(data);
      if (error) return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

export const deleteWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("webhook_endpoints").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// API keys (admin-issued)
// ============================================================
export interface ApiKeyRow {
  id: string;
  label: string;
  prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export const listApiKeys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ keys: ApiKeyRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, label, prefix, scopes, is_active, last_used_at, created_at, revoked_at")
      .order("created_at", { ascending: false });
    if (error) return { keys: [] };
    return { keys: (data ?? []) as ApiKeyRow[] };
  });

const CreateApiKeySchema = z.object({
  label: z.string().min(1).max(120),
  scopes: z.array(z.string().max(60)).max(20).default([]),
});

export const createApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateApiKeySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // Generate token: prefix + 32 random bytes (hex)
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const secret = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const prefix = `pk_${Math.random().toString(36).slice(2, 10)}`;
    const token = `${prefix}_${secret}`;
    // Hash with SHA-256
    const hashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const key_hash = Array.from(new Uint8Array(hashBuf), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const { error } = await supabase.from("api_keys").insert({
      label: data.label,
      prefix,
      key_hash,
      scopes: data.scopes,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, token };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
