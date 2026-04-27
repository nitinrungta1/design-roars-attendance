import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Inbox } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { StatCard } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getApprovalsInbox,
  decideApproval,
  type ApprovalKind,
  type ApprovalItem,
} from "@/lib/workforce-approvals.functions";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/workforce/approvals")({
  head: () =>
    seo({
      title: "Approvals Inbox | Admin",
      description: "Unified queue for timesheets, swaps, corrections, and more.",
      kind: "product",
      path: "/admin/workforce/approvals",
      noindex: true,
    }),
  component: ApprovalsPage,
});

const TABS: { value: "all" | ApprovalKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "timesheet", label: "Timesheets" },
  { value: "leave", label: "Leave" },
  { value: "overtime", label: "Overtime" },
  { value: "remote_work", label: "Remote" },
  { value: "shift_swap", label: "Swaps" },
  { value: "attendance_correction", label: "Corrections" },
];

const KIND_LABEL: Record<ApprovalKind, string> = {
  timesheet: "Timesheet",
  leave: "Leave",
  overtime: "Overtime",
  remote_work: "Remote work",
  shift_swap: "Shift swap",
  attendance_correction: "Correction",
};

const KIND_TONE: Record<ApprovalKind, string> = {
  timesheet: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  leave: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  overtime: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  remote_work: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  shift_swap: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  attendance_correction:
    "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

function ApprovalsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | ApprovalKind>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "approvals", tab],
    queryFn: () =>
      getApprovalsInbox({
        data: tab === "all" ? {} : { kind: tab },
      }),
  });

  const decide = useMutation({
    mutationFn: (vars: { id: string; kind: ApprovalKind; decision: "approve" | "reject" }) =>
      decideApproval({ data: vars }),
    onSuccess: (res, vars) => {
      if (res.ok) {
        toast.success(vars.decision === "approve" ? "Approved" : "Rejected");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "approvals"] });
      } else toast.error(res.error);
    },
  });

  const counts = data?.counts;
  const items = data?.items ?? [];
  const totalPending =
    (counts?.timesheet ?? 0) +
    (counts?.shift_swap ?? 0) +
    (counts?.attendance_correction ?? 0) +
    (counts?.remote_work ?? 0) +
    (counts?.overtime ?? 0) +
    (counts?.leave ?? 0);

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Approvals Inbox"
        description="Centralized queue: timesheets, leave, overtime, remote work, swaps, corrections."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Approvals" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Pending" value={totalPending} tone="warning" />
          <StatCard label="Timesheets" value={counts?.timesheet ?? 0} />
          <StatCard label="Leave" value={counts?.leave ?? 0} />
          <StatCard label="Overtime" value={counts?.overtime ?? 0} />
          <StatCard label="Remote" value={counts?.remote_work ?? 0} />
          <StatCard label="Swaps" value={counts?.shift_swap ?? 0} />
          <StatCard label="Corrections" value={counts?.attendance_correction ?? 0} />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | ApprovalKind)}>
          <TabsList className="flex w-full flex-wrap justify-start">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                {t.value !== "all" && counts && counts[t.value as ApprovalKind] > 0 && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1.5 text-[10px]">
                    {counts[t.value as ApprovalKind]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="rounded-2xl border border-border bg-card/40">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nothing to approve"
              description="All caught up. New requests will appear here as employees submit them."
            />
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <ApprovalRow
                  key={`${item.kind}:${item.id}`}
                  item={item}
                  onDecide={(decision) =>
                    decide.mutate({ id: item.id, kind: item.kind, decision })
                  }
                  pending={decide.isPending}
                />
              ))}
            </ul>
          )}
        </div>
      </PageBody>
    </>
  );
}

function ApprovalRow({
  item,
  onDecide,
  pending,
}: {
  item: ApprovalItem;
  onDecide: (d: "approve" | "reject") => void;
  pending: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              KIND_TONE[item.kind],
            )}
          >
            {KIND_LABEL[item.kind]}
          </span>
          <span className="text-sm font-medium">{item.employee_name}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(item.submitted_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>
        <p className="mt-1 text-sm">{item.summary}</p>
        {item.reason && (
          <p className="mt-1 text-xs text-muted-foreground">“{item.reason}”</p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => onDecide("reject")}
        >
          <XCircle className="mr-1 h-4 w-4" /> Reject
        </Button>
        <Button size="sm" disabled={pending} onClick={() => onDecide("approve")}>
          <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
        </Button>
      </div>
    </li>
  );
}
