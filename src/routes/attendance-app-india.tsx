import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { FeaturePage } from "@/components/marketing/feature-page";
import { seo } from "@/lib/seo";
import { Smartphone, MapPin, Wallet, FileSpreadsheet, Globe2, Zap } from "lucide-react";

export const Route = createFileRoute("/attendance-app-india")({
  head: () => seo({
    title: "Best Attendance App in India — GST-ready, multi-language · Punchly",
    description: "The best attendance app for Indian SMBs and enterprises. UPI billing, GST invoices, Hindi/Tamil/Telugu support, Razorpay payroll integration.",
    path: "/attendance-app-india",
  }),
  component: () => (
    <MarketingLayout>
      <FeaturePage
        eyebrow="India · Workforce"
        h1={<>The best attendance app for Indian teams</>}
        intro="Built for Indian businesses — multi-language, UPI billing, GST invoices, and direct integration with Razorpay Payroll and Zoho People."
        bullets={[
          { icon: Smartphone, title: "Made for India", desc: "Works on entry-level Android phones." },
          { icon: MapPin, title: "GPS attendance", desc: "Built for distributed and field teams." },
          { icon: Wallet, title: "UPI & GST billing", desc: "Pay via UPI, get GST invoices instantly." },
          { icon: Globe2, title: "Hindi & regional", desc: "Hindi, Tamil, Telugu, Kannada, Bengali." },
          { icon: FileSpreadsheet, title: "Razorpay & Zoho", desc: "One-click payroll exports." },
          { icon: Zap, title: "5-minute setup", desc: "Live before your chai gets cold." },
        ]}
        faq={[
          { q: "Do you support Indian payroll?", a: "Yes — Razorpay Payroll, Zoho People, and generic Indian payroll CSVs." },
          { q: "Is GST included?", a: "Yes — GST invoices auto-generated for every payment." },
        ]}
      />
    </MarketingLayout>
  ),
});
