import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { FeaturePage } from "@/components/marketing/feature-page";
import { seo } from "@/lib/seo";
import { Fingerprint, ScanFace, Tablet, Lock, Shield, Zap } from "lucide-react";

export const Route = createFileRoute("/biometric-attendance-software")({
  head: () => seo({
    title: "Biometric Attendance Software",
    description: "Replace clunky biometric devices with Punchly — kiosk + face-ready attendance system that integrates with payroll.",
    path: "/biometric-attendance-software",
    kind: "product",
  }),
  component: () => (
    <MarketingLayout>
      <FeaturePage
        eyebrow="Biometric Attendance"
        h1={<>Biometric attendance, modernized</>}
        intro="Stop maintaining fragile fingerprint hardware. Use a tablet, a phone, or a webcam — secure, accurate, and 10x cheaper."
        bullets={[
          { icon: ScanFace, title: "Face-ready kiosk", desc: "Pluggable face recognition module." },
          { icon: Fingerprint, title: "PIN & QR", desc: "Fast fallback for shared devices." },
          { icon: Tablet, title: "Tablet kiosk", desc: "Any iPad/Android tablet works." },
          { icon: Lock, title: "Audit trail", desc: "Every check-in cryptographically logged." },
          { icon: Shield, title: "Anti-buddy-punch", desc: "Live capture & device binding." },
          { icon: Zap, title: "Sub-second", desc: "Faster than legacy biometric devices." },
        ]}
        faq={[
          { q: "Do I need special hardware?", a: "No — any modern tablet or phone works." },
        ]}
      />
    </MarketingLayout>
  ),
});
