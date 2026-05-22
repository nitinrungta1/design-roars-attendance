import { createFileRoute, notFound } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { SeoLandingTemplate } from "@/components/marketing/seo-landing-template";
import { resolveServiceCity, resolveServiceIndustryCity, seoHeadFor, type ResolvedSeoPage } from "@/lib/seo/resolve";

// Reserved slugs that should NEVER resolve as SEO pages (avoid hijacking
// real marketing/content slugs starting with "best-").
const RESERVED = new Set<string>(["practices", "practice"]);

function parseSlug(slug: string):
  | { kind: "city"; service: string; city: string }
  | { kind: "industry-city"; service: string; industry: string; city: string }
  | null {
  if (RESERVED.has(slug)) return null;
  // best-{service}-for-{industry}-in-{city}
  const forIdx = slug.indexOf("-for-");
  const inIdx = slug.lastIndexOf("-in-");
  if (forIdx > 0 && inIdx > forIdx + 5) {
    const service = slug.slice(0, forIdx);
    const industry = slug.slice(forIdx + 5, inIdx);
    const city = slug.slice(inIdx + 4);
    if (service && industry && city) return { kind: "industry-city", service, industry, city };
  }
  // best-{service}-in-{city}
  if (inIdx > 0) {
    const service = slug.slice(0, inIdx);
    const city = slug.slice(inIdx + 4);
    if (service && city) return { kind: "city", service, city };
  }
  return null;
}

export const Route = createFileRoute("/best-{$slug}")({
  loader: async ({ params }): Promise<{ page: ResolvedSeoPage }> => {
    const parsed = parseSlug(params.slug);
    if (!parsed) throw notFound();
    const page = parsed.kind === "industry-city"
      ? await resolveServiceIndustryCity(parsed.service, parsed.industry, parsed.city)
      : await resolveServiceCity(parsed.service, parsed.city);
    return { page };
  },
  head: ({ loaderData }) => (loaderData?.page ? seoHeadFor(loaderData.page) : {}),
  notFoundComponent: () => (
    <MarketingLayout>
      <div className="container py-24 text-center">
        <h1 className="text-3xl font-bold">Page not found</h1>
      </div>
    </MarketingLayout>
  ),
  component: SeoPage,
});

function SeoPage() {
  const { page } = Route.useLoaderData();
  return (
    <MarketingLayout>
      <SeoLandingTemplate
        eyebrow={page.cityName ? `Punchly · ${page.cityName}` : `Punchly · ${page.serviceName}`}
        h1={page.h1}
        heroIntro={page.heroIntro}
        ctaText={page.ctaText}
        intro={page.intro}
        serviceSlug={page.serviceSlug}
        serviceName={page.serviceName}
        cityName={page.cityName}
        industryName={page.industryName}
        industrySlug={page.industrySlug}
        painPoints={page.painPoints}
        useCases={page.useCases}
        faqs={page.faqs}
        testimonials={page.testimonials}
        nearby={page.nearby}
        siblingIndustries={page.siblingIndustries}
        bodyHtml={page.bodyHtml}
      />
    </MarketingLayout>
  );
}
