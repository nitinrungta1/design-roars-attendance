import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { SeoLandingTemplate } from "@/components/marketing/seo-landing-template";
import { resolveServiceIndustry, seoHeadFor } from "@/lib/seo/resolve";

export const Route = createFileRoute("/$service-for-$industry")({
  loader: ({ params }) => resolveServiceIndustry(params.service, params.industry),
  head: ({ loaderData }) => (loaderData ? seoHeadFor(loaderData) : { meta: [{ title: "Not found" }] }),
  component: Page,
});

function Page() {
  const d = Route.useLoaderData();
  return (
    <MarketingLayout>
      <SeoLandingTemplate
        eyebrow={`${d.serviceName} · ${d.industryName}`}
        h1={d.h1}
        heroIntro={d.heroIntro}
        ctaText={d.ctaText}
        intro={d.intro}
        serviceSlug={d.serviceSlug}
        serviceName={d.serviceName}
        industryName={d.industryName}
        industrySlug={d.industrySlug}
        painPoints={d.painPoints}
        useCases={d.useCases}
        faqs={d.faqs}
        testimonials={d.testimonials}
        siblingIndustries={d.siblingIndustries}
        bodyHtml={d.bodyHtml}
      />
    </MarketingLayout>
  );
}
