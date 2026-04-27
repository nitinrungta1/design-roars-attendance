import {
  Fingerprint,
  MapPin,
  Tablet,
  Wallet,
  ClipboardList,
  CalendarClock,
  BarChart3,
  Smartphone,
  Shield,
  Zap,
  Globe,
  Sparkles,
  Check,
  ArrowRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Container,
  Section,
  Eyebrow,
  GradientText,
  GlassCard,
} from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { useCurrency } from "@/lib/currency";
import heroImg from "@/assets/hero-dashboard.jpg";
import mobileImg from "@/assets/mobile-showcase.jpg";
import kioskImg from "@/assets/kiosk-mode.jpg";

const benefits = [
  { icon: Fingerprint, title: "One-tap attendance", desc: "Check-in in under a second from web, mobile, or kiosk." },
  { icon: MapPin, title: "GPS & geo-fencing", desc: "Location-verified punches with smart radius rules." },
  { icon: Tablet, title: "Kiosk mode", desc: "Turn any tablet into a secure check-in station with PIN or face." },
  { icon: Wallet, title: "Payroll-ready", desc: "Export payroll-perfect timesheets to your favorite system." },
  { icon: ClipboardList, title: "Smart timesheets", desc: "Hourly logging, billable tracking, calendar view." },
  { icon: CalendarClock, title: "Shift scheduling", desc: "Rotational, night shifts, dynamic rosters made simple." },
  { icon: BarChart3, title: "Real-time reports", desc: "Late, absent, overtime, productivity — exportable instantly." },
  { icon: Smartphone, title: "Mobile-first", desc: "Native-feeling iOS & Android experience your team will love." },
];

const industries = [
  "Startups", "SMEs", "Enterprises", "Retail", "Factories",
  "Remote Teams", "Agencies", "Schools", "Hospitals", "Logistics",
];

const showcase = [
  {
    eyebrow: "Web Dashboard",
    title: "Your entire workforce, on one screen.",
    desc: "Live status, attendance heatmaps, GPS pins, approvals — all in a workspace built for HR and operations leads.",
    image: heroImg,
  },
  {
    eyebrow: "Mobile App",
    title: "Check-in from anywhere in one tap.",
    desc: "GPS-verified punches, offline support, push notifications, leave requests, and timesheet entry — designed for busy people.",
    image: mobileImg,
  },
  {
    eyebrow: "Kiosk Mode",
    title: "Turn any tablet into a secure check-in station.",
    desc: "PIN, QR, or face-recognition-ready. Perfect for factories, retail outlets, and offices with shared devices.",
    image: kioskImg,
  },
];

const testimonials = [
  {
    quote: "We replaced three tools with Punchly and cut payroll prep from 4 days to 4 hours.",
    author: "Priya Menon",
    role: "VP People, Lumen Retail (1,200 employees)",
  },
  {
    quote: "The GPS check-in is so accurate that our field service approvals dropped by 80%.",
    author: "Marco Rinaldi",
    role: "Operations Director, Helix Logistics",
  },
  {
    quote: "Setup took 30 minutes. The mobile app feels like Instagram, not enterprise software.",
    author: "Aisha Khan",
    role: "Co-founder & COO, Northwind Studios",
  },
];

const pricingTiers: { name: string; usd: number; desc: string; features: string[]; highlight?: boolean }[] = [
  { name: "Free", usd: 0, desc: "For up to 10 users", features: ["Web check-in", "Basic reports", "1 admin"] },
  { name: "Starter", usd: 2, desc: "Per user / month", features: ["Mobile + GPS", "Timesheets", "Email support"], highlight: false },
  { name: "Growth", usd: 4, desc: "Per user / month", features: ["Shifts + Overtime", "Kiosk mode", "Priority support"], highlight: true },
  { name: "Business", usd: 7, desc: "Per user / month", features: ["Payroll integrations", "Advanced reports", "SSO"] },
];

