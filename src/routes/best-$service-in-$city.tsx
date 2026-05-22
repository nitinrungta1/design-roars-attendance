import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { SeoLandingTemplate } from "@/components/marketing/seo-landing-template";
import { resolveServiceCity, seoHeadFor } from "@/lib/seo/resolve";

export const Route = createFileRoute("/best-$service-in-$city")({
  loader: ({ params }) => resolveServiceCity(params.service, params.city),
  head: ({ loaderData }) => (loaderData ? seoHeadFor(loaderData) : { meta: [{ title: "Not found" }] }),
  component: Page,
});

function Page() {
  const d = Route.useLoaderData();
  return (
    <MarketingLayout>
      <SeoLandingTemplate
        eyebrow={`${d.serviceName} · ${d.cityName}`}
        h1={d.h1}
        heroIntro={d.heroIntro}
        ctaText={d.ctaText}
        intro={d.intro}
        serviceSlug={d.serviceSlug}
        serviceName={d.serviceName}
        cityName={d.cityName}
        faqs={d.faqs}
        testimonials={d.testimonials}
        nearby={d.nearby}
        siblingIndustries={d.siblingIndustries}
        bodyHtml={d.bodyHtml}
      />
    </MarketingLayout>
  );
}
