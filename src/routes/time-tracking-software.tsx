import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { FeaturePage } from "@/components/marketing/feature-page";
import { seo } from "@/lib/seo";
import { Clock, ClipboardList, Calendar, BarChart3, Briefcase, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/time-tracking-software")({
  head: () => seo({
    title: "Time Tracking Software",
    description: "Punchly time tracking — built for modern teams. Hourly logging, billable hours, project tracking, and one-click payroll exports.",
    path: "/time-tracking-software",
    kind: "product",
  }),
  component: () => (
    <MarketingLayout>
      <FeaturePage
        eyebrow="Time Tracking"
        h1={<>Time tracking that doesn't slow your team down</>}
        intro="Hourly logging that's fast on mobile, calendar-friendly on desktop, and ready to feed your payroll system."
        bullets={[
          { icon: Clock, title: "Hourly logging", desc: "Start, stop, edit — no friction." },
          { icon: ClipboardList, title: "Billable flags", desc: "Tag hours billable, internal or PTO." },
          { icon: Briefcase, title: "Projects & clients", desc: "Allocate time per project for invoicing." },
          { icon: Calendar, title: "Calendar view", desc: "Drag-and-drop edits, weekly summaries." },
          { icon: BarChart3, title: "Live reports", desc: "Utilization, gaps, billable ratios." },
          { icon: FileSpreadsheet, title: "One-click exports", desc: "CSV, Excel, PDF, payroll-ready." },
        ]}
        faq={[
          { q: "Is it intrusive?", a: "No screenshots or activity tracking — just honest, opt-in time logging." },
          { q: "Can I track per project?", a: "Yes, with billable rates and client allocation." },
        ]}
        internalLinks={[
          { to: "/employee-timesheet-software", label: "Employee Timesheets" },
          { to: "/overtime-management-system", label: "Overtime Management" },
        ]}
      />
    </MarketingLayout>
  ),
});
