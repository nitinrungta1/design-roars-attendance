import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { Container, Section, Eyebrow, GlassCard, GradientText } from "@/components/brand/primitives";
import { CtaBanner } from "@/components/brand/marketing-sections";
import { seo } from "@/lib/seo";
import { Link } from "@tanstack/react-router";
import {
  Fingerprint, MapPin, Tablet, Wallet, ClipboardList, CalendarClock,
  BarChart3, Smartphone, Shield, Bell, Building2, Users, Zap, FileSpreadsheet,
  Lock, ScanFace, Globe, Briefcase, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => seo({
    title: "Features",
    description: "Explore every Punchly feature: GPS check-in, kiosk mode, timesheets, shift planning, overtime, payroll integration, reports, mobile app and more.",
    path: "/features",
    kind: "product",
  }),
  component: FeaturesPage,
});

const groups = [
  {
    title: "Attendance",
    items: [
      { icon: Fingerprint, t: "Web check-in/out", d: "One-click attendance from any browser." },
      { icon: Smartphone, t: "Mobile check-in", d: "iOS & Android with offline queue." },
      { icon: MapPin, t: "GPS punch", d: "Coordinates with smart radius rules." },
      { icon: Tablet, t: "Kiosk mode", d: "Tablet check-in with PIN, QR or face." },
      { icon: ScanFace, t: "Face-recognition ready", d: "Pluggable provider, optional add-on." },
      { icon: Lock, t: "IP & geo-fencing", d: "Restrict where punches are valid." },
    ],
  },
  {
    title: "Time & Schedule",
    items: [
      { icon: ClipboardList, t: "Smart timesheets", d: "Hourly logging, calendar, billable flags." },
      { icon: CalendarClock, t: "Shift management", d: "Rotational, night, weekly offs, dynamic rosters." },
      { icon: Bell, t: "Auto shift detection", d: "Detect from punch patterns automatically." },
      { icon: Briefcase, t: "Leave management", d: "Custom leave types, balances, approvals." },
    ],
  },
  {
    title: "Payroll & Reports",
    items: [
      { icon: Zap, t: "Overtime engine", d: "Rule-based detection and approvals." },
      { icon: Wallet, t: "Payroll sync", d: "Export to Razorpay, Zoho, ADP, generic CSV." },
      { icon: BarChart3, t: "Real-time reports", d: "Late, absent, overtime, productivity." },
      { icon: FileSpreadsheet, t: "Exports", d: "CSV, Excel, PDF — schedule auto-emails." },
    ],
  },
  {
    title: "Team & Security",
    items: [
      { icon: Users, t: "Employee directory", d: "Org chart, departments, custom fields." },
      { icon: Building2, t: "Multi-company", d: "Manage multiple legal entities in one workspace." },
      { icon: Shield, t: "Granular permissions", d: "View / edit / approve / export per module." },
      { icon: Globe, t: "SSO & SCIM", d: "Google, Microsoft, SAML, SCIM 2.0." },
    ],
  },
];

function FeaturesPage() {
  return (
    <MarketingLayout>
      <Section className="bg-gradient-hero pb-12 pt-16 lg:pt-24">
        <Container className="text-center">
          <Eyebrow>Features</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Everything modern teams need to <GradientText>track, manage, and pay</GradientText>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            One platform across web, mobile, and kiosk — purpose-built for HR, operations, and managers.
          </p>
        </Container>
      </Section>

      {groups.map((g) => (
        <Section key={g.title} className="py-12">
          <Container>
            <h2 className="text-2xl font-bold tracking-tight">{g.title}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((it) => (
                <GlassCard key={it.t}>
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                    <it.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{it.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{it.d}</p>
                </GlassCard>
              ))}
            </div>
          </Container>
        </Section>
      ))}

      <Section className="py-10">
        <Container>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Explore by use case:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["/attendance-management-system", "Attendance Management System"],
                ["/time-tracking-software", "Time Tracking"],
                ["/employee-timesheet-software", "Employee Timesheets"],
                ["/gps-attendance-app", "GPS Attendance"],
                ["/biometric-attendance-software", "Biometric Attendance"],
                ["/shift-management-software", "Shift Management"],
                ["/overtime-management-system", "Overtime Management"],
                ["/employee-check-in-app", "Employee Check-In App"],
                ["/payroll-attendance-integration", "Payroll Integration"],
                ["/attendance-app-india", "Attendance App India"],
              ].map(([to, label]) => (
                <Link key={to} to={to} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:border-primary">
                  {label} <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <CtaBanner />
    </MarketingLayout>
  );
}
