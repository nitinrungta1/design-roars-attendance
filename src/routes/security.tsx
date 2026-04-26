import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section } from "@/components/brand/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/security")({
  head: () => seo({
    title: "Security — Punchly",
    description: "Security-first attendance software: encrypted at rest and in transit, SOC 2 controls, RBAC, audit logs.",
    path: "/security",
  }),
  component: () => (
    <MarketingLayout>
      <Section className="pt-16 lg:pt-24">
        <Container size="narrow">
          <h1 className="text-4xl font-bold tracking-tight">Security</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Punchly is built with security-first principles: encrypted at rest and in transit,
            SOC 2 Type II controls, role-based access, audit logs, and 24/7 monitoring.
          </p>
        </Container>
      </Section>
    </MarketingLayout>
  ),
});
