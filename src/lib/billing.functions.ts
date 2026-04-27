import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// Plans
// ============================================================

export const PLAN_TIERS = ["free", "starter", "growth", "business", "enterprise"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export interface PlanRow {
  id: string;
  code: string;
  name: string;
  tier: PlanTier;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  employee_limit: number | null;
  trial_days: number;
  features: string[];
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
}

export const listPlans = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ plans: PlanRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("plans")
      .select(
        "id, code, name, tier, description, price_monthly, price_yearly, currency, employee_limit, trial_days, features, is_active, is_public, sort_order",
      )
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("listPlans", error);
      return { plans: [] };
    }
    return {
      plans: (data ?? []).map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        tier: p.tier as PlanTier,
        description: p.description,
        price_monthly: Number(p.price_monthly),
        price_yearly: Number(p.price_yearly),
        currency: p.currency,
        employee_limit: p.employee_limit,
        trial_days: p.trial_days,
        features: Array.isArray(p.features) ? (p.features as string[]) : [],
        is_active: p.is_active,
        is_public: p.is_public,
        sort_order: p.sort_order,
      })),
    };
  });

const UpdatePlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  tagline: z.string().max(200).optional(),
  price_monthly: z.number().min(0).max(10_000_000).optional(),
  price_yearly: z.number().min(0).max(100_000_000).optional(),
  trial_days: z.number().int().min(0).max(365).optional(),
  employee_limit: z.number().int().min(0).max(1_000_000).nullable().optional(),
  is_active: z.boolean().optional(),
  is_public: z.boolean().optional(),
  popular: z.boolean().optional(),
  cta_label: z.string().max(60).optional(),
});

export const updatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdatePlanSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const patch: Record<string, unknown> = {};
    if (typeof data.name === "string") patch.name = data.name;
    if (typeof data.description === "string") patch.description = data.description;
    if (typeof data.tagline === "string") patch.tagline = data.tagline;
    if (typeof data.price_monthly === "number") patch.price_monthly = data.price_monthly;
    if (typeof data.price_yearly === "number") patch.price_yearly = data.price_yearly;
    if (typeof data.trial_days === "number") patch.trial_days = data.trial_days;
    if (data.employee_limit !== undefined) patch.employee_limit = data.employee_limit;
    if (typeof data.is_active === "boolean") patch.is_active = data.is_active;
    if (typeof data.is_public === "boolean") patch.is_public = data.is_public;
    if (typeof data.popular === "boolean") patch.popular = data.popular;
    if (typeof data.cta_label === "string") patch.cta_label = data.cta_label;
    const { error } = await supabase
      .from("plans")
      .update(patch as never)
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Subscriptions
// ============================================================

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "paused",
  "incomplete",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface SubscriptionRow {
  id: string;
  company_id: string;
  company_name: string;
  plan_name: string | null;
  plan_code: string | null;
  status: SubscriptionStatus;
  cycle: "monthly" | "yearly";
  trial_end: string | null;
  current_period_end: string | null;
  provider: string;
  seats: number;
  created_at: string;
}

export const listSubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ subscriptions: SubscriptionRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "id, company_id, status, cycle, trial_end, current_period_end, provider, seats, created_at, companies(name), plans(name, code)",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listSubscriptions", error);
      return { subscriptions: [] };
    }
    return {
      subscriptions: (data ?? []).map((s) => {
        const co = s.companies as { name: string } | null;
        const pl = s.plans as { name: string; code: string } | null;
        return {
          id: s.id,
          company_id: s.company_id,
          company_name: co?.name ?? "—",
          plan_name: pl?.name ?? null,
          plan_code: pl?.code ?? null,
          status: s.status as SubscriptionStatus,
          cycle: s.cycle as "monthly" | "yearly",
          trial_end: (s.trial_end as string | null) ?? null,
          current_period_end: (s.current_period_end as string | null) ?? null,
          provider: s.provider,
          seats: s.seats,
          created_at: s.created_at as string,
        };
      }),
    };
  });

const UpdateSubStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(SUBSCRIPTION_STATUSES),
});

export const updateSubscriptionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateSubStatusSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const patch: { status: SubscriptionStatus; canceled_at?: string } = {
      status: data.status,
    };
    if (data.status === "canceled") patch.canceled_at = new Date().toISOString();
    const { error } = await supabase.from("subscriptions").update(patch).eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Invoices
// ============================================================

