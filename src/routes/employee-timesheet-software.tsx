import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { FeaturePage } from "@/components/marketing/feature-page";
import { seo } from "@/lib/seo";
import { ClipboardList, Calendar, Lock, FileSpreadsheet, Users, Briefcase } from "lucide-react";

export const Route = createFileRoute("/employee-timesheet-software")({
  head: () => seo({
    title: "Employee Timesheet Software",
    description: "Modern employee timesheet software from Punchly. Lock after submit, audit trails, billable tracking, payroll exports.",
    path: "/employee-timesheet-software",
    kind: "product",
  }),
  component: () => (
    <MarketingLayout>
      <FeaturePage
        eyebrow="Employee Timesheets"
        h1={<>Timesheets your employees won't avoid</>}
        intro="Designed for the people who fill them out, not just the people who review them."
        bullets={[
          { icon: ClipboardList, title: "Daily & weekly entry", desc: "Switch between views in one click." },
          { icon: Calendar, title: "Calendar view", desc: "Visual week, drag-to-edit." },
          { icon: Lock, title: "Lock after submit", desc: "Admin edits only, with audit trail." },
          { icon: Briefcase, title: "Project allocation", desc: "Tag projects, clients, and rates." },
          { icon: Users, title: "Manager approvals", desc: "Bulk approve in one screen." },
          { icon: FileSpreadsheet, title: "Payroll exports", desc: "Excel/CSV/PDF with custom columns." },
        ]}
        faq={[
          { q: "Can I customize fields?", a: "Yes — add custom columns, projects, billing codes." },
        ]}
      />
    </MarketingLayout>
  ),
});
