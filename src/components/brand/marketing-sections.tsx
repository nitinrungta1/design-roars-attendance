import type { ReactNode } from "react";
import { Container, Section, Eyebrow, GradientText } from "@/components/brand/primitives";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Section className="bg-gradient-hero pb-12 pt-12 sm:pt-16 lg:pt-24">
      <div className="absolute inset-0 -z-10 grid-bg opacity-40" aria-hidden />
      <Container className="text-center">
        {eyebrow && (
          <div className="mb-5 flex justify-center">
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
        )}
        <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>}
      </Container>
    </Section>
  );
}

export function CtaBanner({
  title = (
    <>
      Ready to modernize your <GradientText>attendance system</GradientText>?
    </>
  ),
  subtitle = "Start your 14-day free trial. No credit card required. Cancel anytime.",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <Section className="pb-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-brand p-10 sm:p-14 text-center shadow-elegant">
          <div className="absolute inset-0 bg-gradient-mesh opacity-50 mix-blend-overlay" aria-hidden />
          <h2 className="relative mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-pretty text-primary-foreground/90">
            {subtitle}
          </p>
          <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/demo">Start free trial</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/demo">Book a demo</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
