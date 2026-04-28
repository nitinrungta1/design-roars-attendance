import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// Plans
// ============================================================

export const PLAN_TIERS = ["free", "starter", "growth", "business", "enterprise"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const SUPPORTED_CURRENCIES = ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const BILLING_MODELS = ["flat", "per_user", "hybrid"] as const;
export type BillingModel = (typeof BILLING_MODELS)[number];

export interface PlanRow {
  id: string;
  code: string;
  name: string;
  tier: PlanTier;
  description: string | null;
  tagline: string | null;
  /** Base fee per period (often 0 for pure per-user plans). */
  price_monthly: number;
  price_yearly: number;
  /** Per-seat pricing. */
  price_per_user_monthly: number;
  price_per_user_yearly: number;
  min_seats: number;
  included_seats: number;
  billing_model: BillingModel;
  currency: string;
  employee_limit: number | null;
  trial_days: number;
  features: string[];
  is_active: boolean;
  is_public: boolean;
  popular: boolean;
  cta_label: string | null;
  sort_order: number;
  /** Computed: percent saved on yearly vs monthly×12 (per-user). */
  yearly_discount_pct: number;
}

function computeYearlyDiscount(monthly: number, yearly: number): number {
  if (!monthly || monthly <= 0) return 0;
  const annualFromMonthly = monthly * 12;
  if (yearly >= annualFromMonthly || yearly <= 0) return 0;
  return Math.round(((annualFromMonthly - yearly) / annualFromMonthly) * 100);
}

const PLAN_COLUMNS =
  "id, code, name, tier, description, tagline, price_monthly, price_yearly, price_per_user_monthly, price_per_user_yearly, min_seats, included_seats, billing_model, currency, employee_limit, trial_days, features, is_active, is_public, popular, cta_label, sort_order";

interface RawPlan {
  id: string;
  code: string;
  name: string;
  tier: string;
  description: string | null;
  tagline: string | null;
  price_monthly: number | string;
  price_yearly: number | string;
  price_per_user_monthly: number | string | null;
  price_per_user_yearly: number | string | null;
  min_seats: number | null;
  included_seats: number | null;
  billing_model: string | null;
  currency: string;
  employee_limit: number | null;
  trial_days: number;
  features: unknown;
  is_active: boolean;
  is_public: boolean;
  popular: boolean | null;
  cta_label: string | null;
  sort_order: number;
}

function mapPlan(p: RawPlan): PlanRow {
  const perUserMonthly = Number(p.price_per_user_monthly ?? 0);
  const perUserYearly = Number(p.price_per_user_yearly ?? 0);
  const baseMonthly = Number(p.price_monthly ?? 0);
  const baseYearly = Number(p.price_yearly ?? 0);
  const billing = (p.billing_model ?? "per_user") as BillingModel;
  // Discount % is most meaningful on whichever price is non-zero.
  const refMonthly = perUserMonthly > 0 ? perUserMonthly : baseMonthly;
  const refYearly = perUserMonthly > 0 ? perUserYearly : baseYearly;
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    tier: p.tier as PlanTier,
    description: p.description,
    tagline: p.tagline,
    price_monthly: baseMonthly,
    price_yearly: baseYearly,
    price_per_user_monthly: perUserMonthly,
    price_per_user_yearly: perUserYearly,
    min_seats: p.min_seats ?? 1,
    included_seats: p.included_seats ?? 0,
    billing_model: BILLING_MODELS.includes(billing) ? billing : "per_user",
    currency: p.currency,
    employee_limit: p.employee_limit,
    trial_days: p.trial_days,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    is_active: p.is_active,
    is_public: p.is_public,
    popular: Boolean(p.popular),
    cta_label: p.cta_label,
    sort_order: p.sort_order,
    yearly_discount_pct: computeYearlyDiscount(refMonthly, refYearly),
  };
}

/** Throws a Response (used by middlewares) if the user can't manage billing. */
async function ensureCanManageBilling(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) {
    throw new Error(`Could not verify your permissions: ${error.message}`);
  }
  const roles = (data ?? []).map((r) => r.role as string);
  const allowed = roles.some((r) =>
    ["super_admin", "admin", "finance"].includes(r),
  );
  if (!allowed) {
    throw new Error(
      "You do not have permission to manage billing plans. Required role: super_admin, admin, or finance.",
    );
  }
}

