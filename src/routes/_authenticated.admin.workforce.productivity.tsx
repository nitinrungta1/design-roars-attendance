import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Activity } from "lucide-react";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { StatCard, DataTable, Td, Tr } from "@/components/admin/data-shell";
import { ExportMenu } from "@/components/admin/export-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProductivitySummary } from "@/lib/workforce-ops.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/productivity")({
  head: () =>
    seo({
      title: "Productivity | Workforce",
      description: "Productive vs idle time, tasks, and team performance.",
      kind: "product",
      path: "/admin/workforce/productivity",
      noindex: true,
    }),
  component: ProductivityPage,
});

function ProductivityPage() {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "productivity", days],
    queryFn: () => getProductivitySummary({ data: { days } }),
  });

  const k = data?.kpis;
  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Productivity"
        description="Track productive vs idle time, tasks completed, and team-level performance."
        actions={
          <div className="flex items-center gap-2">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <ExportMenu
              filename={`productivity-top-employees-${days}d`}
              columns={[
                { key: "name", header: "Employee" },
                { key: "productive_hours", header: "Productive (h)" },
                { key: "idle_hours", header: "Idle (h)" },
                { key: "tasks", header: "Tasks" },
                { key: "score", header: "Score %" },
              ]}
              rows={data?.top_employees ?? []}
              sheetName="Top Employees"
            />
          </div>
        }
      />
      <PageBody>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Productivity Score" value={k ? `${k.productivity_score}%` : "—"} tone="success" />
          <StatCard label="Avg Productive / day" value={k ? `${k.avg_productive_hours}h` : "—"} />
          <StatCard label="Avg Idle / day" value={k ? `${k.avg_idle_hours}h` : "—"} tone="warning" />
          <StatCard label="Tasks Completed" value={k ? k.total_tasks.toLocaleString() : "—"} />
          <StatCard label="Employees Tracked" value={k ? k.employees_tracked : "—"} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Productive vs Idle (hours)</h3>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.trend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="productive" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="idle" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <h3 className="mb-3 text-sm font-semibold">Hours by Department</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.by_department ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="productive_hours" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="idle_hours" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold">Top Performers</h3>
          <DataTable headers={["Employee", "Productive (h)", "Idle (h)", "Tasks", "Score"]}>
            {(data?.top_employees ?? []).map((row) => (
              <Tr key={row.employee_id}>
                <Td className="font-medium">{row.name}</Td>
                <Td>{row.productive_hours.toFixed(1)}</Td>
                <Td className="text-amber-600 dark:text-amber-400">{row.idle_hours.toFixed(1)}</Td>
                <Td>{row.tasks}</Td>
                <Td>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {row.score}%
                  </span>
                </Td>
              </Tr>
            ))}
          </DataTable>
          {!isLoading && (data?.top_employees ?? []).length === 0 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              No productivity data captured for this window yet.
            </p>
          )}
        </div>
      </PageBody>
    </>
  );
}
