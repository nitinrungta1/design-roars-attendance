import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Minus, Sparkles, ShieldCheck, RefreshCcw, Zap, Users, HelpCircle } from "lucide-react";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import {
  Container,
  Section,
  Eyebrow,
  GradientText,
} from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { CurrencySwitcher } from "@/components/brand/currency-switcher";
import { useCurrency, formatCurrency } from "@/lib/currency";
import { seo } from "@/lib/seo";
import { listPublicPlans, trackPricingEvent, type PublicPlan } from "@/lib/pricing-public";
import type { Currency } from "@/lib/fx.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () =>
    seo({
      title: "Pricing — Punchly",
      description:
        "Simple, scalable pricing for Punchly. Free plan up to 5 users. Save 20% with yearly billing. Compare Free, Starter, Growth, Business and Enterprise plans.",
      path: "/pricing",
      kind: "product",
    }),
  component: PricingPage,
});

type Cycle = "monthly" | "yearly";

const COMPARISON_ROWS: { key: string; label: string; tip?: string }[] = [
  { key: "users", label: "Users included" },
  { key: "attendance", label: "Attendance tracking" },
  { key: "gps", label: "GPS check-in", tip: "Geo-fenced check-in/out from the mobile app" },
  { key: "timesheets", label: "Timesheets" },
  { key: "shifts", label: "Shift scheduling" },
  { key: "overtime", label: "Overtime rules" },
  { key: "reports", label: "Reports" },
  { key: "api", label: "API access" },
  { key: "branding", label: "Custom branding" },
  { key: "support", label: "Priority support" },
  { key: "multilocation", label: "Multi-location" },
  { key: "permissions", label: "Advanced permissions" },
  { key: "payroll", label: "Payroll integrations" },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrades take effect immediately and are pro-rated. Downgrades apply on the next billing cycle. No contracts, no fees.",
  },
  {
    q: "Is annual billing charged upfront?",
    a: "Yes — annual plans are billed once for the year and unlock a 20% discount versus monthly. You always get a clear invoice with applicable taxes.",
  },
  {
    q: "Is there a free trial on paid plans?",
    a: "Every paid plan starts with a 14-day free trial — no credit card required. Enterprise trials are scoped during onboarding.",
  },
  {
    q: "What's your refund policy?",
    a: "Cancel anytime. Monthly plans aren't refunded for the current month. For annual plans we refund the unused, full months on request within the first 30 days.",
  },
  {
    q: "Can I add more users later?",
    a: "Absolutely. You can add seats anytime from the admin dashboard. Charges are pro-rated to the day.",
  },
  {
    q: "Is a GST invoice available?",
    a: "Yes. Tax-compliant GST invoices (India) and EU VAT invoices are auto-generated for every payment and emailed to your billing contact.",
  },
];

const TRUST_ITEMS: { icon: typeof ShieldCheck; label: string }[] = [
  { icon: ShieldCheck, label: "No hidden charges" },
  { icon: RefreshCcw, label: "Cancel anytime" },
  { icon: Zap, label: "99.9% uptime" },
  { icon: Users, label: "Free migration help" },
];

