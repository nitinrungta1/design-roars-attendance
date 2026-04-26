import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate, StatCard } from "@/components/admin/data-shell";
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
  listTimesheets,
  updateTimesheetStatus,
  TIMESHEET_STATUSES,
  type TimesheetStatus,
} from "@/lib/workforce.functions";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/timesheets")({
  head: () =>
    seo({
      title: "Timesheets | Admin",
      description: "Submitted, approved, and locked timesheets.",
      kind: "product",
      path: "/admin/workforce/timesheets",
      noindex: true,
    }),
  component: TimesheetsPage,
});

const STATUS_TONES: Record<TimesheetStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  locked: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
};

function TimesheetsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "timesheets"],
    queryFn: () => listTimesheets(),
  });

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: TimesheetStatus }) =>
      updateTimesheetStatus({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Timesheet updated");
        qc.invalidateQueries({ queryKey: ["admin", "timesheets"] });
      } else toast.error(res.error);
    },
  });

  const sheets = data?.timesheets ?? [];
  const totals = {
    all: sheets.length,
    submitted: sheets.filter((s) => s.status === "submitted").length,
    approved: sheets.filter((s) => s.status === "approved").length,
    hours: sheets.reduce((acc, s) => acc + s.total_hours, 0),
  };

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Timesheets"
        description="Submitted, approved, billable timesheets across all tenants."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Timesheets" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Sheets" value={totals.all} />
          <StatCard label="Submitted" value={totals.submitted} tone="warning" />
          <StatCard label="Approved" value={totals.approved} tone="success" />
          <StatCard label="Total hours" value={totals.hours.toFixed(1)} />
        </div>

        <DataTable
          headers={["Employee", "Period", "Hours", "Billable", "Submitted", "Approved", "Status"]}
          empty={
            !isLoading && sheets.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No timesheets yet"
                description="Once employees submit weekly timesheets, they queue here for approval."
              />
            ) : null
          }
        >
          {sheets.map((s) => (
            <Tr key={s.id}>
              <Td>
                <div className="font-medium">{s.employee_name}</div>
                <div className="text-xs text-muted-foreground">{s.company_name}</div>
              </Td>
              <Td className="text-muted-foreground">
                {fmtDate(s.period_start)} → {fmtDate(s.period_end)}
              </Td>
              <Td className="font-mono text-xs">{s.total_hours.toFixed(1)}h</Td>
              <Td className="font-mono text-xs">{s.billable_hours.toFixed(1)}h</Td>
              <Td className="text-muted-foreground">
                {s.submitted_at ? fmtDate(s.submitted_at) : "—"}
              </Td>
              <Td className="text-muted-foreground">
                {s.approved_at ? fmtDate(s.approved_at) : "—"}
              </Td>
              <Td>
                <Select
                  value={s.status}
                  onValueChange={(v) => mut.mutate({ id: s.id, status: v as TimesheetStatus })}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue>
                      <Badge
                        variant="secondary"
                        className={cn("rounded-full capitalize", STATUS_TONES[s.status])}
                      >
                        {s.status}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TIMESHEET_STATUSES.map((st) => (
                      <SelectItem key={st} value={st} className="capitalize">
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>
    </>
  );
}
