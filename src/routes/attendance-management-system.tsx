import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { FeaturePage } from "@/components/marketing/feature-page";
import { seo } from "@/lib/seo";
import { Fingerprint, Smartphone, MapPin, Tablet, BarChart3, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/attendance-management-system")({
  head: () => seo({
    title: "Attendance Management System",
    description: "Punchly is a modern attendance management system for SMBs and enterprises. One-tap check-in, GPS, kiosk, timesheets, and payroll integration.",
    path: "/attendance-management-system",
    kind: "product",
  }),
  component: () => (
    <MarketingLayout>
      <FeaturePage
        eyebrow="Attendance Management System"
        h1={<>The modern attendance management system for any team</>}
        intro="Replace spreadsheets and clunky biometric devices with a beautiful, accurate, mobile-first attendance system that your team will actually use."
        bullets={[
          { icon: Fingerprint, title: "One-tap check-in", desc: "Web, mobile, kiosk — fastest in the category." },
          { icon: MapPin, title: "GPS verified", desc: "Smart geo-fencing without surveillance." },
          { icon: Tablet, title: "Kiosk mode", desc: "Tablet check-in with PIN, QR or face." },
          { icon: ClipboardList, title: "Timesheets included", desc: "Hourly logging with billable flags." },
          { icon: BarChart3, title: "Real-time reports", desc: "Late, absent, overtime, productivity." },
          { icon: Smartphone, title: "Mobile-first", desc: "iOS and Android with offline support." },
        ]}
        faq={[
          { q: "How long does setup take?", a: "Most teams are live in under 30 minutes — import employees via CSV or SSO." },
          { q: "Do you support biometric devices?", a: "Yes — face-ready kiosk plus integrations with common badge readers." },
          { q: "Can I migrate from another system?", a: "Yes, we provide free migration help from any major provider." },
        ]}
        internalLinks={[
          { to: "/time-tracking-software", label: "Time Tracking Software" },
          { to: "/gps-attendance-app", label: "GPS Attendance App" },
          { to: "/biometric-attendance-software", label: "Biometric Attendance" },
        ]}
      />
    </MarketingLayout>
  ),
});
