import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow, GradientText } from "@/components/brand/primitives";
import { DemoForm } from "@/components/brand/forms";
import { seo } from "@/lib/seo";
import { Check } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => seo({
    title: "Book a Demo",
    description: "Book a personalized 30-minute demo of Punchly. See GPS check-in, kiosk mode, timesheets, and payroll integrations live.",
    path: "/demo",
    kind: "product",
  }),
  component: DemoPage,
});

function DemoPage() {
  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-12 pt-10 sm:pt-16 lg:pt-20">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Eyebrow>Book a demo</Eyebrow>
              <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
                See <GradientText>Punchly</GradientText> in action
              </h1>
              <p className="mt-3 text-muted-foreground">
                A 30-minute walkthrough tailored to your team — no slides, just product.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Live walkthrough of attendance, timesheets, shifts, and reports",
                  "Tailored to your industry and team size",
                  "Pricing recommendation based on your needs",
                  "Free 14-day trial set up on the call",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-5 w-5 flex-none text-success" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-elegant">
              <DemoForm />
            </div>
          </div>
        </Container>
      </Section>
    </MarketingLayout>
  );
}
