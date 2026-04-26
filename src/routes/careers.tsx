import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow, GradientText } from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/careers")({
  head: () => seo({
    title: "Careers",
    description: "Join Oqlio. We're hiring across engineering, design, sales, and customer success — fully remote, async-first.",
    path: "/careers",
    kind: "company",
  }),
  component: CareersPage,
});

const roles = [
  { t: "Senior Full-Stack Engineer", l: "Remote · Full-time" },
  { t: "Product Designer", l: "Remote · Full-time" },
  { t: "Account Executive (APAC)", l: "Singapore / Remote" },
  { t: "Customer Success Manager", l: "Remote · Full-time" },
];

function CareersPage() {
  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-10 pt-12 sm:pt-16 lg:pt-20">
        <Container className="text-center">
          <Eyebrow>Careers</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Build something people <GradientText>love using daily</GradientText>
          </h1>
        </Container>
      </Section>
      <Section>
        <Container size="narrow">
          <h2 className="text-2xl font-bold">Open roles</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
            {roles.map((r) => (
              <div key={r.t} className="flex items-center justify-between p-5">
                <div>
                  <p className="font-semibold">{r.t}</p>
                  <p className="text-sm text-muted-foreground">{r.l}</p>
                </div>
                <span className="text-sm font-medium text-primary">Apply →</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <CtaBanner />
    </MarketingLayout>
  );
}
