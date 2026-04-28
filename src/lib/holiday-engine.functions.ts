import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "@/integrations/supabase/permission-middleware";

// ===== Types =====
export const SCOPE_LEVELS = ["global", "country", "region", "office", "employee"] as const;
export type ScopeLevel = (typeof SCOPE_LEVELS)[number];

export interface HolidayPolicy {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  country_code: string | null;
  region: string | null;
  office_location_id: string | null;
  weekend_days: number[];
  floating_quota: number;
  is_default: boolean;
}

export interface PolicyHoliday {
  id: string;
  policy_id: string;
  name: string;
  holiday_date: string;
  type: string;
  is_paid: boolean;
  is_optional: boolean;
  is_recurring: boolean;
  region: string | null;
  year: number;
}

export interface HolidayAssignment {
  id: string;
  company_id: string;
  policy_id: string;
  policy_name: string;
  scope_level: ScopeLevel;
  employee_id: string | null;
  employee_name: string | null;
  department_id: string | null;
  location_id: string | null;
  country_code: string | null;
  region: string | null;
  priority: number;
  created_at: string;
}

export interface ResolvedHoliday {
  holiday_date: string;
  name: string;
  type: string;
  scope_level: ScopeLevel;
  is_paid: boolean;
  is_optional: boolean;
  source: string;
}

// ===== Policies =====
export const listHolidayPolicies = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.policies.read")])
  .inputValidator((i: unknown) =>
    z.object({ company_id: z.string().uuid().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data }): Promise<{ policies: HolidayPolicy[] }> => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    let q = supabase
      .from("holiday_policies")
      .select(
        "id, company_id, name, description, country_code, region, office_location_id, weekend_days, floating_quota, is_default",
      )
      .order("name");
    if (data.company_id) q = q.eq("company_id", data.company_id);
    const { data: rows, error } = await q;
    if (error) {
      console.error("listHolidayPolicies", error);
      return { policies: [] };
    }
    return {
      policies: (rows ?? []).map((r) => ({
        ...r,
        weekend_days: (r.weekend_days as number[]) ?? [0, 6],
      })) as HolidayPolicy[],
    };
  });

const PolicyFormSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  country_code: z.string().min(2).max(3).optional().or(z.literal("")),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  office_location_id: z.string().uuid().optional().or(z.literal("")),
  weekend_days: z.array(z.number().int().min(0).max(6)).default([0, 6]),
  floating_quota: z.number().int().min(0).max(30).default(0),
  is_default: z.boolean().default(false),
});

