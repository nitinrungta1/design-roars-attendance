import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "@/integrations/supabase/permission-middleware";
import type { Database } from "@/integrations/supabase/types";

type Json = Database["public"]["Tables"]["feature_flags"]["Row"]["payload"];

// ============================================================
// Platform settings
// ============================================================

export interface PlatformSettings {
  id: string;
  brand_name: string;
  product_name: string;
  support_email: string;
  default_plan_code: string | null;
  default_currency: string;
  default_timezone: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  date_format: string;
  time_format: string;
  number_format: string;
  week_start: number;
  role_labels: Record<string, string>;
  security: {
    enforce_2fa: boolean;
    idle_timeout_minutes: number;
    max_concurrent_sessions: number;
    ip_allowlist: string;
    password_min_length: number;
    require_symbol: boolean;
    require_number: boolean;
    hibp_check: boolean;
  };
  email: Json;
  updated_at: string;
}

const DEFAULT_SECURITY = {
  enforce_2fa: false,
  idle_timeout_minutes: 60,
  max_concurrent_sessions: 5,
  ip_allowlist: "",
  password_min_length: 10,
  require_symbol: true,
  require_number: true,
  hibp_check: true,
};

export const getPlatformSettings = createServerFn({ method: "POST" })
  .middleware([requirePermission("system.settings.read")])
  .handler(async (): Promise<{ settings: PlatformSettings | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("singleton", true)
      .maybeSingle();
    if (error) {
      console.error("getPlatformSettings", error);
      return { settings: null };
    }
    if (!data) return { settings: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = data as any;
    return {
      settings: {
        id: d.id,
        brand_name: d.brand_name,
        product_name: d.product_name,
        support_email: d.support_email,
        default_plan_code: d.default_plan_code,
        default_currency: d.default_currency,
        default_timezone: d.default_timezone,
        logo_url: d.logo_url,
        primary_color: d.primary_color,
        secondary_color: d.secondary_color ?? null,
        accent_color: d.accent_color ?? null,
        date_format: d.date_format ?? "DD/MM/YYYY",
        time_format: d.time_format ?? "24h",
        number_format: d.number_format ?? "en-IN",
        week_start: typeof d.week_start === "number" ? d.week_start : 1,
        role_labels: (d.role_labels as Record<string, string>) ?? {},
        security: { ...DEFAULT_SECURITY, ...((d.security as object) ?? {}) },
        email: (d.email as Json) ?? {},
        updated_at: d.updated_at as string,
      },
    };
  });

export const updatePlatformSettings = createServerFn({ method: "POST" })
  .middleware([requirePermission("system.settings.write")])
  .inputValidator(
    z.object({
      patch: z.object({
        brand_name: z.string().min(1).max(80).optional(),
        product_name: z.string().min(1).max(80).optional(),
        support_email: z.string().email().max(160).optional(),
        default_plan_code: z.string().max(40).nullable().optional(),
        default_currency: z.string().min(2).max(8).optional(),
        default_timezone: z.string().max(80).optional(),
        logo_url: z.string().max(500).nullable().optional(),
        primary_color: z.string().max(20).nullable().optional(),
        secondary_color: z.string().max(20).nullable().optional(),
        accent_color: z.string().max(20).nullable().optional(),
        date_format: z.string().max(20).optional(),
        time_format: z.enum(["12h", "24h"]).optional(),
        number_format: z.string().max(20).optional(),
        week_start: z.number().int().min(0).max(6).optional(),
        role_labels: z.record(z.string(), z.string()).optional(),
        security: z
          .object({
            enforce_2fa: z.boolean().optional(),
            idle_timeout_minutes: z.number().int().min(5).max(1440).optional(),
            max_concurrent_sessions: z.number().int().min(1).max(50).optional(),
            ip_allowlist: z.string().max(4000).optional(),
            password_min_length: z.number().int().min(6).max(64).optional(),
            require_symbol: z.boolean().optional(),
            require_number: z.boolean().optional(),
            hibp_check: z.boolean().optional(),
          })
          .optional(),
        email: z.record(z.string(), z.unknown()).optional(),
      }),
    }),
  )
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      ok: boolean;
      error?: string;
      details?: { message?: string; code?: string; hint?: string; details?: string } | null;
    }> => {
      try {
        const { userId } = context;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const patch = data.patch as Record<string, unknown>;
        const { error, data: updated, status, statusText } = await supabaseAdmin
          .from("platform_settings")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ ...(patch as any), updated_by: userId })
          .eq("singleton", true)
          .select();
        if (error) {
          console.error("[updatePlatformSettings] Supabase error:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            status,
            statusText,
            userId,
            patchKeys: Object.keys(patch),
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          });
          return {
            ok: false,
            error: `${error.message}${error.hint ? ` (hint: ${error.hint})` : ""}${error.details ? ` — ${error.details}` : ""}${error.code ? ` [code: ${error.code}]` : ""}`,
            details: {
              message: error.message,
              code: error.code,
              hint: error.hint,
              details: error.details,
            },
          };
        }
        if (!updated || updated.length === 0) {
          console.error("[updatePlatformSettings] No row updated", { userId, status, statusText });
          return {
            ok: false,
            error: "No platform_settings row was updated. The singleton row may be missing or RLS blocked the update.",
            details: { message: "0 rows affected", code: "NO_ROWS" },
          };
        }
        await supabaseAdmin.from("audit_logs").insert({
          actor_id: userId,
          action: "settings.updated",
          entity_type: "platform_settings",
          diff: data.patch as Json,
        });
        return { ok: true };
      } catch (e) {
        console.error("[updatePlatformSettings] Unexpected exception:", e, {
          stringified: JSON.stringify(e, Object.getOwnPropertyNames(e as object)),
        });
        const err = e as Error;
        return {
          ok: false,
          error: `Unexpected error: ${err?.message ?? String(e)}`,
          details: { message: err?.message ?? String(e) },
        };
      }
    },
  );

