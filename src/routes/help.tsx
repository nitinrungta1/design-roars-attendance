import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow } from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { seo } from "@/lib/seo";
import { Search } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => seo({
    title: "Help Center — Punchly",
    description: "Guides, FAQs, and onboarding videos to get the most out of Punchly.",
    path: "/help",
  }),
  component: HelpPage,
});

const cats = [
  { t: "Getting started", c: 8 }, { t: "Attendance & check-in", c: 14 },
  { t: "Timesheets", c: 9 }, { t: "Shifts & schedules", c: 11 },
  { t: "Payroll & exports", c: 7 }, { t: "Admin & permissions", c: 12 },
  { t: "Mobile app", c: 6 }, { t: "Billing", c: 5 },
];

function HelpPage() {
  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-10 pt-12 sm:pt-16 lg:pt-20">
        <Container className="text-center">
          <Eyebrow>Help Center</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">How can we help?</h1>
          <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-soft">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input className="flex-1 bg-transparent text-sm outline-none" placeholder="Search articles, guides, videos…" />
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cats.map((c) => (
              <div key={c.t} className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-soft">
                <p className="font-semibold">{c.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.c} articles</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <CtaBanner />
    </MarketingLayout>
  );
}
