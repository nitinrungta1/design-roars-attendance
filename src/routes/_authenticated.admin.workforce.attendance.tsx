import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScanLine } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard } from "@/components/admin/data-shell";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  listAttendance,
  updateAttendanceStatus,
  ATTENDANCE_STATUSES,
  type AttendanceStatus,
} from "@/lib/workforce.functions";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/attendance")({
  head: () =>
    seo({
      title: "Attendance | Admin",
      description: "Live attendance logs and exceptions across companies.",
      kind: "product",
      path: "/admin/workforce/attendance",
      noindex: true,
    }),
  component: AttendancePage,
});

const STATUS_TONES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  absent: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  late: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  half_day: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  on_leave: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  holiday: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  weekly_off: "bg-muted text-muted-foreground",
};

const SOURCE_TONES: Record<string, string> = {
  mobile: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  web: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  biometric: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  kiosk: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  manual: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  geofence: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function fmtMinutes(min: number) {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

function AttendancePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "attendance", 7],
    queryFn: () => listAttendance({ data: { days: 7 } }),
  });

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: AttendanceStatus }) =>
      updateAttendanceStatus({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Status updated");
        qc.invalidateQueries({ queryKey: ["admin", "attendance"] });
      } else toast.error(res.error);
    },
  });

  const logs = data?.logs ?? [];
  const totals = {
    all: logs.length,
    present: logs.filter((l) => l.status === "present").length,
    late: logs.filter((l) => l.is_late).length,
    absent: logs.filter((l) => l.status === "absent").length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Attendance"
        description="Last 7 days of punches, exceptions, and geo logs across every tenant."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Attendance" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Logs (7d)" value={totals.all} />
          <StatCard label="Present" value={totals.present} tone="success" />
          <StatCard label="Late" value={totals.late} tone="warning" />
          <StatCard label="Absent" value={totals.absent} tone="danger" />
        </div>

        <DataTable
          headers={["Date", "Employee", "In", "Out", "Worked", "Source", "Status", "Override"]}
          empty={
            !isLoading && logs.length === 0 ? (
              <EmptyState
                icon={ScanLine}
                title="No attendance yet"
                description="Punches from mobile, kiosk, biometric, and geofence will surface here."
              />
            ) : null
          }
        >
          {logs.map((l) => (
            <Tr key={l.id}>
              <Td className="text-muted-foreground">{l.log_date}</Td>
              <Td>
                <div className="font-medium">{l.employee_name}</div>
                <div className="text-xs text-muted-foreground">
                  {l.employee_code} · {l.company_name}
                </div>
              </Td>
              <Td className={cn("font-mono text-xs", l.is_late && "text-amber-600 dark:text-amber-400")}>
                {fmtTime(l.check_in_at)}
              </Td>
              <Td
                className={cn(
                  "font-mono text-xs",
                  l.is_early_leave && "text-orange-600 dark:text-orange-400",
                )}
              >
                {fmtTime(l.check_out_at)}
              </Td>
              <Td>{fmtMinutes(l.worked_minutes)}</Td>
              <Td>
                <Badge
                  variant="secondary"
                  className={cn("rounded-full capitalize", SOURCE_TONES[l.source])}
                >
                  {l.source}
                </Badge>
              </Td>
              <Td>
                <Badge
                  variant="secondary"
                  className={cn("rounded-full capitalize", STATUS_TONES[l.status])}
                >
                  {l.status.replace("_", " ")}
                </Badge>
              </Td>
              <Td>
                <Select
                  value={l.status}
                  onValueChange={(v) => mut.mutate({ id: l.id, status: v as AttendanceStatus })}
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTENDANCE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize text-xs">
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>
    </>
  );
}
