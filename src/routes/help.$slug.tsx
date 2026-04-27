import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock, Calendar, ChevronRight } from "lucide-react";
import { HelpLayout } from "@/components/help/help-layout";
import { ArticleToc } from "@/components/help/article-toc";
import { FeedbackWidget } from "@/components/help/feedback-widget";
import { HelpSearch } from "@/components/help/help-search";
import { seo, articleJsonLd, jsonLd, HELP_URL } from "@/lib/seo";
import {
  getPublicKbArticle,
  listRelatedArticles,
  type PublicKbArticleDetail,
  type PublicKbArticleSummary,
} from "@/lib/public-help.functions";

export const Route = createFileRoute("/help/$slug")({
  loader: async ({
    params,
  }): Promise<{ article: PublicKbArticleDetail; related: PublicKbArticleSummary[] }> => {
    const { article } = await getPublicKbArticle({ data: { slug: params.slug } });
    if (!article) throw notFound();
    const { related } = await listRelatedArticles({ data: { slug: params.slug } });
    return { article, related };
  },
  head: ({ loaderData, params }) => {
    const a = loaderData?.article;
    if (!a) {
      return seo({
        title: "Article not found",
        description: "The help article you're looking for is not available.",
        path: `/help/${params?.slug ?? ""}`,
        kind: "help",
        noindex: true,
      });
    }
    const base = seo({
      title: a.seo_title ?? a.title,
      description: a.seo_description ?? a.excerpt ?? `${a.title} — Oqlio Help Centre`,
      path: `/help/${a.slug}`,
      kind: "help",
    });
    return {
      ...base,
      scripts: [
        jsonLd(
          articleJsonLd({
            title: a.title,
            description: a.seo_description ?? a.excerpt ?? a.title,
            url: `${HELP_URL}/${a.slug}`,
            datePublished: a.published_at,
            dateModified: a.updated_at,
          }),
        ),
      ],
    };
  },
  notFoundComponent: () => (
    <HelpLayout>
      <div className="container-x mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Article not found</h1>
        <p className="mt-3 text-muted-foreground">
          The help article you're looking for is not available.
        </p>
        <Link to="/help" className="mt-6 inline-block text-sm font-medium text-primary">
          ← Back to Help Centre
        </Link>
      </div>
    </HelpLayout>
  ),
  errorComponent: ({ error }) => (
    <HelpLayout>
      <div className="container-x mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/help" className="mt-6 inline-block text-sm font-medium text-primary">
          ← Back to Help Centre
        </Link>
      </div>
    </HelpLayout>
  ),
  component: KbArticleView,
});

function readingTime(text: string | null): number {
  if (!text) return 1;
  const words = text.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function KbArticleView() {
  const { article, related } = Route.useLoaderData();

  return (
    <HelpLayout>
      {/* Top search bar */}
      <div className="border-b border-border bg-card/30">
        <div className="container-x mx-auto max-w-6xl px-4 py-4">
          <HelpSearch size="md" />
        </div>
      </div>

      <div className="container-x mx-auto max-w-6xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/help" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3 w-3" />
            Help Centre
          </Link>
          {article.category && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link
                to="/help"
                search={{ category: article.category } as never}
                className="hover:text-foreground"
              >
                {article.category}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-foreground">{article.title}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1fr_220px]">
          {/* Article body */}
          <article id="article-body" className="min-w-0">
            {article.category && (
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {article.category}
              </p>
            )}
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{article.title}</h1>
            {article.excerpt && (
              <p className="mt-3 text-lg text-muted-foreground">{article.excerpt}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {readingTime(article.body)} min read
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Updated{" "}
                {new Date(article.updated_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <div
              className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:tracking-tight prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: article.body ?? "" }}
            />

            <div className="mt-12">
              <FeedbackWidget slug={article.slug} />
            </div>

            {related.length > 0 && (
              <div className="mt-12">
                <h2 className="text-lg font-semibold">Related articles</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      to="/help/$slug"
                      params={{ slug: r.slug }}
                      className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-soft"
                    >
                      <p className="text-sm font-semibold">{r.title}</p>
                      {r.excerpt && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {r.excerpt}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sticky TOC */}
          <aside className="hidden lg:block">
            <ArticleToc containerSelector="#article-body" bodyKey={article.slug} />
          </aside>
        </div>
      </div>
    </HelpLayout>
  );
}
