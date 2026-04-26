import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// Companies
// ============================================================

export interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_default: boolean;
  created_at: string;
  member_count: number;
  owner_email: string | null;
}

export const listCompanies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ companies: CompanyRow[] }> => {
    const { supabase } = context;
    const { data: companies, error } = await supabase
      .from("companies")
      .select("id, name, slug, plan, is_default, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listCompanies error", error);
      return { companies: [] };
    }

    const ids = (companies ?? []).map((c) => c.id);
    if (ids.length === 0) return { companies: [] };

    const { data: members } = await supabase
      .from("company_members")
      .select("company_id, user_id, is_owner")
      .in("company_id", ids);

    const membersByCo = new Map<string, { count: number; ownerId: string | null }>();
    for (const m of members ?? []) {
      const cur = membersByCo.get(m.company_id) ?? { count: 0, ownerId: null };
      cur.count += 1;
      if (m.is_owner && !cur.ownerId) cur.ownerId = m.user_id;
      membersByCo.set(m.company_id, cur);
    }

    return {
      companies: (companies ?? []).map((c) => {
        const info = membersByCo.get(c.id);
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          plan: c.plan,
          is_default: c.is_default,
          created_at: c.created_at as string,
          member_count: info?.count ?? 0,
          owner_email: null,
        };
      }),
    };
  });

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const CreateCompanySchema = z.object({
  name: z.string().trim().min(2).max(120),
  plan: z.enum(["free", "starter", "growth", "business", "enterprise"]).default("free"),
  slug: z.string().trim().max(60).optional(),
});

export const createCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateCompanySchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const baseSlug = data.slug && data.slug.length > 0 ? slugify(data.slug) : slugify(data.name);
    const slug = baseSlug || `company-${Date.now()}`;

    const { data: row, error } = await supabase
      .from("companies")
      .insert({ name: data.name, slug, plan: data.plan })
      .select("id, name, slug, plan")
      .single();

    if (error) {
      console.error("createCompany error", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const, company: row };
  });

const UpdatePlanSchema = z.object({
  id: z.string().uuid(),
  plan: z.enum(["free", "starter", "growth", "business", "enterprise"]),
});

export const updateCompanyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdatePlanSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("companies")
      .update({ plan: data.plan })
      .eq("id", data.id);
    if (error) {
      console.error("updateCompanyPlan error", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

const DeleteCompanySchema = z.object({ id: z.string().uuid() });

export const deleteCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteCompanySchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    // Defensive: never delete the default platform company
    const { data: c } = await supabase
      .from("companies")
      .select("is_default")
      .eq("id", data.id)
      .maybeSingle();
    if (c?.is_default) {
      return { ok: false as const, error: "Cannot delete the default platform company." };
    }
    const { error } = await supabase.from("companies").delete().eq("id", data.id);
    if (error) {
      console.error("deleteCompany error", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

// ============================================================
// Accounts (people with platform roles, not company members)
// ============================================================

export interface AccountRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  company_id: string | null;
  company_name: string | null;
  roles: string[];
  created_at: string;
}

export const listAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ accounts: AccountRow[] }> => {
    const { supabase } = context;
    const [{ data: profiles }, { data: roles }, { data: companies }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, company_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("companies").select("id, name"),
    ]);

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }
    const companyById = new Map<string, string>();
    for (const c of companies ?? []) companyById.set(c.id, c.name);

    return {
      accounts: (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        company_id: p.company_id,
        company_name: p.company_id ? (companyById.get(p.company_id) ?? null) : null,
        roles: rolesByUser.get(p.id) ?? [],
        created_at: p.created_at as string,
      })),
    };
  });

// ============================================================
// Plans rollup (counts by plan tier)
// ============================================================

export interface PlanRollup {
  plan: string;
  companies: number;
  members: number;
}

export const listPlanRollup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ plans: PlanRollup[] }> => {
    const { supabase } = context;
    const [{ data: companies }, { data: members }] = await Promise.all([
      supabase.from("companies").select("id, plan"),
      supabase.from("company_members").select("company_id"),
    ]);
    const byPlan = new Map<string, PlanRollup>();
    const planByCo = new Map<string, string>();
    for (const c of companies ?? []) {
      planByCo.set(c.id, c.plan);
      const cur = byPlan.get(c.plan) ?? { plan: c.plan, companies: 0, members: 0 };
      cur.companies += 1;
      byPlan.set(c.plan, cur);
    }
    for (const m of members ?? []) {
      const plan = planByCo.get(m.company_id);
      if (!plan) continue;
      const cur = byPlan.get(plan) ?? { plan, companies: 0, members: 0 };
      cur.members += 1;
      byPlan.set(plan, cur);
    }
    const order = ["enterprise", "business", "growth", "starter", "free"];
    return {
      plans: Array.from(byPlan.values()).sort(
        (a, b) => order.indexOf(a.plan) - order.indexOf(b.plan),
      ),
    };
  });

// ============================================================
// Usage metrics
// ============================================================

export interface UsageRow {
  company_id: string;
  company_name: string;
  metric_date: string;
  employees: number;
  active_users: number;
  checkins: number;
  api_calls: number;
}

export const listUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ usage: UsageRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("usage_metrics")
      .select(
        "company_id, metric_date, employees, active_users, checkins, api_calls, companies(name)",
      )
      .order("metric_date", { ascending: false })
      .limit(200);
    if (error) {
      console.error("listUsage error", error);
      return { usage: [] };
    }
    return {
      usage: (data ?? []).map((r) => {
        const co = r.companies as { name: string } | null;
        return {
          company_id: r.company_id,
          company_name: co?.name ?? "—",
          metric_date: r.metric_date as string,
          employees: r.employees,
          active_users: r.active_users,
          checkins: r.checkins,
          api_calls: r.api_calls,
        };
      }),
    };
  });
