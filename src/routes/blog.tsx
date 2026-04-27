import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow } from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { seo } from "@/lib/seo";
import { listPublicBlogPosts, type BlogPostRow } from "@/lib/cms.functions";

export const Route = createFileRoute("/blog")({
  head: () =>
    seo({
      title: "Blog",
      description:
        "Guides, playbooks, and templates on attendance tracking, time management, hybrid work, payroll, and HR operations.",
      path: "/blog",
      kind: "company",
    }),
  loader: async (): Promise<{ posts: BlogPostRow[] }> => {
    try {
      return await listPublicBlogPosts();
    } catch {
      return { posts: [] };
    }
  },
  component: BlogIndex,
});

function BlogIndex() {
  const { posts } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of posts) if (p.category) set.add(p.category);
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (!needle) return true;
      return (
        p.title.toLowerCase().includes(needle) ||
        (p.excerpt ?? "").toLowerCase().includes(needle) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(needle))
      );
    });
  }, [posts, q, cat]);

  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-10 pt-12 sm:pt-16 lg:pt-20">
        <Container className="text-center">
          <Eyebrow>Blog</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Workforce insights
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Practical guides for HR, ops and finance teams.
          </p>
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="search"
              placeholder="Search posts..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="sm:max-w-sm"
            />
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCat(null)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    cat === null
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      cat === c
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center text-muted-foreground">
              {posts.length === 0
                ? "No posts published yet. Check back soon."
                : "No posts match your search."}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {filtered.map((p) => (
                <Link
                  key={p.slug}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-elegant"
                >
                  {p.cover_url && (
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      <img
                        src={p.cover_url}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {p.category && (
                        <Badge variant="secondary" className="uppercase tracking-wider">
                          {p.category}
                        </Badge>
                      )}
                      {p.published_at && (
                        <time dateTime={p.published_at}>
                          {new Date(p.published_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </time>
                      )}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold tracking-tight group-hover:text-primary">
                      {p.title}
                    </h2>
                    {p.excerpt && (
                      <p className="mt-2 line-clamp-3 text-muted-foreground">{p.excerpt}</p>
                    )}
                    <p className="mt-4 text-sm font-medium text-primary">Read more →</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </Section>
      <CtaBanner />
    </MarketingLayout>
  );
}
