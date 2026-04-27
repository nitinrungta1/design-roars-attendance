import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow, GradientText } from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { Badge } from "@/components/ui/badge";
import { seo } from "@/lib/seo";
import { listPublicJobs, type JobRow, JOB_TYPES } from "@/lib/cms.functions";

const TYPE_LABEL: Record<(typeof JOB_TYPES)[number], string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const Route = createFileRoute("/careers")({
  head: () =>
    seo({
      title: "Careers",
      description:
        "Join Oqlio. We're hiring across engineering, design, sales, and customer success — fully remote, async-first.",
      path: "/careers",
      kind: "company",
    }),
  loader: async (): Promise<{ jobs: JobRow[] }> => {
    try {
      return await listPublicJobs();
    } catch {
      return { jobs: [] };
    }
  },
  component: CareersPage,
});

function CareersPage() {
  const { jobs } = Route.useLoaderData();

  const grouped = useMemo(() => {
    const map = new Map<string, JobRow[]>();
    for (const j of jobs) {
      const key = j.department ?? "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(j);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [jobs]);

  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-10 pt-12 sm:pt-16 lg:pt-20">
        <Container className="text-center">
          <Eyebrow>Careers</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Build something people <GradientText>love using daily</GradientText>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Remote-first. Async-friendly. Outcomes over hours.
          </p>
        </Container>
      </Section>
      <Section>
        <Container size="narrow">
          <h2 className="text-2xl font-bold">Open roles</h2>

          {jobs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center text-muted-foreground">
              No open roles right now. Follow us — new positions open often.
            </div>
          ) : (
            <div className="mt-8 space-y-10">
              {grouped.map(([dept, roles]) => (
                <div key={dept}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {dept}
                  </h3>
                  <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
                    {roles.map((r) => (
                      <Link
                        key={r.slug}
                        to="/careers/$slug"
                        params={{ slug: r.slug }}
                        className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold">{r.title}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {r.location && <span>{r.location}</span>}
                            <Badge variant="outline" className="text-[10px]">
                              {TYPE_LABEL[r.employment_type] ?? r.employment_type}
                            </Badge>
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium text-primary">Apply →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </Section>
      <CtaBanner />
    </MarketingLayout>
  );
}
