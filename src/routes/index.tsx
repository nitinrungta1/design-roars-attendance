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
import { seo, SITE_NAME, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => {
    const base = seo({
      title: "Punchly — Smart Attendance & Workforce Management Software",
      description:
        "Track attendance, shifts, timesheets, overtime, and GPS check-ins from anywhere. The smartest attendance software for modern teams of 5 to 50,000.",
      path: "/",
    });
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: SITE_NAME,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web, iOS, Android",
            url: SITE_URL,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "1284",
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/logo.png`,
          }),
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
