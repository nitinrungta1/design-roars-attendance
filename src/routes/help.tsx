import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { HelpLayout } from "@/components/help/help-layout";
import { HelpSearch } from "@/components/help/help-search";
import { CategoryGrid } from "@/components/help/category-grid";
import { seo } from "@/lib/seo";
import { BookOpen, TrendingUp, ArrowRight } from "lucide-react";
import { listPublicKbArticles } from "@/lib/public-help.functions";

const SearchSchema = z.object({
  category: z.string().max(80).optional(),
  q: z.string().max(120).optional(),
});

export const Route = createFileRoute("/help")({
  validateSearch: (search) => SearchSchema.parse(search),
  head: () =>
    seo({
      title: "Help Centre",
      description:
        "Guides, tutorials and troubleshooting for Punchly attendance, time tracking and workforce management. Get answers in seconds.",
      path: "/help",
      kind: "help",
    }),
  loader: () => listPublicKbArticles({ data: {} }),
  component: HelpPage,
});

function HelpPage() {
  const { articles, categories } = Route.useLoaderData();
  const { category, q } = Route.useSearch();
  const [filterCat, setFilterCat] = useState<string | null>(category ?? null);
  const [filterQ] = useState<string>(q ?? "");

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (filterCat && (a.category ?? "Other") !== filterCat) return false;
      if (filterQ.trim()) {
        const t = filterQ.toLowerCase();
        return (
          a.title.toLowerCase().includes(t) ||
          (a.excerpt ?? "").toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [articles, filterCat, filterQ]);

  const popular = useMemo(
    () => [...articles].sort((a, b) => b.view_count - a.view_count).slice(0, 6),
    [articles],
  );

  return (
    <HelpLayout>
      {/* Hero */}
      <section className="bg-gradient-hero">
        <div className="container-x mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
            Oqlio · Help Centre
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            How can we help you?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Search guides, setup instructions, troubleshooting steps, and product tutorials.
          </p>
          <div className="mt-8 flex justify-center">
            <HelpSearch />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Popular:</span>
            {popular.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to="/help/$slug"
                params={{ slug: p.slug }}
                className="rounded-full border border-border bg-card px-2.5 py-1 hover:border-primary/40 hover:text-foreground"
              >
                {p.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-b border-border">
          <div className="container-x mx-auto max-w-6xl px-4 py-12">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Browse by category</h2>
              <button
                onClick={() => setFilterCat(null)}
                className={`text-sm ${filterCat ? "text-primary underline" : "text-muted-foreground"}`}
              >
                {filterCat ? "Clear filter" : "All categories"}
              </button>
            </div>
            <CategoryGrid categories={categories} />
          </div>
        </section>
      )}

      {/* Popular */}
      {popular.length > 0 && (
        <section className="border-b border-border">
          <div className="container-x mx-auto max-w-6xl px-4 py-12">
            <div className="mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Popular articles</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((a) => (
                <Link
                  key={a.id}
                  to="/help/$slug"
                  params={{ slug: a.slug }}
                  className="group rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-soft"
                >
                  {a.category && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {a.category}
                    </p>
                  )}
                  <p className="mt-1 font-semibold group-hover:text-primary">{a.title}</p>
                  {a.excerpt && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                  )}
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    Read article <ArrowRight className="h-3 w-3" />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All / filtered list */}
      <section>
        <div className="container-x mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              {filterCat ? filterCat : "All articles"}
            </h2>
            <p className="text-sm text-muted-foreground">{filtered.length} articles</p>
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No matching articles</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different search or{" "}
                <Link to="/contact" className="text-primary underline">
                  contact support
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a) => (
                <Link
                  key={a.id}
                  to="/help/$slug"
                  params={{ slug: a.slug }}
                  className="group rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-soft"
                >
                  {a.category && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {a.category}
                    </p>
                  )}
                  <p className="mt-1 font-semibold group-hover:text-primary">{a.title}</p>
                  {a.excerpt && (
                    <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{a.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </HelpLayout>
  );
}
