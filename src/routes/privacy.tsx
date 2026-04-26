import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section } from "@/components/brand/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => seo({
    title: "Privacy Policy",
    description: "Oqlio respects your privacy. We collect only what is needed to run the service and never sell your data.",
    path: "/privacy",
    kind: "company",
  }),
  component: () => (
    <MarketingLayout>
      <Section className="pt-16 lg:pt-24">
        <Container size="narrow">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            We respect your privacy. We collect only what is needed to run the service. We never sell
            your data. You can request export or deletion at any time. Contact privacy@punchly.app.
          </p>
          <p className="mt-8 text-sm text-muted-foreground">Last updated: April 2026</p>
        </Container>
      </Section>
    </MarketingLayout>
  ),
});
