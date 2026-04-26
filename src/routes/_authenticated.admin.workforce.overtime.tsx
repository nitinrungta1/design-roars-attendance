import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TimerReset } from "lucide-react";
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
  listOvertime,
  updateOvertimeStatus,
  OVERTIME_STATUSES,
  type OvertimeStatus,
} from "@/lib/workforce.functions";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/overtime")({
  head: () =>
    seo({
      title: "Overtime | Admin",
      description: "Overtime requests, approvals, and rules.",
      kind: "product",
      path: "/admin/workforce/overtime",
      noindex: true,
    }),
  component: OvertimePage,
});

const STATUS_TONES: Record<OvertimeStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

function OvertimePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overtime"],
    queryFn: () => listOvertime(),
  });

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: OvertimeStatus }) =>
      updateOvertimeStatus({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("OT request updated");
        qc.invalidateQueries({ queryKey: ["admin", "overtime"] });
      } else toast.error(res.error);
    },
  });

  const items = data?.overtime ?? [];
  const totals = {
    all: items.length,
    pending: items.filter((o) => o.status === "pending").length,
    approved: items.filter((o) => o.status === "approved").length,
    hours: items.filter((o) => o.status === "approved").reduce((a, o) => a + o.hours, 0),
  };

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Overtime"
        description="Cross-tenant overtime queue and approvals."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Overtime" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={totals.all} />
          <StatCard label="Pending" value={totals.pending} tone="warning" />
          <StatCard label="Approved" value={totals.approved} tone="success" />
          <StatCard label="Approved hours" value={totals.hours.toFixed(1)} />
        </div>

        <DataTable
          headers={["Employee", "Date", "Hours", "Reason", "Created", "Status"]}
          empty={
            !isLoading && items.length === 0 ? (
              <EmptyState
                icon={TimerReset}
                title="No overtime requests"
                description="Overtime requests submitted through the app appear here."
              />
            ) : null
          }
        >
          {items.map((o) => (
            <Tr key={o.id}>
              <Td>
                <div className="font-medium">{o.employee_name}</div>
                <div className="text-xs text-muted-foreground">{o.company_name}</div>
              </Td>
              <Td className="text-muted-foreground">{fmtDate(o.request_date)}</Td>
              <Td className="font-mono text-xs">{o.hours.toFixed(1)}h</Td>
              <Td className="max-w-md truncate text-muted-foreground">{o.reason ?? "—"}</Td>
              <Td className="text-muted-foreground">{fmtDate(o.created_at)}</Td>
              <Td>
                <Select
                  value={o.status}
                  onValueChange={(v) => mut.mutate({ id: o.id, status: v as OvertimeStatus })}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue>
                      <Badge
                        variant="secondary"
                        className={cn("rounded-full capitalize", STATUS_TONES[o.status])}
                      >
                        {o.status}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {OVERTIME_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>
    </>
  );
}
