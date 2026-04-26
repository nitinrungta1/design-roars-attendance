import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow, GradientText } from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => seo({
    title: "About Punchly — Building the future of workforce management",
    description: "Punchly is on a mission to give every team — from a 10-person shop to a 100,000-person enterprise — beautiful, fast, honest attendance software.",
    path: "/about",
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-12 pt-16 lg:pt-24">
        <Container className="text-center">
          <Eyebrow>About</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            We're building a <GradientText>workforce platform</GradientText> people actually love.
          </h1>
        </Container>
      </Section>
      <Section>
        <Container size="narrow" className="prose prose-neutral dark:prose-invert">
          <p className="text-lg text-muted-foreground">
            Attendance software has a reputation for being clunky, intrusive, and built for
            the 1990s. We disagree. Punchly is what attendance management should look like in
            2026 — fast, modern, mobile-first, and respectful of the people it tracks.
          </p>
          <p className="mt-6 text-muted-foreground">
            Founded in 2025 by a team of HR-tech and consumer product veterans, we serve
            12,000+ teams across 40+ countries — from 10-person studios to 50,000-employee
            enterprises.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[["12k+", "Teams"], ["40+", "Countries"], ["99.99%", "Uptime"]].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-border bg-card p-6">
                <p className="text-3xl font-bold text-gradient-brand">{n}</p>
                <p className="mt-1 text-sm text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <CtaBanner />
    </MarketingLayout>
  );
}
