import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { StatCard, DataTable, Td, Tr } from "@/components/admin/data-shell";
import { getKbAnalytics } from "@/lib/kb-admin.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/kb/analytics")({
  head: () => seo({ title: "KB analytics | Admin", description: "Search & deflection analytics", path: "/admin/support/kb/analytics", kind: "product", noindex: true }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data } = useQuery({ queryKey: ["kb-analytics"], queryFn: () => getKbAnalytics() });
  const a = data;
  return (
    <>
      <PageHeader eyebrow="KB" title="Search analytics" description="Last 30 days." breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Knowledge base", to: "/admin/support/kb" }, { label: "Analytics" }]} />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Articles" value={a?.totalArticles ?? 0} />
          <StatCard label="Searches" value={a?.totalSearches ?? 0} />
          <StatCard label="Tickets" value={a?.totalTickets ?? 0} />
          <StatCard label="Deflection ratio" value={a ? `${Math.round(a.deflectionRatio * 100)}%` : "—"} tone="success" />
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top searches</h2>
          <DataTable headers={["Query", "Count", "Avg results"]}>
            {(a?.topSearches ?? []).map((s) => (
              <Tr key={s.query}><Td mono>{s.query}</Td><Td>{s.count}</Td><Td>{s.avgResults.toFixed(1)}</Td></Tr>
            ))}
          </DataTable>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">No-result searches (article opportunities)</h2>
          <DataTable headers={["Query", "Count"]}>
            {(a?.noResultSearches ?? []).map((s) => (
              <Tr key={s.query}><Td mono>{s.query}</Td><Td>{s.count}</Td></Tr>
            ))}
          </DataTable>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top viewed articles</h2>
          <DataTable headers={["Title", "Slug", "Views"]}>
            {(a?.topArticles ?? []).map((x) => (
              <Tr key={x.slug}><Td>{x.title}</Td><Td mono>{x.slug}</Td><Td>{x.view_count}</Td></Tr>
            ))}
          </DataTable>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Worst-rated articles</h2>
          <DataTable headers={["Title", "Helpful", "Unhelpful", "Ratio"]}>
            {(a?.worstArticles ?? []).map((x) => (
              <Tr key={x.slug}><Td>{x.title}</Td><Td>{x.helpful_count}</Td><Td>{x.unhelpful_count}</Td><Td>{Math.round(x.ratio * 100)}%</Td></Tr>
            ))}
          </DataTable>
        </section>
      </PageBody>
    </>
  );
}
