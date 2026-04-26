import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow, GradientText } from "@/components/brand/primitives";
import { ContactForm } from "@/components/brand/forms";
import { seo } from "@/lib/seo";
import { Mail, MessageSquare, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => seo({
    title: "Contact",
    description: "Get in touch with the Oqlio team. Sales, support, partnerships — we usually reply within one business day.",
    path: "/contact",
    kind: "company",
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-10 pt-12 sm:pt-16 lg:pt-20">
        <Container className="text-center">
          <Eyebrow>Contact</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Let's <GradientText>talk</GradientText>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Sales, support, or just want to say hi — we usually reply within a business day.
          </p>
        </Container>
      </Section>
      <Section className="pt-4">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-6">
              {[
                { icon: Mail, t: "Email", d: "hello@oqlio.com" },
                { icon: MessageSquare, t: "Live chat", d: "9am – 9pm IST, weekdays" },
                { icon: Phone, t: "Phone", d: "+1 (415) 555-0142" },
              ].map((c) => (
                <div key={c.t} className="flex items-start gap-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{c.t}</p>
                    <p className="text-muted-foreground">{c.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
              <ContactForm source="contact" />
            </div>
          </div>
        </Container>
      </Section>
    </MarketingLayout>
  );
}