export const createHolidayPolicy = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.policies.write")])
  .inputValidator((i: unknown) => PolicyFormSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { error } = await supabase.from("holiday_policies").insert({
      company_id: data.company_id,
      name: data.name,
      description: data.description || null,
      country_code: data.country_code || null,
      region: data.region || null,
      office_location_id: data.office_location_id || null,
      weekend_days: data.weekend_days,
      floating_quota: data.floating_quota,
      is_default: data.is_default,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const updateHolidayPolicy = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.policies.write")])
  .inputValidator((i: unknown) =>
    PolicyFormSchema.partial().extend({ id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { id, ...rest } = data;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v === "" && (k === "description" || k === "country_code" || k === "region" || k === "office_location_id"))
        patch[k] = null;
      else if (v !== undefined) patch[k] = v;
    }
    const { error } = await supabase
      .from("holiday_policies")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("id", id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteHolidayPolicy = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.policies.write")])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { error } = await supabase.from("holiday_policies").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const clonePolicy = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.policies.write")])
  .inputValidator((i: unknown) =>
    z.object({ policy_id: z.string().uuid(), name: z.string().trim().min(1).max(160) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { data: src, error } = await supabase
      .from("holiday_policies")
      .select("*")
      .eq("id", data.policy_id)
      .single();
    if (error || !src) return { ok: false as const, error: error?.message ?? "Not found" };
    const { data: created, error: cErr } = await supabase
      .from("holiday_policies")
      .insert({
        company_id: src.company_id,
        name: data.name,
        description: src.description,
        country_code: src.country_code,
        region: src.region,
        office_location_id: src.office_location_id,
        weekend_days: src.weekend_days,
        floating_quota: src.floating_quota,
        is_default: false,
      })
      .select("id")
      .single();
    if (cErr || !created) return { ok: false as const, error: cErr?.message ?? "Failed" };
    const { data: hols } = await supabase
      .from("holiday_policy_holidays")
      .select("name, holiday_date, type, is_paid, is_optional, is_recurring, region, source_template_id")
      .eq("policy_id", data.policy_id);
    if (hols && hols.length > 0) {
      await supabase
        .from("holiday_policy_holidays")
        .insert(hols.map((h) => ({ ...h, policy_id: created.id })));
    }
    return { ok: true as const, id: created.id };
  });

// ===== Policy holidays =====
export const listPolicyHolidays = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.policies.read")])
  .inputValidator((i: unknown) =>
    z.object({ policy_id: z.string().uuid(), year: z.number().int().min(2000).max(2100).optional() }).parse(i),
  )
  .handler(async ({ context, data }): Promise<{ holidays: PolicyHoliday[] }> => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    let q = supabase
      .from("holiday_policy_holidays")
      .select("id, policy_id, name, holiday_date, type, is_paid, is_optional, is_recurring, region, year")
      .eq("policy_id", data.policy_id)
      .order("holiday_date");
    if (data.year) q = q.eq("year", data.year);
    const { data: rows, error } = await q;
    if (error) return { holidays: [] };
    return { holidays: (rows ?? []) as PolicyHoliday[] };
  });

export const addPolicyHoliday = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.policies.write")])
  .inputValidator((i: unknown) =>
    z
      .object({
        policy_id: z.string().uuid(),
        name: z.string().trim().min(1).max(160),
        holiday_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        type: z
          .enum(["national", "regional", "religious", "optional", "company", "half_day"])
          .default("company"),
        is_paid: z.boolean().default(true),
        is_optional: z.boolean().default(false),
        is_recurring: z.boolean().default(false),
        region: z.string().trim().max(120).optional().or(z.literal("")),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { error } = await supabase.from("holiday_policy_holidays").insert({
      policy_id: data.policy_id,
      name: data.name,
      holiday_date: data.holiday_date,
      type: data.type,
      is_paid: data.is_paid,
      is_optional: data.is_optional,
      is_recurring: data.is_recurring,
      region: data.region || null,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const removePolicyHoliday = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.policies.write")])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { error } = await supabase.from("holiday_policy_holidays").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const importTemplateIntoPolicy = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.policies.write")])
  .inputValidator((i: unknown) =>
    z
      .object({
        policy_id: z.string().uuid(),
        country_code: z.string().min(2).max(3),
        year: z.number().int().min(2000).max(2100),
        mode: z.enum(["replace", "merge"]).default("merge"),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { data: tpls, error } = await supabase
      .from("holiday_templates")
      .select("id, name, holiday_date, type, region, is_recurring")
      .eq("country_code", data.country_code)
      .eq("year", data.year);
    if (error) return { ok: false as const, error: error.message };
    if (!tpls?.length) return { ok: false as const, error: "No templates available." };

    if (data.mode === "replace") {
      await supabase
        .from("holiday_policy_holidays")
        .delete()
        .eq("policy_id", data.policy_id)
        .eq("year", data.year);
    }
    const rows = tpls.map((t) => ({
      policy_id: data.policy_id,
      name: t.name,
      holiday_date: t.holiday_date,
      type: t.type,
      region: t.region,
      is_recurring: t.is_recurring,
      is_paid: true,
      is_optional: t.type === "optional",
      source_template_id: t.id,
    }));
    const { error: iErr } = await supabase.from("holiday_policy_holidays").insert(rows);
    if (iErr) return { ok: false as const, error: iErr.message };
    return { ok: true as const, inserted: rows.length };
  });

// ===== Assignments =====
export const listAssignments = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.policies.read")])
  .inputValidator((i: unknown) =>
    z.object({ company_id: z.string().uuid().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data }): Promise<{ assignments: HolidayAssignment[] }> => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    let q = supabase
      .from("employee_holiday_assignments")
      .select(
        "id, company_id, policy_id, scope_level, employee_id, department_id, location_id, country_code, region, priority, created_at, holiday_policies(name), employees(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.company_id) q = q.eq("company_id", data.company_id);
    const { data: rows, error } = await q;
    if (error) return { assignments: [] };
    return {
      assignments: (rows ?? []).map((r) => {
        const pol = r.holiday_policies as { name: string } | null;
        const emp = r.employees as { full_name: string } | null;
        return {
          id: r.id,
          company_id: r.company_id,
          policy_id: r.policy_id,
          policy_name: pol?.name ?? "—",
          scope_level: r.scope_level as ScopeLevel,
          employee_id: r.employee_id,
          employee_name: emp?.full_name ?? null,
          department_id: r.department_id,
          location_id: r.location_id,
          country_code: r.country_code,
          region: r.region,
          priority: r.priority,
          created_at: r.created_at,
        };
      }),
    };
  });

export const assignPolicy = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.assign")])
  .inputValidator((i: unknown) =>
    z
      .object({
        company_id: z.string().uuid(),
        policy_id: z.string().uuid(),
        scope_level: z.enum(SCOPE_LEVELS),
        employee_ids: z.array(z.string().uuid()).optional(),
        department_id: z.string().uuid().optional(),
        location_id: z.string().uuid().optional(),
        country_code: z.string().min(2).max(3).optional(),
        region: z.string().trim().max(120).optional(),
        priority: z.number().int().min(0).max(1000).default(100),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    let rows: Record<string, unknown>[] = [];
    const base = {
      company_id: data.company_id,
      policy_id: data.policy_id,
      scope_level: data.scope_level,
      priority: data.priority,
    };
    if (data.scope_level === "employee") {
      if (!data.employee_ids?.length)
        return { ok: false as const, error: "Pick at least one employee." };
      rows = data.employee_ids.map((eid) => ({ ...base, employee_id: eid }));
    } else if (data.scope_level === "office") {
      if (!data.location_id) return { ok: false as const, error: "Pick an office." };
      rows = [{ ...base, location_id: data.location_id }];
    } else if (data.scope_level === "country") {
      if (!data.country_code) return { ok: false as const, error: "Pick a country." };
      rows = [{ ...base, country_code: data.country_code }];
    } else if (data.scope_level === "region") {
      if (!data.region) return { ok: false as const, error: "Region required." };
      rows = [{ ...base, region: data.region }];
    } else {
      rows = [base];
    }
    const { error } = await supabase.from("employee_holiday_assignments").insert(rows);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, inserted: rows.length };
  });

export const unassignPolicy = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.assign")])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { error } = await supabase.from("employee_holiday_assignments").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ===== Resolver / Per-employee =====
export const listEmployeeHolidays = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ employee_id: z.string().uuid(), year: z.number().int().min(2000).max(2100) }).parse(i),
  )
  .handler(async ({ context, data }): Promise<{ holidays: ResolvedHoliday[] }> => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { data: rows, error } = await supabase.rpc("get_employee_holidays", {
      _employee_id: data.employee_id,
      _year: data.year,
    });
    if (error) {
      console.error("get_employee_holidays", error);
      return { holidays: [] };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { holidays: (rows ?? []) as any as ResolvedHoliday[] };
  });

export const addEmployeeOverride = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.write")])
  .inputValidator((i: unknown) =>
    z
      .object({
        employee_id: z.string().uuid(),
        action: z.enum(["add", "remove", "move"]),
        holiday_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        original_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        name: z.string().trim().max(160).optional(),
        reason: z.string().trim().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { error } = await supabase.from("holiday_overrides").insert({
      employee_id: data.employee_id,
      action: data.action,
      holiday_date: data.holiday_date,
      original_date: data.original_date ?? null,
      name: data.name ?? null,
      reason: data.reason ?? null,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const removeEmployeeOverride = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.write")])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { error } = await supabase.from("holiday_overrides").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ===== Floating holidays =====
export const claimFloatingHoliday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        employee_id: z.string().uuid(),
        holiday_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        name: z.string().trim().min(1).max(160),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { error } = await supabase.from("employee_floating_holidays").insert({
      employee_id: data.employee_id,
      holiday_date: data.holiday_date,
      name: data.name,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const listFloatingHolidays = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        employee_id: z.string().uuid(),
        year: z.number().int().min(2000).max(2100),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { data: rows } = await supabase
      .from("employee_floating_holidays")
      .select("id, holiday_date, name, status, year")
      .eq("employee_id", data.employee_id)
      .eq("year", data.year)
      .order("holiday_date");
    return { items: rows ?? [] };
  });

// ===== Year rollover =====
export const cloneYearForward = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.write")])
  .inputValidator((i: unknown) =>
    z
      .object({
        company_id: z.string().uuid(),
        from_year: z.number().int().min(2000).max(2100),
        to_year: z.number().int().min(2000).max(2100),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { data: src } = await supabase
      .from("holidays")
      .select("name, holiday_date, type, region, country_code, is_paid, is_recurring, is_optional, description, scope_level, office_location_id")
      .eq("company_id", data.company_id)
      .eq("year", data.from_year);
    if (!src?.length) return { ok: false as const, error: "Nothing to copy." };
    const offset = data.to_year - data.from_year;
    const rows = src.map((h) => {
      const d = new Date(h.holiday_date);
      d.setUTCFullYear(d.getUTCFullYear() + offset);
      return {
        company_id: data.company_id,
        name: h.name,
        holiday_date: d.toISOString().slice(0, 10),
        type: h.type,
        region: h.region,
        country_code: h.country_code,
        is_paid: h.is_paid,
        is_recurring: h.is_recurring,
        is_optional: h.is_optional,
        description: h.description,
        scope_level: h.scope_level,
        office_location_id: h.office_location_id,
      };
    });
    const { error } = await supabase.from("holidays").insert(rows);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, inserted: rows.length };
  });

// ===== Coverage report =====
export const holidayCoverageReport = createServerFn({ method: "POST" })
  .middleware([requirePermission("workforce.holidays.read")])
  .inputValidator((i: unknown) =>
    z.object({ company_id: z.string().uuid(), year: z.number().int().min(2000).max(2100) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { data: rows } = await supabase
      .from("holidays")
      .select("country_code, scope_level, office_location_id")
      .eq("company_id", data.company_id)
      .eq("year", data.year);
    const byCountry: Record<string, number> = {};
    const byScope: Record<string, number> = {};
    for (const r of rows ?? []) {
      const cc = r.country_code ?? "—";
      byCountry[cc] = (byCountry[cc] ?? 0) + 1;
      const s = String(r.scope_level ?? "global");
      byScope[s] = (byScope[s] ?? 0) + 1;
    }
    return { byCountry, byScope, total: rows?.length ?? 0 };
  });

// ===== Helper for offices =====
export const listOffices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ company_id: z.string().uuid().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    let q = supabase.from("work_locations").select("id, name, company_id").order("name");
    if (data.company_id) q = q.eq("company_id", data.company_id);
    const { data: rows } = await q;
    return { offices: rows ?? [] };
  });

// ===== Roster of employees for assign dialog =====
export const listEmployeeOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ company_id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context as { supabase: import("@supabase/supabase-js").SupabaseClient };
    const { data: rows } = await supabase
      .from("employees")
      .select("id, full_name, country_code, region, default_location_id")
      .eq("company_id", data.company_id)
      .order("full_name")
      .limit(1000);
    return { employees: rows ?? [] };
  });
