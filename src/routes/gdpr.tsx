import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section } from "@/components/brand/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/gdpr")({
  head: () => seo({
    title: "GDPR Compliance",
    description: "Oqlio is GDPR-ready. We act as a data processor for our customers.",
    path: "/gdpr",
    kind: "company",
  }),
  component: () => (
    <MarketingLayout>
      <Section className="pt-16 lg:pt-24">
        <Container size="narrow">
          <h1 className="text-4xl font-bold tracking-tight">GDPR Compliance</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Punchly is GDPR-ready. We act as a data processor for our customers.
            DPA available on request: privacy@oqlio.com.
          </p>
        </Container>
      </Section>
    </MarketingLayout>
  ),
});
