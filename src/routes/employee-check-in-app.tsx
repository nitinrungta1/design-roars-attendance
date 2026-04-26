import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { FeaturePage } from "@/components/marketing/feature-page";
import { seo } from "@/lib/seo";
import { Smartphone, MapPin, Wifi, Bell, ScanLine, Fingerprint } from "lucide-react";

export const Route = createFileRoute("/employee-check-in-app")({
  head: () => seo({
    title: "Employee Check-In App — Fast, simple, accurate · Punchly",
    description: "An employee check-in app that takes 2 seconds. GPS-verified, offline-first, and loved by both employees and managers.",
    path: "/employee-check-in-app",
  }),
  component: () => (
    <MarketingLayout>
      <FeaturePage
        eyebrow="Employee Check-In App"
        h1={<>The employee check-in app your team will love</>}
        intro="No training required. Open, tap, done. Works on any phone, any network, any country."
        bullets={[
          { icon: Smartphone, title: "Open & tap", desc: "From lockscreen to checked-in in 2s." },
          { icon: MapPin, title: "GPS verified", desc: "Geo-fenced, spoof-resistant." },
          { icon: Wifi, title: "Works offline", desc: "Queue locally, sync later." },
          { icon: Bell, title: "Smart reminders", desc: "Forgot to punch? Auto-reminders." },
          { icon: ScanLine, title: "QR check-in", desc: "Scan a poster at the entrance." },
          { icon: Fingerprint, title: "Face & PIN", desc: "Fallback for shared devices." },
        ]}
        faq={[
          { q: "Is it really 2 seconds?", a: "Yes — we obsess over launch time and tap-to-confirm latency." },
        ]}
      />
    </MarketingLayout>
  ),
});