export const INVOICE_STATUSES = ["draft", "open", "paid", "void", "uncollectible"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceRow {
  id: string;
  number: string;
  company_id: string;
  company_name: string;
  status: InvoiceStatus;
  currency: string;
  total: number;
  amount_due: number;
  amount_paid: number;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export const listInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ invoices: InvoiceRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("invoices")
      .select(
        "id, number, company_id, status, currency, total, amount_due, amount_paid, due_at, paid_at, created_at, companies(name)",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listInvoices", error);
      return { invoices: [] };
    }
    return {
      invoices: (data ?? []).map((i) => {
        const co = i.companies as { name: string } | null;
        return {
          id: i.id,
          number: i.number,
          company_id: i.company_id,
          company_name: co?.name ?? "—",
          status: i.status as InvoiceStatus,
          currency: i.currency,
          total: Number(i.total),
          amount_due: Number(i.amount_due),
          amount_paid: Number(i.amount_paid),
          due_at: (i.due_at as string | null) ?? null,
          paid_at: (i.paid_at as string | null) ?? null,
          created_at: i.created_at as string,
        };
      }),
    };
  });

// ============================================================
// Payments
// ============================================================

export interface PaymentRow {
  id: string;
  company_id: string;
  company_name: string;
  invoice_number: string | null;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  method: string | null;
  processed_at: string | null;
  created_at: string;
}

export const listPayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ payments: PaymentRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("payments")
      .select(
        "id, company_id, amount, currency, status, provider, method, processed_at, created_at, companies(name), invoices(number)",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listPayments", error);
      return { payments: [] };
    }
    return {
      payments: (data ?? []).map((p) => {
        const co = p.companies as { name: string } | null;
        const inv = p.invoices as { number: string } | null;
        return {
          id: p.id,
          company_id: p.company_id,
          company_name: co?.name ?? "—",
          invoice_number: inv?.number ?? null,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          provider: p.provider,
          method: p.method,
          processed_at: (p.processed_at as string | null) ?? null,
          created_at: p.created_at as string,
        };
      }),
    };
  });

// ============================================================
// Tax rates
// ============================================================

export interface TaxRateRow {
  id: string;
  name: string;
  rate: number;
  country: string | null;
  region: string | null;
  inclusive: boolean;
  is_active: boolean;
}

export const listTaxRates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ taxRates: TaxRateRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("tax_rates")
      .select("id, name, rate, country, region, inclusive, is_active")
      .order("country", { ascending: true });
    if (error) {
      console.error("listTaxRates", error);
      return { taxRates: [] };
    }
    return {
      taxRates: (data ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        rate: Number(t.rate),
        country: t.country,
        region: t.region,
        inclusive: t.inclusive,
        is_active: t.is_active,
      })),
    };
  });

const CreateTaxRateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  rate: z.number().min(0).max(100),
  country: z.string().trim().max(2).optional().or(z.literal("")),
  region: z.string().trim().max(40).optional().or(z.literal("")),
  inclusive: z.boolean().default(false),
});

export const createTaxRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateTaxRateSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("tax_rates").insert({
      name: data.name,
      rate: data.rate,
      country: data.country || null,
      region: data.region || null,
      inclusive: data.inclusive,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const ToggleTaxSchema = z.object({ id: z.string().uuid(), is_active: z.boolean() });
export const toggleTaxRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ToggleTaxSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("tax_rates")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Coupons
// ============================================================

export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  kind: "percent" | "fixed";
  value: number;
  currency: string | null;
  max_redemptions: number | null;
  redeemed_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export const listCoupons = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ coupons: CouponRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("coupons")
      .select(
        "id, code, description, kind, value, currency, max_redemptions, redeemed_count, starts_at, expires_at, is_active",
      )
      .order("created_at", { ascending: false });
    if (error) {
      console.error("listCoupons", error);
      return { coupons: [] };
    }
    return {
      coupons: (data ?? []).map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        kind: c.kind as "percent" | "fixed",
        value: Number(c.value),
        currency: c.currency,
        max_redemptions: c.max_redemptions,
        redeemed_count: c.redeemed_count,
        starts_at: (c.starts_at as string | null) ?? null,
        expires_at: (c.expires_at as string | null) ?? null,
        is_active: c.is_active,
      })),
    };
  });

const CreateCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/i, "Use letters, numbers, _ or -")
    .transform((v) => v.toUpperCase()),
  description: z.string().max(500).optional().or(z.literal("")),
  kind: z.enum(["percent", "fixed"]).default("percent"),
  value: z.number().min(0).max(100_000),
  max_redemptions: z.number().int().min(1).max(1_000_000).optional(),
  expires_at: z.string().datetime().optional().or(z.literal("")),
});

export const createCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateCouponSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("coupons").insert({
      code: data.code,
      description: data.description || null,
      kind: data.kind,
      value: data.value,
      max_redemptions: data.max_redemptions ?? null,
      expires_at: data.expires_at || null,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const ToggleCouponSchema = z.object({ id: z.string().uuid(), is_active: z.boolean() });
export const toggleCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ToggleCouponSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
