import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtRelative, StatCard } from "@/components/admin/data-shell";
import { Badge } from "@/components/ui/badge";
import { listPayments } from "@/lib/billing.functions";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/billing/payments")({
  head: () =>
    seo({
      title: "Payments | Admin",
      description: "Payment log and refunds.",
      kind: "product",
      path: "/admin/billing/payments",
      noindex: true,
    }),
  component: PaymentsPage,
});

const TONES: Record<string, string> = {
  succeeded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  failed: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  refunded: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  pending: "bg-muted text-muted-foreground",
};

function fmtMoney(n: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: () => listPayments(),
  });

  const payments = data?.payments ?? [];
  const totals = {
    all: payments.length,
    succeeded: payments.filter((p) => p.status === "succeeded").length,
    failed: payments.filter((p) => p.status === "failed").length,
    collected: payments
      .filter((p) => p.status === "succeeded")
      .reduce((a, p) => a + p.amount, 0),
  };

  return (
    <>
      <PageHeader
        eyebrow="Sales & Billing"
        title="Payments"
        description="Every charge across Stripe, Razorpay, PayPal, and manual receipts."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Payments" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Total payments" value={totals.all} />
          <StatCard label="Succeeded" value={totals.succeeded} tone="success" />
          <StatCard label="Failed" value={totals.failed} tone="danger" />
          <StatCard
            label="Collected"
            value={fmtMoney(totals.collected, payments[0]?.currency ?? "INR")}
            tone="success"
          />
        </div>

        <DataTable
          headers={["Company", "Invoice", "Amount", "Status", "Method", "Provider", "When"]}
          empty={
            !isLoading && payments.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No payments yet"
                description="Payments will appear here as soon as customers pay."
              />
            ) : null
          }
        >
          {payments.map((p) => (
            <Tr key={p.id}>
              <Td>{p.company_name}</Td>
              <Td mono>{p.invoice_number ?? "—"}</Td>
              <Td mono>{fmtMoney(p.amount, p.currency)}</Td>
              <Td>
                <Badge variant="secondary" className={cn("rounded-full capitalize", TONES[p.status])}>
                  {p.status}
                </Badge>
              </Td>
              <Td>{p.method ?? "—"}</Td>
              <Td className="capitalize">{p.provider}</Td>
              <Td className="text-muted-foreground">{fmtRelative(p.created_at)}</Td>
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
