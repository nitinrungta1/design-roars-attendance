import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import {
  HomeHero,
  TrustBar,
  BenefitsGrid,
  ProductShowcase,
  IndustriesStrip,
  Testimonials,
  PricingTeaser,
  CtaBanner,
} from "@/components/home/sections";
import { seo, PUNCHLY_SOFTWARE_JSON_LD } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => {
    const base = seo({
      title: "Smart attendance & workforce software",
      description:
        "Punchly by Oqlio — track attendance, shifts, timesheets, overtime, and GPS check-ins from anywhere. Built for teams of 5 to 50,000.",
      path: "/",
      kind: "product",
      fullTitle: "Punchly by Oqlio — The smartest attendance software for modern teams",
    });
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(PUNCHLY_SOFTWARE_JSON_LD),
        },
      ],
    };
  },
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingLayout>
      <HomeHero />
      <TrustBar />
      <BenefitsGrid />
      <ProductShowcase />
      <IndustriesStrip />
      <Testimonials />
      <PricingTeaser />
      <CtaBanner />
    </MarketingLayout>
  );
}
