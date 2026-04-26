import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { FeaturePage } from "@/components/marketing/feature-page";
import { seo } from "@/lib/seo";
import { MapPin, Smartphone, Lock, Wifi, Shield, Globe2 } from "lucide-react";

export const Route = createFileRoute("/gps-attendance-app")({
  head: () => seo({
    title: "GPS Attendance App — Location-verified check-in · Punchly",
    description: "GPS attendance app with geo-fencing, offline punches, and accurate field tracking — without surveilling your team.",
    path: "/gps-attendance-app",
  }),
  component: () => (
    <MarketingLayout>
      <FeaturePage
        eyebrow="GPS Attendance"
        h1={<>GPS attendance for field, retail, and hybrid teams</>}
        intro="Verify location at check-in time — not all day. Honest, accurate, and respectful."
        bullets={[
          { icon: MapPin, title: "Smart radius", desc: "Per-site configurable geo-fences." },
          { icon: Smartphone, title: "Mobile-first", desc: "iOS & Android, native-feel." },
          { icon: Wifi, title: "Offline queue", desc: "Punches sync when back online." },
          { icon: Lock, title: "Spoof prevention", desc: "Mock-location detection." },
          { icon: Shield, title: "Privacy-first", desc: "Location captured at punch only." },
          { icon: Globe2, title: "Multi-site", desc: "Hundreds of sites, one workspace." },
        ]}
        faq={[
          { q: "Do you track location all day?", a: "No. Only at the moment of check-in/out, and we tell the user." },
          { q: "Does it work indoors?", a: "Yes — combined with WiFi-assisted positioning." },
        ]}
      />
    </MarketingLayout>
  ),
});
