import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow } from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { seo } from "@/lib/seo";
import { BookOpen, Search } from "lucide-react";
import { listPublicKbArticles } from "@/lib/public-help.functions";

export const Route = createFileRoute("/help")({
  head: () =>
    seo({
      title: "Help Center",
      description:
        "Guides, FAQs, and onboarding videos to get the most out of Punchly attendance.",
      path: "/help",
      kind: "company",
    }),
  loader: () => listPublicKbArticles({ data: {} }),
  component: HelpPage,
});

function HelpPage() {
  const { articles, categories } = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const filtered = articles.filter((a) => {
    if (cat && (a.category ?? "Other") !== cat) return false;
    if (q.trim()) {
      const t = q.toLowerCase();
      return (
        a.title.toLowerCase().includes(t) ||
        (a.excerpt ?? "").toLowerCase().includes(t)
      );
    }
    return true;
  });

  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-10 pt-12 sm:pt-16 lg:pt-20">
        <Container className="text-center">
          <Eyebrow>Help Center</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            How can we help?
          </h1>
          <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-soft">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              placeholder="Search articles, guides, videos…"
            />
          </div>
        </Container>
      </Section>

      {categories.length > 0 && (
        <Section>
          <Container>
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setCat(null)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  cat === null
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                All ({articles.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setCat(c.name)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    cat === c.name
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  {c.name} ({c.count})
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold">No matching articles</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different search or browse another category.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((a) => (
                  <Link
                    key={a.id}
                    to="/help/$slug"
                    params={{ slug: a.slug }}
                    className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-soft"
                  >
                    {a.category && (
                      <p className="text-xs font-medium uppercase tracking-wider text-primary">
                        {a.category}
                      </p>
                    )}
                    <p className="mt-2 font-semibold group-hover:text-primary">
                      {a.title}
                    </p>
                    {a.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {a.excerpt}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Container>
        </Section>
      )}

      {categories.length === 0 && (
        <Section>
          <Container>
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">Help articles coming soon</p>
              <p className="mt-1 text-sm text-muted-foreground">
                In the meantime,{" "}
                <Link to="/contact" className="text-primary underline">
                  reach out to our team
                </Link>
                .
              </p>
            </div>
          </Container>
        </Section>
      )}

      <CtaBanner />
    </MarketingLayout>
  );
}
