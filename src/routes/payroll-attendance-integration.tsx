import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { FeaturePage } from "@/components/marketing/feature-page";
import { seo } from "@/lib/seo";
import { Wallet, FileSpreadsheet, RefreshCw, Lock, Zap, Shield } from "lucide-react";

export const Route = createFileRoute("/payroll-attendance-integration")({
  head: () => seo({
    title: "Payroll & Attendance Integration",
    description: "Send Punchly attendance, overtime, and leave straight to your payroll system. Razorpay, Zoho, ADP, Gusto, and CSV.",
    path: "/payroll-attendance-integration",
    kind: "product",
  }),
  component: () => (
    <MarketingLayout>
      <FeaturePage
        eyebrow="Payroll Integration"
        h1={<>Attendance and payroll, finally in sync</>}
        intro="Cut payroll prep from days to minutes with direct integrations and a clean exports layer for everything else."
        bullets={[
          { icon: Wallet, title: "Direct integrations", desc: "Razorpay Payroll, Zoho, ADP, Gusto." },
          { icon: FileSpreadsheet, title: "Custom exports", desc: "Build CSV/Excel templates per provider." },
          { icon: RefreshCw, title: "Two-way sync", desc: "Employee changes flow both ways." },
          { icon: Lock, title: "Locked periods", desc: "Lock attendance once payroll is run." },
          { icon: Zap, title: "One-click run", desc: "Send the period to payroll in one click." },
          { icon: Shield, title: "Audit trail", desc: "Every export logged and reproducible." },
        ]}
        faq={[
          { q: "Which payroll systems do you support?", a: "Direct integrations for major providers, plus generic CSV/Excel for anything else." },
        ]}
      />
    </MarketingLayout>
  ),
});
