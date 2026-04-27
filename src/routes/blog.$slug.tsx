import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section } from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { Badge } from "@/components/ui/badge";
import { seo } from "@/lib/seo";
import { getPublicBlogPost, type BlogPostDetail } from "@/lib/cms.functions";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }): Promise<{ post: BlogPostDetail }> => {
    const { post } = await getPublicBlogPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) {
      return seo({
        title: "Post not found",
        description: "The article you’re looking for is not available.",
        path: "/blog",
        kind: "company",
        noindex: true,
      });
    }
    return seo({
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.excerpt ?? `${post.title} — Oqlio blog`,
      path: `/blog/${post.slug}`,
      kind: "company",
      image: post.cover_url ?? undefined,
    });
  },
  notFoundComponent: () => (
    <MarketingLayout>
      <Section>
        <Container className="py-24 text-center">
          <h1 className="text-3xl font-bold">Post not found</h1>
          <p className="mt-3 text-muted-foreground">
            That article isn’t available. It may have been unpublished.
          </p>
          <Link to="/blog" className="mt-6 inline-block text-sm font-medium text-primary">
            ← Back to blog
          </Link>
        </Container>
      </Section>
    </MarketingLayout>
  ),
  errorComponent: ({ error }) => (
    <MarketingLayout>
      <Section>
        <Container className="py-24 text-center">
          <h1 className="text-2xl font-bold">Couldn’t load post</h1>
          <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
          <Link to="/blog" className="mt-6 inline-block text-sm font-medium text-primary">
            ← Back to blog
          </Link>
        </Container>
      </Section>
    </MarketingLayout>
  ),
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  return (
    <MarketingLayout>
      <article>
        <Section className="bg-gradient-hero pb-8 pt-12 sm:pt-16 lg:pt-20">
          <Container size="narrow" className="text-center">
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              {post.category && (
                <Badge variant="secondary" className="uppercase tracking-wider">
                  {post.category}
                </Badge>
              )}
              {post.published_at && (
                <time dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                {post.excerpt}
              </p>
            )}
          </Container>
        </Section>

        {post.cover_url && (
          <Container size="narrow" className="-mt-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
              <img
                src={post.cover_url}
                alt={post.title}
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          </Container>
        )}

        <Section>
          <Container size="narrow">
            <div
              className="prose prose-neutral max-w-none dark:prose-invert prose-headings:tracking-tight prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: post.body ?? "" }}
            />
            {(post.tags ?? []).length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Tags
                </span>
                {post.tags.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
            <div className="mt-10 text-center">
              <Link to="/blog" className="text-sm font-medium text-primary">
                ← All articles
              </Link>
            </div>
          </Container>
        </Section>
      </article>
      <CtaBanner />
    </MarketingLayout>
  );
}
