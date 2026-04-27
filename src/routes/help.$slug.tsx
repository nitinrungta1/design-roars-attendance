import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { seo } from "@/lib/seo";
import {
  getPublicKbArticle,
  voteKbArticle,
  type PublicKbArticleDetail,
} from "@/lib/public-help.functions";

export const Route = createFileRoute("/help/$slug")({
  loader: async ({ params }): Promise<{ article: PublicKbArticleDetail }> => {
    const { article } = await getPublicKbArticle({ data: { slug: params.slug } });
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    if (!a) {
      return seo({
        title: "Article not found",
        description: "The help article you're looking for is not available.",
        path: "/help",
        kind: "company",
        noindex: true,
      });
    }
    return seo({
      title: a.seo_title ?? `${a.title} — Help`,
      description: a.seo_description ?? a.excerpt ?? `${a.title} — Punchly Help Center`,
      path: `/help/${a.slug}`,
      kind: "company",
    });
  },
  notFoundComponent: () => (
    <MarketingLayout>
      <Section>
        <Container className="py-24 text-center">
          <h1 className="text-3xl font-bold">Article not found</h1>
          <p className="mt-3 text-muted-foreground">
            The help article you're looking for is not available.
          </p>
          <Link
            to="/help"
            className="mt-6 inline-block text-sm font-medium text-primary"
          >
            ← Back to Help Center
          </Link>
        </Container>
      </Section>
    </MarketingLayout>
  ),
  component: KbArticleView,
});

function KbArticleView() {
  const { article } = Route.useLoaderData();
  const vote = useServerFn(voteKbArticle);
  const [voted, setVoted] = useState(false);

  const onVote = async (helpful: boolean) => {
    if (voted) return;
    setVoted(true);
    try {
      await vote({ data: { slug: article.slug, helpful } });
      toast.success(helpful ? "Thanks for the feedback!" : "Thanks — we'll improve this article.");
    } catch {
      toast.error("Could not record your vote");
    }
  };

  return (
    <MarketingLayout>
      <Section>
        <Container size="narrow" className="pt-12">
          <Link
            to="/help"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Help Center
          </Link>

          {article.category && (
            <p className="mt-6 text-xs font-medium uppercase tracking-wider text-primary">
              {article.category}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-3 text-lg text-muted-foreground">{article.excerpt}</p>
          )}

          <div
            className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:tracking-tight"
            dangerouslySetInnerHTML={{ __html: article.body ?? "" }}
          />

          <div className="mt-12 rounded-2xl border border-border bg-card p-6">
            <p className="text-sm font-semibold">Was this article helpful?</p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={voted}
                onClick={() => onVote(true)}
              >
                <ThumbsUp className="mr-2 h-4 w-4" /> Yes
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={voted}
                onClick={() => onVote(false)}
              >
                <ThumbsDown className="mr-2 h-4 w-4" /> No
              </Button>
              <Link to="/contact" className="ml-auto self-center text-sm text-primary underline">
                Still need help? Contact us →
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </MarketingLayout>
  );
}