export const listPlans = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ plans: PlanRow[] }> => {
    const { supabase, userId } = context;
    await ensureCanManageBilling(supabase, userId);
    // Use service-role client for the read so transient RLS edge cases for
    // trusted staff never produce a misleading empty list.
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("plans")
      .select(PLAN_COLUMNS)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("listPlans", error);
      throw new Error(`Failed to load plans: ${error.message}`);
    }
    return { plans: (data ?? []).map((p) => mapPlan(p as unknown as RawPlan)) };
  });

const PlanWriteFields = {
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  tagline: z.string().max(200).optional(),
  price_monthly: z.number().min(0).max(10_000_000).optional(),
  price_yearly: z.number().min(0).max(100_000_000).optional(),
  price_per_user_monthly: z.number().min(0).max(1_000_000).optional(),
  price_per_user_yearly: z.number().min(0).max(10_000_000).optional(),
  min_seats: z.number().int().min(1).max(100_000).optional(),
  included_seats: z.number().int().min(0).max(100_000).optional(),
  billing_model: z.enum(BILLING_MODELS).optional(),
  trial_days: z.number().int().min(0).max(365).optional(),
  employee_limit: z.number().int().min(0).max(1_000_000).nullable().optional(),
  is_active: z.boolean().optional(),
  is_public: z.boolean().optional(),
  popular: z.boolean().optional(),
  cta_label: z.string().max(60).optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  features: z.array(z.string().trim().min(1).max(200)).max(40).optional(),
  /** Convenience for callers: derive yearly per-user price from discount %. */
  yearly_discount_pct: z.number().min(0).max(95).optional(),
} as const;

const UpdatePlanSchema = z.object({
  id: z.string().uuid(),
  ...PlanWriteFields,
});

function buildPatch(data: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const copy = (k: string) => {
    if (data[k] !== undefined) patch[k] = data[k];
  };
  [
    "name",
    "description",
    "tagline",
    "price_monthly",
    "price_yearly",
    "price_per_user_monthly",
    "price_per_user_yearly",
    "min_seats",
    "included_seats",
    "billing_model",
    "trial_days",
    "employee_limit",
    "is_active",
    "is_public",
    "popular",
    "cta_label",
    "currency",
    "features",
  ].forEach(copy);

  // Auto-derive yearly per-user from monthly per-user + discount %
  const discount = data.yearly_discount_pct;
  const monthlyPU = data.price_per_user_monthly;
  if (
    typeof discount === "number" &&
    typeof monthlyPU === "number" &&
    typeof data.price_per_user_yearly !== "number"
  ) {
    patch.price_per_user_yearly = Math.round(
      monthlyPU * 12 * (1 - discount / 100),
    );
  }
  // Same for flat base fee
  const monthlyBase = data.price_monthly;
  if (
    typeof discount === "number" &&
    typeof monthlyBase === "number" &&
    typeof data.price_yearly !== "number" &&
    !(typeof monthlyPU === "number" && monthlyPU > 0)
  ) {
    patch.price_yearly = Math.round(monthlyBase * 12 * (1 - discount / 100));
  }
  return patch;
}

export const updatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdatePlanSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    try {
      await ensureCanManageBilling(supabase, userId);
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "Permission denied",
      };
    }
    const patch = buildPatch(data as Record<string, unknown>);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("plans")
      .update(patch as never)
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const { name: _omitName, currency: _omitCurrency, ...PlanWriteFieldsForCreate } = PlanWriteFields;
void _omitName;
void _omitCurrency;

const CreatePlanSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_-]+$/i, "Use letters, numbers, _ or -")
    .transform((v) => v.toLowerCase()),
  name: z.string().trim().min(1).max(120),
  tier: z.enum(PLAN_TIERS).default("starter"),
  currency: z.enum(SUPPORTED_CURRENCIES).default("INR"),
  ...PlanWriteFieldsForCreate,
});

export const createPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreatePlanSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    try {
      await ensureCanManageBilling(supabase, userId);
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "Permission denied",
      };
    }
    const patch = buildPatch(data as Record<string, unknown>);
    const insert = {
      code: data.code,
      name: data.name,
      tier: data.tier,
      currency: data.currency,
      ...patch,
    };
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: row, error } = await supabaseAdmin
      .from("plans")
      .insert(insert as never)
      .select("id")
      .single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, id: (row as { id: string }).id };
  });

const DeletePlanSchema = z.object({ id: z.string().uuid() });
export const deletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeletePlanSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    try {
      await ensureCanManageBilling(supabase, userId);
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "Permission denied",
      };
    }
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("plans")
      .delete()
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
