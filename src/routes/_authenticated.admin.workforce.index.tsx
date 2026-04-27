import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  Clock,
  Sun,
  Home,
  ShieldCheck,
  ClipboardList,
  Timer,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { StatCard } from "@/components/admin/data-shell";
import { getWorkforceDashboard } from "@/lib/workforce-pro.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/")({
  head: () =>
    seo({
      title: "Workforce Dashboard | Admin",
      description: "Workforce executive overview — attendance, shifts, productivity, alerts.",
      kind: "product",
      path: "/admin/workforce",
      noindex: true,
    }),
  component: WorkforceDashboard,
});

function WorkforceDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "dashboard"],
    queryFn: () => getWorkforceDashboard(),
  });

  const k = data?.kpis;

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Workforce Dashboard"
        description="Live KPIs, attendance trends, shift coverage, and workforce alerts across all tenants."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Workforce" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total Employees" value={k?.total_employees ?? (isLoading ? "…" : 0)} />
          <StatCard label="Present Today" value={k?.present_today ?? (isLoading ? "…" : 0)} tone="success" />
          <StatCard label="Late Today" value={k?.late_today ?? (isLoading ? "…" : 0)} tone="warning" />
          <StatCard label="On Leave" value={k?.on_leave_today ?? (isLoading ? "…" : 0)} />
          <StatCard label="Remote" value={k?.remote_today ?? (isLoading ? "…" : 0)} />
          <StatCard label="Shift Coverage" value={`${k?.shift_coverage_pct ?? 0}%`} />
          <StatCard label="Pending Timesheets" value={k?.pending_timesheets ?? 0} tone="warning" />
          <StatCard label="OT Hours (7d)" value={k?.overtime_hours ?? 0} />
          <StatCard label="New Joiners (30d)" value={k?.new_joiners_30d ?? 0} tone="success" />
          <StatCard
            label="Attrition Alerts"
            value={k?.attrition_alerts ?? 0}
            tone={k?.attrition_alerts ? "danger" : "default"}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Attendance trend (14d)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.attendance_trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="hsl(142 76% 36%)" strokeWidth={2} />
                <Line type="monotone" dataKey="late" stroke="hsl(38 92% 50%)" strokeWidth={2} />
                <Line type="monotone" dataKey="absent" stroke="hsl(0 72% 51%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Department headcount">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.department_headcount ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Shift utilization">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.shift_utilization ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="shift" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="assigned" fill="hsl(262 83% 58%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Overtime hours (14d)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data?.overtime_series ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="hsl(24 95% 53%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <QuickLink to="/admin/workforce/employees" label="Directory" icon={Users} />
          <QuickLink to="/admin/workforce/rules" label="Rules" icon={ShieldCheck} />
          <QuickLink to="/admin/workforce/attendance" label="Automation" icon={Clock} />
          <QuickLink to="/admin/workforce/timesheets" label="Timesheets" icon={ClipboardList} />
          <QuickLink to="/admin/workforce/overtime" label="Overtime" icon={Timer} />
          <QuickLink to="/admin/workforce/leave" label="Leave" icon={Sun} />
        </div>
      </PageBody>
    </>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function QuickLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={to}
      className="flex items-center gap-2 rounded-xl border border-border bg-card/40 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{label}</span>
    </a>
  );
}