export function HomeHero() {
  return (
    <Section className="overflow-hidden bg-gradient-hero pb-10 pt-8 sm:pt-12 lg:pt-20">
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" aria-hidden />
      <Container>
        <div className="mx-auto max-w-4xl text-center animate-in-up">
          <div className="mb-5 flex justify-center">
            <Eyebrow>
              <Sparkles className="h-3 w-3 text-primary" /> Now with AI-powered shift forecasting
            </Eyebrow>
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
            The smartest <GradientText>attendance management</GradientText> software for modern teams
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Track attendance, shifts, timesheets, overtime, and GPS check-ins from anywhere.
            Built for teams of 5 to 50,000.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-brand text-primary-foreground hover:opacity-90">
              <Link to="/demo">
                Start free trial <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/demo">Book a demo</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free 14-day trial · No credit card · Set up in 5 minutes
          </p>
        </div>
        <div className="relative mx-auto mt-12 max-w-6xl">
          <div className="absolute -inset-x-8 -inset-y-4 rounded-[2.5rem] bg-gradient-mesh opacity-60 blur-2xl" aria-hidden />
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
            <img
              src={heroImg}
              alt="Punchly attendance management dashboard with live employee status, GPS map, and today's attendance chart"
              width={1600}
              height={1100}
              className="h-auto w-full"
              fetchPriority="high"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function TrustBar() {
  const logos = ["NORTHWIND", "LUMEN", "HELIX", "ATLAS CO.", "MERIDIAN", "VECTOR.IO", "PARALLAX", "FORGE"];
  return (
    <section className="border-y border-border bg-card/40 py-10">
      <Container>
        <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Trusted by 12,000+ teams worldwide
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
          {logos.map((l) => (
            <span key={l} className="text-sm font-semibold tracking-widest text-muted-foreground">
              {l}
            </span>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-success" /> SOC 2 Type II
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
            <Globe className="h-3.5 w-3.5 text-primary" /> GDPR ready
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-warning" /> 99.99% uptime
          </span>
        </div>
      </Container>
    </section>
  );
}

export function BenefitsGrid() {
  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Everything you need</Eyebrow>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            One platform. Every workforce.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Replace 4–5 tools with a single, beautifully designed system your team will actually use.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <GlassCard key={b.title} className="transition-transform hover:-translate-y-1">
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
  );
}

export function ProductShowcase() {
  return (
    <Section className="bg-card/30">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>The product</Eyebrow>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Built for every device your team uses.
          </h2>
        </div>
        <div className="mt-14 space-y-20">
          {showcase.map((s, i) => (
            <div
              key={s.title}
              className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 ? "lg:grid-flow-col-dense" : ""}`}
            >
              <div className={i % 2 ? "lg:col-start-2" : ""}>
                <Eyebrow>{s.eyebrow}</Eyebrow>
                <h3 className="mt-4 text-balance text-2xl font-bold tracking-tight sm:text-3xl">{s.title}</h3>
                <p className="mt-3 text-muted-foreground">{s.desc}</p>
                <Button asChild variant="link" className="mt-3 px-0 text-primary">
                  <Link to="/features">
                    Explore features <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className={`relative overflow-hidden rounded-2xl border border-border bg-card shadow-card ${i % 2 ? "lg:col-start-1" : ""}`}>
                <img
                  src={s.image}
                  alt={s.title}
                  loading="lazy"
                  width={1600}
                  height={1000}
                  className="h-auto w-full"
                />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function IndustriesStrip() {
  return (
    <Section className="py-16">
      <Container>
        <div className="rounded-3xl border border-border bg-gradient-mesh p-8 sm:p-12 text-center">
          <Eyebrow>Industries</Eyebrow>
          <h2 className="mt-4 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            From 10-person startups to 100,000-employee enterprises
          </h2>
          <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-2">
            {industries.map((i) => (
              <span
                key={i}
                className="rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-medium backdrop-blur"
              >
                {i}
              </span>
            ))}
          </div>
          <Button asChild variant="link" className="mt-4 text-primary">
            <Link to="/industries">
              Find your industry <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export function Testimonials() {
  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Loved by HR & Ops leaders</Eyebrow>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            What teams say about Punchly
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <GlassCard key={t.author} className="flex h-full flex-col">
              <p className="text-base leading-relaxed">"{t.quote}"</p>
              <div className="mt-6 border-t border-border pt-4">
                <p className="font-semibold">{t.author}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function PricingTeaser() {
  const { format, isLoading } = useCurrency();
  return (
    <Section className="bg-card/30">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Honest pricing that scales with you
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start free. Upgrade when you need more. Cancel anytime.
          </p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {pricingTiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border bg-card p-6 shadow-soft ${
                t.highlight
                  ? "border-primary shadow-elegant ring-1 ring-primary"
                  : "border-border"
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular">
                  {isLoading ? "…" : format(t.usd)}
                </span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>
              <p className="text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-6 w-full ${t.highlight ? "bg-gradient-brand text-primary-foreground" : ""}`}
                variant={t.highlight ? "default" : "outline"}
              >
                <Link to="/pricing">Choose {t.name}</Link>
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="link" className="text-primary">
            <Link to="/pricing">
              Compare all plans <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export { CtaBanner };
