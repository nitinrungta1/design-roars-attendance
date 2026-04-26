import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate, StatCard } from "@/components/admin/data-shell";
import { Badge } from "@/components/ui/badge";
import { listInvoices, type InvoiceStatus } from "@/lib/billing.functions";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/billing/invoices")({
  head: () =>
    seo({
      title: "Invoices | Admin",
      description: "Customer invoices.",
      kind: "product",
      path: "/admin/billing/invoices",
      noindex: true,
    }),
  component: InvoicesPage,
});

const TONES: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  void: "bg-muted text-muted-foreground line-through",
  uncollectible: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
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

function InvoicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "invoices"],
    queryFn: () => listInvoices(),
  });

  const invoices = data?.invoices ?? [];
  const totals = {
    all: invoices.length,
    paid: invoices.filter((i) => i.status === "paid").length,
    open: invoices.filter((i) => i.status === "open").length,
    revenue: invoices.filter((i) => i.status === "paid").reduce((a, i) => a + i.amount_paid, 0),
  };

  return (
    <>
      <PageHeader
        eyebrow="Sales & Billing"
        title="Invoices"
        description="Invoices, GST/VAT, retries — all in one ledger."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Invoices" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Total invoices" value={totals.all} />
          <StatCard label="Paid" value={totals.paid} tone="success" />
          <StatCard label="Open" value={totals.open} tone="warning" />
          <StatCard
            label="Collected"
            value={fmtMoney(totals.revenue, invoices[0]?.currency ?? "INR")}
            tone="success"
          />
        </div>

        <DataTable
          headers={["Number", "Company", "Status", "Total", "Paid", "Due", "Issued"]}
          empty={
            !isLoading && invoices.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No invoices yet"
                description="Invoices appear here as soon as billing runs generate them."
              />
            ) : null
          }
        >
          {invoices.map((i) => (
            <Tr key={i.id}>
              <Td mono>{i.number}</Td>
              <Td>{i.company_name}</Td>
              <Td>
                <Badge variant="secondary" className={cn("rounded-full capitalize", TONES[i.status])}>
                  {i.status}
                </Badge>
              </Td>
              <Td mono>{fmtMoney(i.total, i.currency)}</Td>
              <Td mono className="text-emerald-600 dark:text-emerald-400">
                {fmtMoney(i.amount_paid, i.currency)}
              </Td>
              <Td className="text-muted-foreground">{i.due_at ? fmtDate(i.due_at) : "—"}</Td>
              <Td className="text-muted-foreground">{fmtDate(i.created_at)}</Td>
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
