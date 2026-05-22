import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, ScanFace, CalendarClock, ClipboardList, Calculator, Clock, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container, Section, Eyebrow, GradientText, GlassCard } from "@/components/brand/primitives";
import { Button } from "@/components/ui/button";
import { CtaBanner } from "@/components/brand/marketing-sections";
import type { SeoFaq, SeoTestimonial } from "@/lib/seo/types";
import type { City } from "@/lib/seo/cities";
import { DEFAULT_PILLARS } from "@/lib/seo/content";
import { bestServiceInCityUrl, serviceForIndustryUrl } from "@/lib/seo/urls";

const ICONS: Record<string, LucideIcon> = {
  MapPin, ScanFace, CalendarClock, ClipboardList, Calculator, Clock,
};

export interface SeoLandingProps {
  eyebrow: string;
  h1: string;
  heroIntro: string;
  ctaText: string;
  intro: string;
  serviceSlug: string;
  serviceName: string;
  cityName?: string;
  industryName?: string;
  industrySlug?: string;
  painPoints?: string[];
  useCases?: string[];
  faqs: SeoFaq[];
  testimonials: SeoTestimonial[];
  nearby?: City[];
  siblingIndustries?: { slug: string; name: string }[];
  bodyHtml?: string;
}

export function SeoLandingTemplate(props: SeoLandingProps) {
  const where = props.cityName ? `in ${props.cityName}` : "";
  return (
    <>
      {/* Hero */}
      <Section className="bg-gradient-hero pb-10 pt-12 sm:pt-16 lg:pt-24">
        <div className="absolute inset-0 -z-10 grid-bg opacity-40" aria-hidden />
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <Eyebrow>{props.eyebrow}</Eyebrow>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <GradientText>{props.h1}</GradientText>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
              {props.heroIntro}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-brand text-primary-foreground hover:opacity-90">
                <Link to="/demo">{props.ctaText} <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/demo">Book a demo</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Intro */}
      <Section className="pt-4 sm:pt-6 lg:pt-8">
        <Container size="narrow">
          <p className="text-pretty text-base text-muted-foreground sm:text-lg">{props.intro}</p>
        </Container>
      </Section>

      {/* Pillars */}
      <Section className="pt-4">
        <Container>
          <div className="text-center">
            <Eyebrow>Features</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight">Everything {props.cityName ? `${props.cityName} teams` : "modern teams"} need</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DEFAULT_PILLARS.map((p) => {
              const Icon = ICONS[p.icon] ?? MapPin;
              return (
                <GlassCard key={p.title}>
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                </GlassCard>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Industry pain points */}
      {props.painPoints && props.painPoints.length > 0 && (
        <Section className="bg-card/30">
          <Container size="narrow">
            <Eyebrow>{props.industryName} challenges</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight">Built for the way {props.industryName?.toLowerCase()} actually run</h2>
            <ul className="mt-6 space-y-3">
              {props.painPoints.map((pp) => (
                <li key={pp} className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 flex-none text-success" />
                  <span className="text-muted-foreground">{pp}</span>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* Use cases */}
      {props.useCases && props.useCases.length > 0 && (
        <Section className="pt-4">
          <Container>
            <Eyebrow>Use cases</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight">How {props.industryName?.toLowerCase()} use Punchly {where}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {props.useCases.map((u) => (
                <GlassCard key={u}><p className="text-sm">{u}</p></GlassCard>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Why Oqlio in {city} */}
      {props.cityName && (
        <Section className="pt-4">
          <Container size="narrow">
            <Eyebrow>Why Oqlio {where}</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight">Local-first, never local-only</h2>
            <p className="mt-4 text-muted-foreground">
              Punchly customer success works across {props.cityName} timezones, supports onboarding for distributed {props.cityName} teams and integrates with the payroll providers used most in {props.cityName}.
            </p>
          </Container>
        </Section>
      )}

      {/* Testimonials */}
      {props.testimonials.length > 0 && (
        <Section className="bg-card/30">
          <Container>
            <Eyebrow>Customer stories</Eyebrow>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {props.testimonials.map((t, i) => (
                <GlassCard key={i}>
                  <p className="text-sm italic text-muted-foreground">"{t.quote}"</p>
                  <p className="mt-3 text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </GlassCard>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* FAQs */}
      {props.faqs.length > 0 && (
        <Section className={props.testimonials.length === 0 ? "bg-card/30" : ""}>
          <Container size="narrow">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight">Frequently asked questions</h2>
            <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
              {props.faqs.map((item) => (
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
      )}

      {/* Body HTML override */}
      {props.bodyHtml && (
        <Section className="pt-4">
          <Container size="narrow">
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: props.bodyHtml }} />
          </Container>
        </Section>
      )}

      {/* Internal links */}
      {((props.nearby && props.nearby.length > 0) || (props.siblingIndustries && props.siblingIndustries.length > 0)) && (
        <Section className="py-10">
          <Container>
            {props.nearby && props.nearby.length > 0 && (
              <>
                <Eyebrow>Nearby cities</Eyebrow>
                <div className="mt-4 flex flex-wrap gap-2">
                  {props.nearby.map((c) => (
                    <Link
                      key={c.slug}
                      to={bestServiceInCityUrl(props.serviceSlug, c.slug)}
                      className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground"
                    >
                      {props.serviceName} in {c.city}
                    </Link>
                  ))}
                </div>
              </>
            )}
            {props.siblingIndustries && props.siblingIndustries.length > 0 && (
              <div className="mt-6">
                <Eyebrow>For other industries</Eyebrow>
                <div className="mt-4 flex flex-wrap gap-2">
                  {props.siblingIndustries.map((i) => (
                    <Link
                      key={i.slug}
                      to={serviceForIndustryUrl(props.serviceSlug, i.slug)}
                      className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground"
                    >
                      {props.serviceName} for {i.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Container>
        </Section>
      )}

      <CtaBanner
        title={<>Ready to modernize {props.cityName ? `${props.cityName} ` : ""}attendance with <GradientText>Punchly</GradientText>?</>}
      />
    </>
  );
}
