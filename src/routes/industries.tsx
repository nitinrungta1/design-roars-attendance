import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow, GradientText, GlassCard } from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { seo } from "@/lib/seo";
import {
  Building2, Factory, Store, Stethoscope, GraduationCap, Truck,
  Briefcase, Cpu, Globe2, Users,
} from "lucide-react";

export const Route = createFileRoute("/industries")({
  head: () => seo({
    title: "Industries",
    description: "Punchly is built for retail, factories, hospitals, schools, logistics, agencies, remote teams, and enterprises.",
    path: "/industries",
    kind: "product",
  }),
  component: IndustriesPage,
});

const industries = [
  { icon: Building2, name: "Enterprises", desc: "Multi-company, SSO, SAML, advanced reports — at scale." },
  { icon: Users, name: "SMBs & Startups", desc: "Set up in 5 minutes. Free for up to 10 users." },
  { icon: Store, name: "Retail", desc: "Multi-store check-in, shift handover, kiosk mode." },
  { icon: Factory, name: "Factories", desc: "Biometric, kiosk, and badge-based punch-in for shop floors." },
  { icon: Stethoscope, name: "Hospitals", desc: "Rotational shifts, on-call tracking, compliance reports." },
  { icon: GraduationCap, name: "Schools", desc: "Staff attendance, leave types, period schedules." },
  { icon: Truck, name: "Logistics", desc: "GPS punches for field staff and drivers, geo-fenced rules." },
  { icon: Briefcase, name: "Agencies", desc: "Billable hours, client/project tracking, timesheets." },
  { icon: Cpu, name: "Tech Companies", desc: "Hybrid teams, async logs, payroll integrations." },
  { icon: Globe2, name: "Remote Teams", desc: "Async check-in, time-zone aware reports, no surveillance." },
];

function IndustriesPage() {
  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-10 pt-12 sm:pt-16 lg:pt-24">
        <Container className="text-center">
          <Eyebrow>Industries</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Built for every <GradientText>workforce</GradientText>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            One platform that adapts to your team's reality — from the shop floor to the board room.
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((i) => (
              <GlassCard key={i.name}>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                  <i.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{i.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{i.desc}</p>
                <Link to="/demo" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                  See in action →
                </Link>
              </GlassCard>
            ))}
          </div>
        </Container>
      </Section>
      <CtaBanner />
    </MarketingLayout>
  );
}
