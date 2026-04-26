import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow, GradientText } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { seo } from "@/lib/seo";
import { Check, Minus } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => seo({
    title: "Pricing — Honest, scalable plans · Punchly",
    description: "Free for up to 10 users. Paid plans from $2/user/month. Compare Free, Starter, Growth, Business and Enterprise — billed monthly or yearly. No hidden fees.",
    path: "/pricing",
  }),
  component: PricingPage,
});

const tiers = [
  { name: "Free", price: "$0", per: "Up to 10 users forever", cta: "Start free", highlight: false },
  { name: "Starter", price: "$2", per: "per user / month", cta: "Choose Starter", highlight: false },
  { name: "Growth", price: "$4", per: "per user / month", cta: "Choose Growth", highlight: true },
  { name: "Business", price: "$7", per: "per user / month", cta: "Choose Business", highlight: false },
  { name: "Enterprise", price: "Custom", per: "Volume + SLA + SSO", cta: "Talk to sales", highlight: false },
];

const matrix: { feature: string; values: (boolean | string)[] }[] = [
  { feature: "Web check-in/out", values: [true, true, true, true, true] },
  { feature: "Mobile app (iOS/Android)", values: [true, true, true, true, true] },
  { feature: "GPS attendance", values: [false, true, true, true, true] },
  { feature: "Geo-fencing", values: [false, false, true, true, true] },
  { feature: "Kiosk mode", values: [false, false, true, true, true] },
  { feature: "Smart timesheets", values: [true, true, true, true, true] },
  { feature: "Shift management", values: [false, true, true, true, true] },
  { feature: "Overtime engine", values: [false, false, true, true, true] },
  { feature: "Approvals workflow", values: [false, true, true, true, true] },
  { feature: "Real-time reports", values: ["Basic", "Standard", "Advanced", "Advanced+", "Custom"] },
  { feature: "Payroll integrations", values: [false, false, false, true, true] },
  { feature: "SSO (Google/Microsoft)", values: [false, false, false, true, true] },
  { feature: "SAML / SCIM", values: [false, false, false, false, true] },
  { feature: "Audit log", values: [false, false, true, true, true] },
  { feature: "Priority support", values: [false, false, true, true, true] },
  { feature: "Dedicated CSM", values: [false, false, false, false, true] },
  { feature: "99.99% uptime SLA", values: [false, false, false, false, true] },
];

const faqs = [
  { q: "Is there really a free plan?", a: "Yes — up to 10 users, forever, with web check-in, basic timesheets, and reports." },
  { q: "Do you charge per user?", a: "Paid plans are per active user per month, billed monthly or yearly (save 20%)." },
  { q: "Can I switch plans?", a: "Anytime. Upgrades are pro-rated, downgrades take effect on the next cycle." },
  { q: "Do you offer non-profit / education discounts?", a: "Yes, contact sales for a 30% discount." },
];

function PricingPage() {
  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-10 pt-12 sm:pt-16 lg:pt-24">
        <Container className="text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Simple, <GradientText>scalable pricing</GradientText>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Start free, scale as you grow. No setup fees. Cancel anytime.
          </p>
        </Container>
      </Section>

      <Section className="pt-4">
        <Container>
          <div className="grid gap-4 lg:grid-cols-5">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`relative rounded-2xl border bg-card p-6 shadow-soft ${
                  t.highlight ? "border-primary shadow-elegant ring-1 ring-primary" : "border-border"
                }`}
              >
                {t.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tabular">{t.price}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t.per}</p>
                <Button
                  asChild
                  className={`mt-6 w-full ${t.highlight ? "bg-gradient-brand text-primary-foreground" : ""}`}
                  variant={t.highlight ? "default" : "outline"}
                >
                  <Link to="/demo">{t.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-card/30">
        <Container>
          <h2 className="text-2xl font-bold tracking-tight">Compare plans</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="px-4 py-3 font-semibold">Feature</th>
                  {tiers.map((t) => (
                    <th key={t.name} className="px-4 py-3 text-center font-semibold">{t.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={row.feature} className={i % 2 ? "bg-background" : ""}>
                    <td className="px-4 py-3 font-medium">{row.feature}</td>
                    {row.values.map((v, j) => (
                      <td key={j} className="px-4 py-3 text-center">
                        {v === true ? (
                          <Check className="mx-auto h-4 w-4 text-success" />
                        ) : v === false ? (
                          <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" />
                        ) : (
                          <span className="text-muted-foreground">{v as string}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      <Section>
        <Container size="narrow">
          <h2 className="text-2xl font-bold tracking-tight">Pricing FAQ</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
            {faqs.map((f) => (
              <details key={f.q} className="group p-6">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBanner />
    </MarketingLayout>
  );
}
