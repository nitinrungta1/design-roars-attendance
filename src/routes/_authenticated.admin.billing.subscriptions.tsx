import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Repeat } from "lucide-react";
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
  listSubscriptions,
  updateSubscriptionStatus,
  SUBSCRIPTION_STATUSES,
  type SubscriptionStatus,
} from "@/lib/billing.functions";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/billing/subscriptions")({
  head: () =>
    seo({
      title: "Subscriptions | Admin",
      description: "Active customer subscriptions.",
      kind: "product",
      path: "/admin/billing/subscriptions",
      noindex: true,
    }),
  component: SubsPage,
});

const STATUS_TONES: Record<SubscriptionStatus, string> = {
  trialing: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  past_due: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  canceled: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  paused: "bg-muted text-muted-foreground",
  incomplete: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
};

function SubsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: () => listSubscriptions(),
  });

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: SubscriptionStatus }) =>
      updateSubscriptionStatus({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Status updated");
        qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
      } else toast.error(res.error);
    },
  });

  const subs = data?.subscriptions ?? [];
  const totals = {
    all: subs.length,
    active: subs.filter((s) => s.status === "active").length,
    trialing: subs.filter((s) => s.status === "trialing").length,
    canceled: subs.filter((s) => s.status === "canceled").length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Sales & Billing"
        title="Subscriptions"
        description="Recurring revenue across all customers."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Subscriptions" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={totals.all} />
          <StatCard label="Active" value={totals.active} tone="success" />
          <StatCard label="Trialing" value={totals.trialing} tone="warning" />
          <StatCard label="Canceled" value={totals.canceled} tone="danger" />
        </div>

        <DataTable
          headers={["Company", "Plan", "Cycle", "Status", "Trial Ends", "Renews", "Provider", "Seats"]}
          empty={
            !isLoading && subs.length === 0 ? (
              <EmptyState
                icon={Repeat}
                title="No subscriptions yet"
                description="Subscriptions appear here once customers upgrade."
              />
            ) : null
          }
        >
          {subs.map((s) => (
            <Tr key={s.id}>
              <Td>
                <div className="font-medium">{s.company_name}</div>
              </Td>
              <Td>{s.plan_name ?? "—"}</Td>
              <Td className="capitalize">{s.cycle}</Td>
              <Td>
                <Select
                  value={s.status}
                  onValueChange={(v) => mut.mutate({ id: s.id, status: v as SubscriptionStatus })}
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue>
                      <Badge variant="secondary" className={cn("rounded-full", STATUS_TONES[s.status])}>
                        {s.status.replace("_", " ")}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_STATUSES.map((st) => (
                      <SelectItem key={st} value={st} className="capitalize">
                        {st.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Td>
              <Td className="text-muted-foreground">
                {s.trial_end ? fmtDate(s.trial_end) : "—"}
              </Td>
              <Td className="text-muted-foreground">
                {s.current_period_end ? fmtDate(s.current_period_end) : "—"}
              </Td>
              <Td className="capitalize">{s.provider}</Td>
              <Td>{s.seats}</Td>
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
