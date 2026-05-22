import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section } from "@/components/brand/primitives";
import { seo } from "@/lib/seo";
import { getPublicPage, type CmsPageDetail } from "@/lib/cms.functions";
import { resolveServiceIndustry, seoHeadFor, type ResolvedSeoPage } from "@/lib/seo/resolve";
import { SeoLandingTemplate } from "@/components/marketing/seo-landing-template";

type LoaderData = { kind: "cms"; page: CmsPageDetail } | { kind: "seo"; page: ResolvedSeoPage };

export const Route = createFileRoute("/$pageSlug")({
  loader: async ({ params }): Promise<LoaderData> => {
    const slug = params.pageSlug;
    // Try SEO service-for-industry pattern first
    const forIdx = slug.lastIndexOf("-for-");
    if (forIdx > 0) {
      const service = slug.slice(0, forIdx);
      const industry = slug.slice(forIdx + 5);
      if (service && industry) {
        try {
          const page = await resolveServiceIndustry(service, industry);
          return { kind: "seo", page };
        } catch { /* fall through */ }
      }
    }
    const { page } = await getPublicPage({ data: { slug } });
    if (!page) throw notFound();
    return { kind: "cms", page };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return seo({
        title: "Page not found",
        description: "The page you’re looking for is not available.",
        path: "/",
        kind: "company",
        noindex: true,
      });
    }
    if (loaderData.kind === "seo") return seoHeadFor(loaderData.page);
    const page = loaderData.page;
    return seo({
      title: page.seo_title ?? page.title,
      description: page.seo_description ?? `${page.title} — Oqlio`,
      path: `/${page.slug}`,
      kind: "company",
      noindex: page.noindex,
    });
  },
  notFoundComponent: () => (
    <MarketingLayout>
      <Section>
        <Container className="py-24 text-center">
          <h1 className="text-3xl font-bold">Page not found</h1>
          <p className="mt-3 text-muted-foreground">
            The page you’re looking for is not available.
          </p>
          <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary">
            ← Back home
          </Link>
        </Container>
      </Section>
    </MarketingLayout>
  ),
  component: PageView,
});

function PageView() {
  const data = Route.useLoaderData();
  if (data.kind === "seo") {
    const page = data.page;
    return (
      <MarketingLayout>
        <SeoLandingTemplate
          eyebrow={`Punchly · ${page.serviceName}`}
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
  const page = data.page;
  return (
    <MarketingLayout>
      <Section>
        <Container size="narrow" className="pt-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
          <div
            className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:tracking-tight"
            dangerouslySetInnerHTML={{ __html: page.body ?? "" }}
          />
        </Container>
      </Section>
    </MarketingLayout>
  );
}
