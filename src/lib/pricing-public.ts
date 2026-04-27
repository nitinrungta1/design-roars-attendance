/**
 * Public marketing pricing helpers — used by the unauthenticated /pricing page.
 * Reads use the browser supabase client (anon key) and rely on the public RLS
 * policy on `plans` (active + public) and the insert-only policy on
 * `pricing_events`.
 */
import { supabase } from "@/integrations/supabase/client";

export interface PublicPlan {
  id: string;
  code: string;
  name: string;
  tier: "free" | "starter" | "growth" | "business" | "enterprise";
  tagline: string | null;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  employee_limit: number | null;
  trial_days: number;
  features: string[];
  popular: boolean;
  cta_label: string | null;
  comparison: Record<string, string | boolean | number>;
  sort_order: number;
}

const FALLBACK_PLANS: PublicPlan[] = [
  {
    id: "fallback-free",
    code: "free",
    name: "Free",
    tier: "free",
    tagline: "For tiny teams just starting out.",
    description: null,
    price_monthly: 0,
    price_yearly: 0,
    currency: "INR",
    employee_limit: 5,
    trial_days: 0,
    features: ["Mobile check-in", "Basic reports", "1 admin"],
    popular: false,
    cta_label: "Start Free",
    comparison: {},
    sort_order: 10,
  },
];

export async function listPublicPlans(): Promise<PublicPlan[]> {
  const { data, error } = await supabase
    .from("plans")
    .select(
      "id, code, name, tier, description, price_monthly, price_yearly, currency, employee_limit, trial_days, features, popular, cta_label, tagline, comparison, sort_order, is_active, is_public",
    )
    .eq("is_active", true)
    .eq("is_public", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.error("listPublicPlans", error);
    return FALLBACK_PLANS;
  }

  return data.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    tier: p.tier as PublicPlan["tier"],
    tagline: (p as { tagline: string | null }).tagline ?? null,
    description: p.description,
    price_monthly: Number(p.price_monthly),
    price_yearly: Number(p.price_yearly),
    currency: p.currency,
    employee_limit: p.employee_limit,
    trial_days: p.trial_days,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    popular: Boolean((p as { popular?: boolean }).popular),
    cta_label: (p as { cta_label: string | null }).cta_label ?? null,
    comparison:
      ((p as { comparison: unknown }).comparison &&
      typeof (p as { comparison: unknown }).comparison === "object"
        ? ((p as { comparison: Record<string, string | boolean | number> })
            .comparison)
        : {}) as Record<string, string | boolean | number>,
    sort_order: p.sort_order,
  }));
}

export type PricingEventType =
  | "view"
  | "toggle"
  | "cta_click"
  | "compare_open"
  | "plan_hover";

export interface PricingEventPayload {
  event_type: PricingEventType;
  plan_code?: string | null;
  cycle?: "monthly" | "yearly" | null;
  currency?: string | null;
  metadata?: Record<string, unknown>;
}

const SESSION_KEY = "oqlio.pricing.session";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** Fire-and-forget. Never throws — failures must not break the UI. */
export function trackPricingEvent(payload: PricingEventPayload): void {
  if (typeof window === "undefined") return;
  try {
    void supabase.from("pricing_events").insert({
      event_type: payload.event_type,
      plan_code: payload.plan_code ?? null,
      cycle: payload.cycle ?? null,
      currency: payload.currency ?? null,
      metadata: payload.metadata ?? {},
      user_agent: navigator.userAgent.slice(0, 500),
      referrer: document.referrer.slice(0, 500) || null,
      session_id: getSessionId(),
    });
  } catch (err) {
    // swallow
    console.warn("trackPricingEvent failed", err);
  }
}
