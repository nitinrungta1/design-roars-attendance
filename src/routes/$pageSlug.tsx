import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section } from "@/components/brand/primitives";
import { seo } from "@/lib/seo";
import { getPublicPage, type CmsPageDetail } from "@/lib/cms.functions";

export const Route = createFileRoute("/$pageSlug")({
  loader: async ({ params }): Promise<{ page: CmsPageDetail }> => {
    const { page } = await getPublicPage({ data: { slug: params.pageSlug } });
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    if (!page) {
      return seo({
        title: "Page not found",
        description: "The page you’re looking for is not available.",
        path: "/",
        kind: "company",
        noindex: true,
      });
    }
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
  component: CmsPageView,
});

function CmsPageView() {
  const { page } = Route.useLoaderData();
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
