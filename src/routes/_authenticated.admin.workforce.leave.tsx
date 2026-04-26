import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarRange } from "lucide-react";
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
  listLeaveRequests,
  updateLeaveStatus,
  LEAVE_REQUEST_STATUSES,
  type LeaveRequestStatus,
} from "@/lib/workforce.functions";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/leave")({
  head: () =>
    seo({
      title: "Leave | Admin",
      description: "Leave balances, requests, policies.",
      kind: "product",
      path: "/admin/workforce/leave",
      noindex: true,
    }),
  component: LeavePage,
});

const STATUS_TONES: Record<LeaveRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  cancelled: "bg-muted text-muted-foreground",
};

function LeavePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "leave-requests"],
    queryFn: () => listLeaveRequests(),
  });

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: LeaveRequestStatus }) =>
      updateLeaveStatus({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Leave updated");
        qc.invalidateQueries({ queryKey: ["admin", "leave-requests"] });
      } else toast.error(res.error);
    },
  });

  const requests = data?.requests ?? [];
  const totals = {
    all: requests.length,
    pending: requests.filter((l) => l.status === "pending").length,
    approved: requests.filter((l) => l.status === "approved").length,
    days: requests.filter((l) => l.status === "approved").reduce((a, l) => a + l.days, 0),
  };

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Leave"
        description="Leave requests across every tenant — approve, reject, or cancel."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Leave" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Requests" value={totals.all} />
          <StatCard label="Pending" value={totals.pending} tone="warning" />
          <StatCard label="Approved" value={totals.approved} tone="success" />
          <StatCard label="Days off" value={totals.days.toFixed(1)} />
        </div>

        <DataTable
          headers={["Employee", "Type", "Window", "Days", "Reason", "Submitted", "Status"]}
          empty={
            !isLoading && requests.length === 0 ? (
              <EmptyState
                icon={CalendarRange}
                title="No leave requests"
                description="Once employees apply for leave, the queue lands here."
              />
            ) : null
          }
        >
          {requests.map((l) => (
            <Tr key={l.id}>
              <Td>
                <div className="font-medium">{l.employee_name}</div>
                <div className="text-xs text-muted-foreground">{l.company_name}</div>
              </Td>
              <Td>
                {l.leave_type_name ? (
                  <Badge
                    variant="outline"
                    className="rounded-full text-[10px]"
                    style={{
                      borderColor: l.leave_type_color ?? undefined,
                      color: l.leave_type_color ?? undefined,
                    }}
                  >
                    {l.leave_type_name}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </Td>
              <Td className="text-muted-foreground">
                {fmtDate(l.start_date)} → {fmtDate(l.end_date)}
              </Td>
              <Td className="font-mono text-xs">{l.days.toFixed(1)}</Td>
              <Td className="max-w-md truncate text-muted-foreground">{l.reason ?? "—"}</Td>
              <Td className="text-muted-foreground">{fmtDate(l.created_at)}</Td>
              <Td>
                <Select
                  value={l.status}
                  onValueChange={(v) => mut.mutate({ id: l.id, status: v as LeaveRequestStatus })}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue>
                      <Badge
                        variant="secondary"
                        className={cn("rounded-full capitalize", STATUS_TONES[l.status])}
                      >
                        {l.status}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_REQUEST_STATUSES.map((s) => (
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