// ============================================================
// Audit logs
// ============================================================

export interface AuditLogRow {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_avatar: string | null;
  company_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  diff: Json | null;
  ip: string | null;
  user_agent: string | null;
}

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      q: z.string().max(200).optional(),
      action: z.string().max(80).optional(),
      entity: z.string().max(80).optional(),
      actorId: z.string().uuid().optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      limit: z.number().int().min(1).max(500).default(100),
    }),
  )
  .handler(async ({ context, data }): Promise<{ logs: AuditLogRow[]; actions: string[] }> => {
    const { supabase } = context;
    let q = supabase
      .from("audit_logs")
      .select("id, created_at, actor_id, company_id, action, entity_type, entity_id, diff, ip, user_agent")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.action) q = q.eq("action", data.action);
    if (data.entity) q = q.eq("entity_type", data.entity);
    if (data.actorId) q = q.eq("actor_id", data.actorId);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    if (data.q) q = q.or(`action.ilike.%${data.q}%,entity_type.ilike.%${data.q}%,entity_id.ilike.%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) {
      console.error("listAuditLogs", error);
      return { logs: [], actions: [] };
    }
    const actorIds = [...new Set((rows ?? []).map((r) => r.actor_id).filter(Boolean) as string[])];
    const { data: profiles } = actorIds.length
      ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", actorIds)
      : { data: [] };
    const pById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const actionsSet = new Set<string>();
    for (const r of rows ?? []) actionsSet.add(r.action);

    return {
      logs: (rows ?? []).map((r) => {
        const p = r.actor_id ? pById.get(r.actor_id) : null;
        return {
          id: r.id,
          created_at: r.created_at as string,
          actor_id: r.actor_id,
          actor_name: p?.full_name ?? null,
          actor_avatar: p?.avatar_url ?? null,
          company_id: r.company_id,
          action: r.action,
          entity_type: r.entity_type,
          entity_id: r.entity_id,
          diff: (r.diff as Json) ?? null,
          ip: r.ip,
          user_agent: r.user_agent,
        };
      }),
      actions: [...actionsSet].sort(),
    };
  });

// ============================================================
// Backups
// ============================================================

export interface BackupRow {
  id: string;
  status: string;
  table_count: number;
  row_count: number;
  size_bytes: number;
  download_url: string | null;
  error: string | null;
  requested_by: string | null;
  requested_by_name: string | null;
  requested_at: string;
  completed_at: string | null;
}

export const listBackups = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ backups: BackupRow[] }> => {
    const { supabase } = context;
    const { data: backups, error } = await supabase
      .from("backup_snapshots")
      .select("*")
      .order("requested_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("listBackups", error);
      return { backups: [] };
    }
    const ids = [...new Set((backups ?? []).map((b) => b.requested_by).filter(Boolean) as string[])];
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] };
    const pById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    return {
      backups: (backups ?? []).map((b) => ({
        id: b.id,
        status: b.status,
        table_count: b.table_count ?? 0,
        row_count: Number(b.row_count ?? 0),
        size_bytes: Number(b.size_bytes ?? 0),
        download_url: b.download_url,
        error: b.error,
        requested_by: b.requested_by,
        requested_by_name: b.requested_by ? pById.get(b.requested_by) ?? null : null,
        requested_at: b.requested_at as string,
        completed_at: b.completed_at as string | null,
      })),
    };
  });

export const requestBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: boolean; id?: string; error?: string }> => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("backup_snapshots")
      .insert({ status: "pending", requested_by: userId })
      .select("id")
      .single();
    if (error || !row) return { ok: false, error: error?.message };
    await supabase.rpc("log_audit", {
      _action: "backup.requested",
      _entity_type: "backup_snapshot",
      _entity_id: row.id,
    });
    return { ok: true, id: row.id };
  });

// ============================================================
// Feature flags
// ============================================================

export interface FeatureFlagRow {
  id: string;
  key: string;
  enabled: boolean;
  payload: Json;
  company_id: string | null;
  updated_at: string;
}

export const listFeatureFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ flags: FeatureFlagRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("feature_flags")
      .select("id, key, enabled, payload, company_id, updated_at")
      .order("key", { ascending: true });
    if (error) {
      console.error("listFeatureFlags", error);
      return { flags: [] };
    }
    return {
      flags: (data ?? []).map((f) => ({
        id: f.id,
        key: f.key,
        enabled: f.enabled,
        payload: (f.payload as Json) ?? {},
        company_id: f.company_id,
        updated_at: f.updated_at as string,
      })),
    };
  });

export const toggleFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), enabled: z.boolean() }))
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("feature_flags")
      .update({ enabled: data.enabled, updated_by: userId })
      .eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    await supabase.rpc("log_audit", {
      _action: data.enabled ? "flag.enabled" : "flag.disabled",
      _entity_type: "feature_flag",
      _entity_id: data.id,
    });
    return { ok: true };
  });

export const createFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      key: z
        .string()
        .min(1)
        .max(80)
        .regex(/^[a-z0-9_.-]+$/),
      enabled: z.boolean().default(false),
    }),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("feature_flags").insert({
      key: data.key,
      enabled: data.enabled,
      updated_by: userId,
    });
    if (error) return { ok: false, error: error.message };
    await supabase.rpc("log_audit", {
      _action: "flag.created",
      _entity_type: "feature_flag",
      _diff: { key: data.key, enabled: data.enabled },
    });
    return { ok: true };
  });

// ============================================================
// Company name uniqueness check
// ============================================================

export const checkCompanyNameAvailable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      name: z.string().min(1).max(120),
      excludeId: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ context, data }): Promise<{ available: boolean }> => {
    const { supabase } = context;
    const normalized = data.name.trim().toLowerCase();
    if (!normalized) return { available: false };
    let q = supabase.from("companies").select("id, name");
    if (data.excludeId) q = q.neq("id", data.excludeId);
    const { data: rows, error } = await q;
    if (error) {
      console.error("checkCompanyNameAvailable", error);
      return { available: true }; // fail open — server-side unique index is the source of truth
    }
    const taken = (rows ?? []).some(
      (r) => (r.name ?? "").trim().toLowerCase() === normalized,
    );
    return { available: !taken };
  });

// ============================================================
// AI brand color extraction from a logo URL
// ============================================================

export const extractLogoColors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ logoUrl: z.string().url() }))
  .handler(
    async ({
      data,
    }): Promise<{
      ok: boolean;
      primary?: string;
      secondary?: string;
      accent?: string;
      error?: string;
    }> => {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) return { ok: false, error: "AI gateway not configured" };

      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content:
                  "You are a brand designer. Look at the provided company logo image and identify the dominant brand colors. Return three harmonious hex colors that would work well as a UI palette.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract the brand palette from this logo. Return primary (most dominant), secondary (supporting), and accent (highlight) hex codes.",
                  },
                  { type: "image_url", image_url: { url: data.logoUrl } },
                ],
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "set_brand_palette",
                  description: "Return the extracted brand palette as 3 hex colors.",
                  parameters: {
                    type: "object",
                    properties: {
                      primary: {
                        type: "string",
                        description: "Primary brand color in #RRGGBB hex format",
                      },
                      secondary: {
                        type: "string",
                        description: "Secondary color in #RRGGBB hex format",
                      },
                      accent: {
                        type: "string",
                        description: "Accent / highlight color in #RRGGBB hex format",
                      },
                    },
                    required: ["primary", "secondary", "accent"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "set_brand_palette" } },
          }),
        });

        if (resp.status === 429) return { ok: false, error: "Rate limit exceeded. Try again shortly." };
        if (resp.status === 402) return { ok: false, error: "AI credits exhausted." };
        if (!resp.ok) return { ok: false, error: `AI gateway error (${resp.status})` };

        const json = await resp.json();
        const call = json?.choices?.[0]?.message?.tool_calls?.[0];
        const args = call?.function?.arguments;
        if (!args) return { ok: false, error: "No palette returned" };
        const parsed = typeof args === "string" ? JSON.parse(args) : args;
        const hex = (s: unknown): string | undefined => {
          if (typeof s !== "string") return undefined;
          const v = s.trim();
          return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : undefined;
        };
        return {
          ok: true,
          primary: hex(parsed.primary),
          secondary: hex(parsed.secondary),
          accent: hex(parsed.accent),
        };
      } catch (e) {
        console.error("extractLogoColors", e);
        return { ok: false, error: "Failed to analyze logo" };
      }
    },
  );