function PricingPage() {
  const { format, meta, currency, convert } = useCurrency();
  const [cycle, setCycle] = useState<Cycle>("yearly");

  const { data: plans, isLoading } = useQuery({
    queryKey: ["public-plans"],
    queryFn: () => listPublicPlans(),
    staleTime: 5 * 60 * 1000,
  });

  // Track first view once per session
  useEffect(() => {
    trackPricingEvent({ event_type: "view", currency, cycle });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCycleChange = (next: Cycle) => {
    if (next === cycle) return;
    setCycle(next);
    trackPricingEvent({ event_type: "toggle", cycle: next, currency });
  };

  return (
    <MarketingLayout>
      {/* HERO */}
      <Section className="bg-gradient-hero pb-8 pt-12 sm:pt-16 lg:pt-20">
        <Container className="text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Simple, <GradientText>scalable pricing</GradientText>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Start free, scale as you grow. Save 20% with annual billing.
            Trusted by growing teams across 20+ countries.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <BillingToggle cycle={cycle} onChange={handleCycleChange} />
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <span>Showing prices in</span>
              <CurrencySwitcher variant="outline" />
              <span className="hidden sm:inline">· {meta.name}</span>
            </div>
          </div>
        </Container>
      </Section>

      {/* PLAN CARDS */}
      <Section className="pt-2">
        <Container>
          {isLoading || !plans ? (
            <div className="grid gap-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[420px] animate-pulse rounded-2xl border border-border bg-card/40"
                />
              ))}
            </div>
          ) : (
            <PlanGrid
              plans={plans}
              cycle={cycle}
              displayCurrency={currency}
              convert={convert}
              format={format}
            />
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Prices auto-converted using live FX rates. Billing is always in your local currency.
          </p>
        </Container>
      </Section>

      {/* TRUST STRIP */}
      <Section className="py-8">
        <Container>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card/40 p-4 sm:grid-cols-4">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground"
              >
                <Icon className="h-4 w-4 shrink-0 text-success" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* COMPARISON TABLE */}
      <Section className="bg-card/30">
        <Container>
          <div className="text-center">
            <Eyebrow>Compare plans</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Every feature, side by side
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
              Pick what fits today — upgrade in one click when your team grows.
            </p>
          </div>

          {plans && plans.length > 0 && (
            <ComparisonTable plans={plans} />
          )}
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container size="narrow">
          <div className="text-center">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Pricing questions, answered
            </h2>
          </div>
          <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
            {FAQS.map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="flex cursor-pointer items-start justify-between gap-4 font-semibold list-none">
                  <span className="flex items-start gap-3">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f.q}
                  </span>
                  <span className="text-2xl leading-none text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pl-7 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBanner />
    </MarketingLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Billing toggle                                                      */
/* ------------------------------------------------------------------ */

function BillingToggle({ cycle, onChange }: { cycle: Cycle; onChange: (c: Cycle) => void }) {
  return (
    <div className="relative inline-flex items-center rounded-full border border-border bg-card p-1 shadow-soft">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={cn(
          "relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors",
          cycle === "monthly" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={cycle === "monthly"}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("yearly")}
        className={cn(
          "relative z-10 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors",
          cycle === "yearly" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={cycle === "yearly"}
      >
        Yearly
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            cycle === "yearly"
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-success/15 text-success",
          )}
        >
          Save 20%
        </span>
      </button>
      {/* Sliding pill */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 rounded-full bg-gradient-brand transition-all duration-300 ease-out",
          cycle === "monthly"
            ? "left-1 right-[calc(50%+2px)]"
            : "left-[calc(50%-2px)] right-1",
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Plan grid + cards                                                   */
/* ------------------------------------------------------------------ */

interface PriceConverter {
  (usdAmount: number): number;
}

function PlanGrid({
  plans,
  cycle,
  displayCurrency,
  convert,
  format,
}: {
  plans: PublicPlan[];
  cycle: Cycle;
  displayCurrency: Currency;
  convert: PriceConverter;
  format: (usd: number) => string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          cycle={cycle}
          displayCurrency={displayCurrency}
          convert={convert}
          format={format}
        />
      ))}
    </div>
  );
}

/**
 * Convert a price from the plan's native currency to the display currency.
 * Internally goes via USD using the cached FX rates.
 *
 * Example: plan_currency=INR, displayCurrency=USD, baseRates: USD->INR=83.3
 *   - amountUsd = priceInr / 83.3
 *   - then `convert(amountUsd)` gives display amount.
 */
function planAmountInUsd(amount: number, planCurrency: string): number {
  // Hard-coded fallback table — same numbers as fx.functions FALLBACK_RATES.
  // The CurrencyProvider already pulls live rates for the display side via
  // `convert(usd)`. We only need plan_currency → USD here, and a small
  // fallback table is enough since plan currencies in the DB are bounded.
  const FALLBACK: Record<string, number> = {
    USD: 1, INR: 83.3, EUR: 0.92, GBP: 0.79, AED: 3.67,
    AUD: 1.52, CAD: 1.36, SGD: 1.34,
  };
  const rate = FALLBACK[planCurrency.toUpperCase()] ?? 1;
  return amount / rate;
}

function PlanCard({
  plan,
  cycle,
  displayCurrency,
  convert,
  format,
}: {
  plan: PublicPlan;
  cycle: Cycle;
  displayCurrency: Currency;
  convert: PriceConverter;
  format: (usd: number) => string;
}) {
  const isEnterprise = plan.tier === "enterprise";
  const isFree = plan.tier === "free";

  // Compute per-month display price
  const monthlyUsd = planAmountInUsd(plan.price_monthly, plan.currency);
  // For yearly cycle: prefer yearly DB price ÷ 12 if present, else 20% off monthly
  const yearlyTotalUsd = plan.price_yearly > 0
    ? planAmountInUsd(plan.price_yearly, plan.currency)
    : monthlyUsd * 12 * 0.8;
  const yearlyPerMonthUsd = yearlyTotalUsd / 12;

  const perMonthUsd = cycle === "yearly" ? yearlyPerMonthUsd : monthlyUsd;
  const annualSavingsUsd = monthlyUsd * 12 - yearlyTotalUsd;

  const ctaLabel =
    plan.cta_label ??
    (isFree ? "Start Free" : isEnterprise ? "Talk to Sales" : "Start Free Trial");
  const ctaHref = isEnterprise ? "/contact" : isFree ? "/signup" : "/demo";

  const onCtaClick = () =>
    trackPricingEvent({
      event_type: "cta_click",
      plan_code: plan.code,
      cycle,
      currency: displayCurrency,
    });

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card p-6 shadow-soft transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-elegant",
        plan.popular
          ? "border-primary shadow-elegant ring-1 ring-primary"
          : "border-border",
      )}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-primary-foreground shadow-elegant">
          <Sparkles className="h-3 w-3" />
          Most popular
        </span>
      )}

      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        {cycle === "yearly" && !isEnterprise && !isFree && (
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
            -20%
          </span>
        )}
      </div>
      {plan.tagline && (
        <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      )}

      {/* PRICE */}
      <div className="mt-5 min-h-[88px]">
        {isEnterprise ? (
          <>
            <div className="text-3xl font-bold tabular-nums">Custom</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Volume pricing + SSO + SLA
            </p>
          </>
        ) : isFree ? (
          <>
            <div className="text-3xl font-bold tabular-nums">{format(0)}</div>
            <p className="mt-1 text-sm text-muted-foreground">Forever free</p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <AnimatedPrice usdAmount={perMonthUsd} format={format} />
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {cycle === "yearly" ? (
                <>
                  Billed annually as{" "}
                  <span className="font-medium text-foreground">
                    {format(yearlyTotalUsd)}
                  </span>
                </>
              ) : (
                "Billed monthly"
              )}
            </p>
            {cycle === "yearly" && annualSavingsUsd > 0 && (
              <p className="mt-1 text-xs font-medium text-success">
                Save {format(annualSavingsUsd)} per year
              </p>
            )}
          </>
        )}
      </div>

      <Button
        asChild
        onClick={onCtaClick}
        className={cn(
          "mt-5 w-full",
          plan.popular && "bg-gradient-brand text-primary-foreground hover:opacity-95",
        )}
        variant={plan.popular ? "default" : "outline"}
      >
        <Link to={ctaHref}>{ctaLabel}</Link>
      </Button>

      {/* Plan size hint */}
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {plan.employee_limit ? `Up to ${plan.employee_limit} users` : "Unlimited users"}
        {!isFree && plan.trial_days > 0 ? ` · ${plan.trial_days}-day free trial` : ""}
      </p>

      {/* Features */}
      <ul className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
        {plan.features.slice(0, 7).map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span className="text-muted-foreground">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Animated price                                                      */
/* ------------------------------------------------------------------ */

function AnimatedPrice({
  usdAmount,
  format,
}: {
  usdAmount: number;
  format: (usd: number) => string;
}) {
  const formatted = format(usdAmount);
  // Re-mount on value change to retrigger fade animation
  return (
    <span
      key={formatted}
      className="animate-fade-in text-4xl font-bold tabular-nums tracking-tight"
    >
      {formatted}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Comparison table                                                    */
/* ------------------------------------------------------------------ */

function ComparisonTable({ plans }: { plans: PublicPlan[] }) {
  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            <th className="sticky left-0 z-10 bg-muted/40 px-4 py-4 font-semibold backdrop-blur">
              Feature
            </th>
            {plans.map((p) => (
              <th
                key={p.id}
                className={cn(
                  "px-4 py-4 text-center font-semibold",
                  p.popular && "text-primary",
                )}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>{p.name}</span>
                  {p.popular && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary/80">
                      Popular
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <tr
              key={row.key}
              className={cn(
                "border-t border-border",
                i % 2 ? "bg-background" : "bg-card",
              )}
            >
              <td className="sticky left-0 z-10 bg-inherit px-4 py-3 font-medium">
                {row.label}
              </td>
              {plans.map((p) => {
                const v = p.comparison[row.key];
                return (
                  <td
                    key={p.id}
                    className={cn(
                      "px-4 py-3 text-center",
                      p.popular && "bg-primary/5",
                    )}
                  >
                    {renderCell(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(v: string | boolean | number | undefined) {
  if (v === true) {
    return <Check className="mx-auto h-4 w-4 text-success" aria-label="Included" />;
  }
  if (v === false || v === undefined || v === null || v === "") {
    return (
      <Minus
        className="mx-auto h-4 w-4 text-muted-foreground/40"
        aria-label="Not included"
      />
    );
  }
  return <span className="text-sm text-foreground/80">{String(v)}</span>;
}

// Re-export for tree-shaking-safe formatCurrency usage above
void formatCurrency;
