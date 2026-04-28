import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// Types
// ============================================================

export const HOLIDAY_TYPES = [
  "national",
  "regional",
  "religious",
  "optional",
  "company",
  "half_day",
] as const;
export type HolidayType = (typeof HOLIDAY_TYPES)[number];

export interface CountryRow {
  code: string;
  name: string;
  flag_emoji: string | null;
  weekend_days: number[];
  default_timezone: string | null;
}

export interface HolidayTemplateRow {
  id: string;
  country_code: string;
  year: number;
  name: string;
  holiday_date: string;
  region: string | null;
  type: HolidayType;
  is_recurring: boolean;
}

export interface CompanyHolidayRow {
  id: string;
  company_id: string;
  company_name: string;
  name: string;
  holiday_date: string;
  region: string | null;
  country_code: string | null;
  type: HolidayType;
  is_paid: boolean;
  is_recurring: boolean;
  is_optional: boolean;
  description: string | null;
  template_id: string | null;
  year: number;
}

export interface CompanyHolidaySettingsRow {
  company_id: string;
  country_code: string | null;
  weekend_days: number[];
  auto_import_enabled: boolean;
  last_synced_year: number | null;
}

// ============================================================
// Countries
// ============================================================

export const listCountries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ countries: CountryRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("countries")
      .select("code, name, flag_emoji, weekend_days, default_timezone")
      .order("name");
    if (error) {
      console.error("listCountries", error);
      return { countries: [] };
    }
    return {
      countries: (data ?? []).map((c) => ({
        code: c.code,
        name: c.name,
        flag_emoji: c.flag_emoji,
        weekend_days: (c.weekend_days as number[]) ?? [0, 6],
        default_timezone: c.default_timezone,
      })),
    };
  });

// ============================================================
// Holiday templates (prebuilt)
// ============================================================

const ListTemplatesSchema = z.object({
  country_code: z.string().min(2).max(3),
  year: z.number().int().min(2000).max(2100),
});

export const listHolidayTemplates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListTemplatesSchema.parse(input))
  .handler(async ({ context, data }): Promise<{ templates: HolidayTemplateRow[] }> => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("holiday_templates")
      .select("id, country_code, year, name, holiday_date, region, type, is_recurring")
      .eq("country_code", data.country_code)
      .eq("year", data.year)
      .order("holiday_date");
    if (error) {
      console.error("listHolidayTemplates", error);
      return { templates: [] };
    }
    return { templates: (rows ?? []) as HolidayTemplateRow[] };
  });

// ============================================================
// Company holidays
// ============================================================

const ListCompanyHolidaysSchema = z.object({
  company_id: z.string().uuid().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  type: z.enum(HOLIDAY_TYPES).optional(),
});

export const listCompanyHolidays = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    ListCompanyHolidaysSchema.parse(input ?? {}),
  )
  .handler(async ({ context, data }): Promise<{ holidays: CompanyHolidayRow[] }> => {
    const { supabase } = context;
    let q = supabase
      .from("holidays")
      .select(
        "id, company_id, name, holiday_date, region, is_optional, country_code, type, is_paid, is_recurring, description, template_id, year, companies(name)",
      )
      .order("holiday_date", { ascending: true })
      .limit(2000);
    if (data.company_id) q = q.eq("company_id", data.company_id);
    if (data.year) q = q.eq("year", data.year);
    if (data.type) q = q.eq("type", data.type);

    const { data: rows, error } = await q;
    if (error) {
      console.error("listCompanyHolidays", error);
      return { holidays: [] };
    }
    return {
      holidays: (rows ?? []).map((h) => {
        const co = h.companies as { name: string } | null;
        return {
          id: h.id,
          company_id: h.company_id,
          company_name: co?.name ?? "—",
          name: h.name,
          holiday_date: h.holiday_date,
          region: h.region,
          country_code: h.country_code,
          type: h.type as HolidayType,
          is_paid: h.is_paid,
          is_recurring: h.is_recurring,
          is_optional: h.is_optional,
          description: h.description,
          template_id: h.template_id,
          year: h.year,
        };
      }),
    };
  });

// ============================================================
// Create / Update / Delete
// ============================================================

const HolidayFormSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  holiday_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  country_code: z.string().min(2).max(3).optional().or(z.literal("")),
  type: z.enum(HOLIDAY_TYPES).default("company"),
  is_paid: z.boolean().default(true),
  is_recurring: z.boolean().default(false),
  is_optional: z.boolean().default(false),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const createHolidayV2 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => HolidayFormSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("holidays").insert({
      company_id: data.company_id,
      name: data.name,
      holiday_date: data.holiday_date,
      region: data.region || null,
      country_code: data.country_code || null,
      type: data.type,
      is_paid: data.is_paid,
      is_recurring: data.is_recurring,
      is_optional: data.is_optional,
      description: data.description || null,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const UpdateHolidaySchema = HolidayFormSchema.partial().extend({
  id: z.string().uuid(),
});

export const updateHolidayV2 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateHolidaySchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { id, ...rest } = data;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v === "" && (k === "region" || k === "country_code" || k === "description"))
        patch[k] = null;
      else if (v !== undefined) patch[k] = v;
    }
    const { error } = await supabase.from("holidays").update(patch).eq("id", id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteHolidayV2 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("holidays").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Import templates into a company
// ============================================================

const ImportTemplateSchema = z.object({
  company_id: z.string().uuid(),
  country_code: z.string().min(2).max(3),
  year: z.number().int().min(2000).max(2100),
  mode: z.enum(["replace", "merge", "skip_duplicates"]).default("merge"),
});

export const importHolidayTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ImportTemplateSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;

    const { data: templates, error: tErr } = await supabase
      .from("holiday_templates")
      .select("id, name, holiday_date, region, type, is_recurring")
      .eq("country_code", data.country_code)
      .eq("year", data.year);
    if (tErr) return { ok: false as const, error: tErr.message };
    if (!templates || templates.length === 0)
      return { ok: false as const, error: "No templates available for that country / year." };

    if (data.mode === "replace") {
      const { error: dErr } = await supabase
        .from("holidays")
        .delete()
        .eq("company_id", data.company_id)
        .eq("year", data.year);
      if (dErr) return { ok: false as const, error: dErr.message };
    }

    let existing: { holiday_date: string; name: string }[] = [];
    if (data.mode !== "replace") {
      const { data: ex } = await supabase
        .from("holidays")
        .select("holiday_date, name")
        .eq("company_id", data.company_id)
        .eq("year", data.year);
      existing = ex ?? [];
    }
    const exKey = (d: string, n: string) => `${d}::${n.toLowerCase()}`;
    const exSet = new Set(existing.map((e) => exKey(e.holiday_date, e.name)));

    const rows = templates
      .filter((t) =>
        data.mode === "replace" ? true : !exSet.has(exKey(t.holiday_date, t.name)),
      )
      .map((t) => ({
        company_id: data.company_id,
        country_code: data.country_code,
        template_id: t.id,
        name: t.name,
        holiday_date: t.holiday_date,
        region: t.region,
        type: t.type,
        is_recurring: t.is_recurring,
        is_paid: true,
        is_optional: t.type === "optional",
      }));

    if (rows.length === 0)
      return { ok: true as const, inserted: 0, message: "No new holidays to import." };

    const { error: iErr } = await supabase.from("holidays").insert(rows);
    if (iErr) return { ok: false as const, error: iErr.message };

    await supabase
      .from("company_holiday_settings")
      .upsert(
        {
          company_id: data.company_id,
          country_code: data.country_code,
          last_synced_year: data.year,
        },
        { onConflict: "company_id" },
      );

    return { ok: true as const, inserted: rows.length };
  });

// ============================================================
// Duplicate to future years
// ============================================================

const DuplicateSchema = z.object({
  holiday_id: z.string().uuid(),
  target_years: z.array(z.number().int().min(2000).max(2100)).min(1).max(10),
});

