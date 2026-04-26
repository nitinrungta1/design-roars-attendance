import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section } from "@/components/brand/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => seo({
    title: "Terms of Service",
    description: "Fair-use terms for using Oqlio products including Punchly.",
    path: "/terms",
    kind: "company",
  }),
  component: () => (
    <MarketingLayout>
      <Section className="pt-16 lg:pt-24">
        <Container size="narrow">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            By using Punchly you agree to fair-use, no abuse, and pay-as-you-go billing terms.
            Full legal terms available on request to legal@punchly.app.
          </p>
          <p className="mt-8 text-sm text-muted-foreground">Last updated: April 2026</p>
        </Container>
      </Section>
    </MarketingLayout>
  ),
});
