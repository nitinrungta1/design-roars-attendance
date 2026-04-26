import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section } from "@/components/brand/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/refund-policy")({
  head: () => seo({
    title: "Refund Policy — Punchly",
    description: "Annual plans are refundable pro-rata within the first 30 days.",
    path: "/refund-policy",
  }),
  component: () => (
    <MarketingLayout>
      <Section className="pt-16 lg:pt-24">
        <Container size="narrow">
          <h1 className="text-4xl font-bold tracking-tight">Refund Policy</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Annual plans are refundable pro-rata within the first 30 days. Monthly plans are
            non-refundable but can be cancelled anytime to stop future charges.
          </p>
        </Container>
      </Section>
    </MarketingLayout>
  ),
});
