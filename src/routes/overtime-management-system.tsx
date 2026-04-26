import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { FeaturePage } from "@/components/marketing/feature-page";
import { seo } from "@/lib/seo";
import { Zap, FileSpreadsheet, Bell, Users, BarChart3, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/overtime-management-system")({
  head: () => seo({
    title: "Overtime Management System — Rule-based, auditable · Punchly",
    description: "Configure overtime rules per region, role, or shift. Auto-detect, route for manager approval, and export payroll-ready reports.",
    path: "/overtime-management-system",
  }),
  component: () => (
    <MarketingLayout>
      <FeaturePage
        eyebrow="Overtime Management"
        h1={<>Overtime, automated and auditable</>}
        intro="Stop manually calculating overtime. Punchly applies your rules, routes approvals, and feeds payroll automatically."
        bullets={[
          { icon: Zap, title: "Rule engine", desc: "Per region, role, shift, or day." },
          { icon: Bell, title: "Auto-detect", desc: "Flag OT the moment it occurs." },
          { icon: Users, title: "Approval workflow", desc: "Manager sign-off, audit trail." },
          { icon: ClipboardList, title: "Cap & alerts", desc: "Limits per week/month, alerts at threshold." },
          { icon: BarChart3, title: "Reports", desc: "OT cost, by team and by employee." },
          { icon: FileSpreadsheet, title: "Payroll export", desc: "Direct to your payroll system." },
        ]}
        faq={[
          { q: "Can rules differ per country?", a: "Yes — define rule sets per legal entity or region." },
        ]}
      />
    </MarketingLayout>
  ),
});
