import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container, Section, Eyebrow, GradientText, GlassCard } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { CtaBanner } from "@/components/brand/marketing-sections";

export interface FeatureBullet {
  icon: LucideIcon;
  title: string;
  desc: string;
}
export interface FeaturePageProps {
  eyebrow: string;
  h1: React.ReactNode;
  intro: string;
  bullets: FeatureBullet[];
  faq: { q: string; a: string }[];
  ctaTitle?: React.ReactNode;
  internalLinks?: { to: string; label: string }[];
}

export function FeaturePage({ eyebrow, h1, intro, bullets, faq, ctaTitle, internalLinks }: FeaturePageProps) {
  return (
    <>
      <Section className="bg-gradient-hero pb-10 pt-12 sm:pt-16 lg:pt-24">
        <div className="absolute inset-0 -z-10 grid-bg opacity-40" aria-hidden />
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {h1}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">{intro}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-brand text-primary-foreground hover:opacity-90">
                <Link to="/demo">Start free trial <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/demo">Book a demo</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="pt-4 sm:pt-6 lg:pt-8">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bullets.map((b) => (
              <GlassCard key={b.title}>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
              </GlassCard>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-card/30">
        <Container size="narrow">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight">Frequently asked questions</h2>
          <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
            {faq.map((item) => (
              <details key={item.q} className="group p-6">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                  {item.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      {internalLinks && (
        <Section className="py-10">
          <Container>
            <Eyebrow>Related</Eyebrow>
            <div className="mt-4 flex flex-wrap gap-2">
              {internalLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <CtaBanner
        title={ctaTitle ?? <>Ready to upgrade your <GradientText>workforce experience</GradientText>?</>}
      />
    </>
  );
}

export function buildFaqJsonLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function PassedBenefit({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <Check className="mt-0.5 h-4 w-4 flex-none text-success" />
      <span>{children}</span>
    </li>
  );
}