export const duplicateHolidayToYears = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DuplicateSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: src, error } = await supabase
      .from("holidays")
      .select(
        "company_id, country_code, name, holiday_date, region, type, is_paid, is_recurring, is_optional, description, template_id",
      )
      .eq("id", data.holiday_id)
      .single();
    if (error || !src) return { ok: false as const, error: error?.message ?? "Not found" };

    const baseDate = new Date(src.holiday_date);
    const month = baseDate.getUTCMonth();
    const day = baseDate.getUTCDate();

    const rows = data.target_years.map((y) => ({
      company_id: src.company_id,
      country_code: src.country_code,
      template_id: src.template_id,
      name: src.name,
      holiday_date: `${y}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      region: src.region,
      type: src.type,
      is_paid: src.is_paid,
      is_recurring: true,
      is_optional: src.is_optional,
      description: src.description,
    }));

    const { error: iErr } = await supabase.from("holidays").insert(rows);
    if (iErr) return { ok: false as const, error: iErr.message };
    return { ok: true as const, inserted: rows.length };
  });

// ============================================================
// Settings
// ============================================================

export const getCompanyHolidaySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ company_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }): Promise<{ settings: CompanyHolidaySettingsRow | null }> => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("company_holiday_settings")
      .select("company_id, country_code, weekend_days, auto_import_enabled, last_synced_year")
      .eq("company_id", data.company_id)
      .maybeSingle();
    if (error) {
      console.error("getCompanyHolidaySettings", error);
      return { settings: null };
    }
    if (!row) return { settings: null };
    return {
      settings: {
        company_id: row.company_id,
        country_code: row.country_code,
        weekend_days: (row.weekend_days as number[]) ?? [0, 6],
        auto_import_enabled: row.auto_import_enabled,
        last_synced_year: row.last_synced_year,
      },
    };
  });

const UpdateSettingsSchema = z.object({
  company_id: z.string().uuid(),
  country_code: z.string().min(2).max(3).optional().or(z.literal("")),
  weekend_days: z.array(z.number().int().min(0).max(6)).optional(),
  auto_import_enabled: z.boolean().optional(),
});

export const updateCompanyHolidaySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateSettingsSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const payload: Record<string, unknown> = { company_id: data.company_id };
    if (data.country_code !== undefined)
      payload.country_code = data.country_code || null;
    if (data.weekend_days !== undefined) payload.weekend_days = data.weekend_days;
    if (data.auto_import_enabled !== undefined)
      payload.auto_import_enabled = data.auto_import_enabled;
    const { error } = await supabase
      .from("company_holiday_settings")
      .upsert(payload, { onConflict: "company_id" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Bulk import (CSV rows)
// ============================================================

const CsvRowSchema = z.object({
  name: z.string().trim().min(1).max(160),
  holiday_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(HOLIDAY_TYPES).default("company"),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  is_paid: z.boolean().default(true),
});

const BulkImportSchema = z.object({
  company_id: z.string().uuid(),
  rows: z.array(CsvRowSchema).min(1).max(500),
});

export const bulkImportHolidays = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BulkImportSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const rows = data.rows.map((r) => ({
      company_id: data.company_id,
      name: r.name,
      holiday_date: r.holiday_date,
      type: r.type,
      region: r.region || null,
      is_paid: r.is_paid,
      is_optional: r.type === "optional",
    }));
    const { error } = await supabase.from("holidays").insert(rows);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, inserted: rows.length };
  });

// ============================================================
// Long weekends / upcoming
// ============================================================

const RangeSchema = z.object({
  company_id: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
});

export const getLongWeekends = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RangeSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: holidays } = await supabase
      .from("holidays")
      .select("name, holiday_date")
      .eq("company_id", data.company_id)
      .eq("year", data.year)
      .order("holiday_date");

    const { data: settings } = await supabase
      .from("company_holiday_settings")
      .select("weekend_days")
      .eq("company_id", data.company_id)
      .maybeSingle();
    const weekendDays = new Set<number>(
      (settings?.weekend_days as number[]) ?? [0, 6],
    );

    type Group = { start: string; end: string; days: number; names: string[] };
    const groups: Group[] = [];

    const dateAddDays = (iso: string, n: number) => {
      const d = new Date(iso + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + n);
      return d.toISOString().slice(0, 10);
    };
    const dayOfWeek = (iso: string) =>
      new Date(iso + "T00:00:00Z").getUTCDay();

    for (const h of holidays ?? []) {
      // Look at day before/after; if neighbouring weekend exists, expand a window.
      let start = h.holiday_date;
      let end = h.holiday_date;
      const names = [h.name];

      // Walk backwards across weekends
      while (weekendDays.has(dayOfWeek(dateAddDays(start, -1)))) {
        start = dateAddDays(start, -1);
      }
      // Walk forward across weekends
      while (weekendDays.has(dayOfWeek(dateAddDays(end, 1)))) {
        end = dateAddDays(end, 1);
      }

      const days =
        Math.round(
          (new Date(end + "T00:00:00Z").getTime() -
            new Date(start + "T00:00:00Z").getTime()) /
            86400000,
        ) + 1;

      if (days >= 3) groups.push({ start, end, days, names });
    }

    // Dedupe overlapping windows
    const dedup: Group[] = [];
    for (const g of groups) {
      const last = dedup[dedup.length - 1];
      if (last && g.start <= last.end) {
        last.end = g.end > last.end ? g.end : last.end;
        last.days =
          Math.round(
            (new Date(last.end + "T00:00:00Z").getTime() -
              new Date(last.start + "T00:00:00Z").getTime()) /
              86400000,
          ) + 1;
        last.names.push(...g.names);
      } else dedup.push(g);
    }

    return { weekends: dedup };
  });

export const getUpcomingHolidays = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        company_id: z.string().uuid(),
        days: z.number().int().min(1).max(365).default(30),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const today = new Date().toISOString().slice(0, 10);
    const until = new Date(Date.now() + data.days * 86400000)
      .toISOString()
      .slice(0, 10);
    const { data: rows, error } = await supabase
      .from("holidays")
      .select("id, name, holiday_date, type, is_optional")
      .eq("company_id", data.company_id)
      .gte("holiday_date", today)
      .lte("holiday_date", until)
      .order("holiday_date");
    if (error) return { holidays: [] };
    return { holidays: rows ?? [] };
  });

// ============================================================
// Date check (for attendance / leave / shift integrations)
// ============================================================

export const isHolidayOnDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        company_id: z.string().uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: row } = await supabase
      .from("holidays")
      .select("id, name, type, is_paid, is_optional")
      .eq("company_id", data.company_id)
      .eq("holiday_date", data.date)
      .maybeSingle();
    return { holiday: row ?? null };
  });
