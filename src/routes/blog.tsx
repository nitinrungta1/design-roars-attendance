import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow } from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/blog")({
  head: () => seo({
    title: "Blog",
    description: "Guides, playbooks, and templates on attendance tracking, time management, hybrid work, payroll, and HR operations.",
    path: "/blog",
    kind: "company",
  }),
  component: BlogIndex,
});

const posts = [
  { slug: "track-employee-attendance", title: "How to track employee attendance in 2026 (the modern way)", excerpt: "A pragmatic guide to choosing between manual logs, biometrics, GPS, and modern apps.", date: "Apr 12, 2026" },
  { slug: "best-attendance-apps", title: "The 10 best attendance apps for SMBs and enterprises", excerpt: "We compared 22 apps on price, features, mobile UX, and payroll fit. Here are the best.", date: "Mar 28, 2026" },
  { slug: "overtime-calculation-guide", title: "Overtime calculation: a complete guide with formulas", excerpt: "Region-by-region rules, sample calculations, and policy templates you can copy.", date: "Mar 15, 2026" },
  { slug: "hybrid-team-attendance-policy", title: "Writing an attendance policy for hybrid teams", excerpt: "A 1-page policy template that protects your business without micro-managing.", date: "Feb 27, 2026" },
  { slug: "payroll-mistakes-to-avoid", title: "5 payroll mistakes attendance data can silently cause", excerpt: "Why disconnected attendance and payroll cost you more than you think.", date: "Feb 02, 2026" },
];

function BlogIndex() {
  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-10 pt-12 sm:pt-16 lg:pt-20">
        <Container className="text-center">
          <Eyebrow>Blog</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Workforce insights</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Practical guides for HR, ops and finance teams.
          </p>
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            {posts.map((p) => (
              <article key={p.slug} className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-elegant">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.date}</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight group-hover:text-primary">{p.title}</h2>
                <p className="mt-2 text-muted-foreground">{p.excerpt}</p>
                <p className="mt-4 text-sm font-medium text-primary">Coming soon →</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>
      <CtaBanner />
    </MarketingLayout>
  );
}
