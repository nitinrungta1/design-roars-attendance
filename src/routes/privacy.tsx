import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section } from "@/components/brand/primitives";
import { seo } from "@/lib/seo";

const PAGES = {
  privacy: { title: "Privacy Policy", body: "We respect your privacy. We collect only what is needed to run the service. We never sell your data. You can request export or deletion at any time. Contact privacy@punchly.app." },
  terms: { title: "Terms of Service", body: "By using Punchly you agree to fair-use, no abuse, and pay-as-you-go billing terms. Full legal terms available on request to legal@punchly.app." },
  security: { title: "Security", body: "Punchly is built with security-first principles: encrypted at rest and in transit, SOC 2 Type II controls, role-based access, audit logs, and 24/7 monitoring." },
  gdpr: { title: "GDPR Compliance", body: "Punchly is GDPR-ready. We act as a data processor for our customers. DPA available on request: privacy@punchly.app." },
  "refund-policy": { title: "Refund Policy", body: "Annual plans are refundable pro-rata within the first 30 days. Monthly plans are non-refundable but can be cancelled anytime to stop future charges." },
} as const;

function makeRoute(slug: keyof typeof PAGES) {
  return createFileRoute(`/${slug}` as never)({
    head: () => seo({
      title: `${PAGES[slug].title} — Punchly`,
      description: PAGES[slug].body.slice(0, 155),
      path: `/${slug}`,
    }),
    component: () => (
      <MarketingLayout>
        <Section className="pt-16 lg:pt-24">
          <Container size="narrow">
            <h1 className="text-4xl font-bold tracking-tight">{PAGES[slug].title}</h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{PAGES[slug].body}</p>
            <p className="mt-8 text-sm text-muted-foreground">Last updated: April 2026</p>
          </Container>
        </Section>
      </MarketingLayout>
    ),
  });
}

export const Route = makeRoute("/privacy")("privacy");
