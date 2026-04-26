import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow, GradientText, GlassCard } from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { seo } from "@/lib/seo";
import mobileImg from "@/assets/mobile-showcase.jpg";
import { Apple, Smartphone, Wifi, MapPin, Bell, ScanLine } from "lucide-react";

export const Route = createFileRoute("/mobile-app")({
  head: () => seo({
    title: "Mobile App — iOS & Android attendance app · Punchly",
    description: "Punchly's mobile app brings one-tap check-in, GPS verification, offline support, leave requests, and timesheets to every employee's pocket.",
    path: "/mobile-app",
  }),
  component: MobileAppPage,
});

const features = [
  { icon: Smartphone, t: "One-tap check-in", d: "Punch in or out from a single button on the home screen." },
  { icon: MapPin, t: "GPS verification", d: "Coordinates and geo-fencing keep punches honest." },
  { icon: Wifi, t: "Offline-first", d: "Punches queue offline and sync when back online." },
  { icon: Bell, t: "Smart reminders", d: "Forgotten punch-out? We'll nudge — or auto-close." },
  { icon: ScanLine, t: "QR & PIN check-in", d: "Use shared QR posters or PINs for fast onboarding." },
  { icon: Apple, t: "iOS & Android", d: "Built native-feeling for both stores. Installable PWA today." },
];

function MobileAppPage() {
  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-12 pt-12 sm:pt-16 lg:pt-24">
        <Container className="text-center">
          <Eyebrow>Mobile App</Eyebrow>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Attendance in <GradientText>every pocket</GradientText>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A beautifully simple mobile app for employees and managers. Check in, view shifts,
            apply leave, and approve requests — anywhere.
          </p>
          <div className="relative mx-auto mt-10 max-w-5xl">
            <img src={mobileImg} alt="Three mockups of the Punchly mobile app showing check-in, weekly timesheet, and team status screens" width={1600} height={1000} className="h-auto w-full rounded-2xl border border-border shadow-elegant" />
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <GlassCard key={f.t}>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
              </GlassCard>
            ))}
          </div>
        </Container>
      </Section>
      <CtaBanner />
    </MarketingLayout>
  );
}
