import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate } from "@/components/admin/data-shell";
import { listUsage } from "@/lib/customers.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/customers/usage")({
  head: () =>
    seo({
      title: "Usage | Admin",
      description: "Per-tenant usage rollups.",
      kind: "product",
      path: "/admin/customers/usage",
      noindex: true,
    }),
  component: UsagePage,
});

function UsagePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "usage"],
    queryFn: () => listUsage(),
  });

  const usage = data?.usage ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Usage"
        description="Daily activity rollups per tenant. Powers billing and trial-to-paid intelligence."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Usage" }]}
      />
      <PageBody>
        <DataTable
          headers={["Date", "Company", "Employees", "Active", "Check-ins", "API"]}
          empty={
            !isLoading && usage.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No usage rollups yet"
                description="Once daily aggregation runs, per-tenant counters will appear here."
              />
            ) : null
          }
        >
          {usage.map((u) => (
            <Tr key={`${u.company_id}-${u.metric_date}`}>
              <Td className="text-muted-foreground">{fmtDate(u.metric_date)}</Td>
              <Td className="font-medium">{u.company_name}</Td>
              <Td>{u.employees.toLocaleString()}</Td>
              <Td>{u.active_users.toLocaleString()}</Td>
              <Td>{u.checkins.toLocaleString()}</Td>
              <Td>{u.api_calls.toLocaleString()}</Td>
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
