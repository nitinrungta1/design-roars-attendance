import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard } from "@/components/admin/data-shell";
import { listWorkforceTeams } from "@/lib/workforce-pro.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/teams")({
  head: () =>
    seo({
      title: "Teams | Admin",
      description: "Cross-functional teams across all tenants.",
      kind: "product",
      path: "/admin/workforce/teams",
      noindex: true,
    }),
  component: TeamsPage,
});

function TeamsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "teams"],
    queryFn: () => listWorkforceTeams(),
  });

  const rows = data?.rows ?? [];
  const totalMembers = rows.reduce((s, r) => s + r.member_count, 0);

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Teams"
        description="Cross-functional teams. Manage membership and leads from Access Control → Teams."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Teams" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Teams" value={rows.length} />
          <StatCard label="Total members" value={totalMembers} />
          <StatCard
            label="Avg team size"
            value={rows.length ? Math.round(totalMembers / rows.length) : 0}
          />
        </div>

        <DataTable
          headers={["Team", "Lead", "Members", "Description"]}
          empty={
            !isLoading && rows.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No teams yet"
                description="Create teams under Access Control to enable team-scoped permissions."
              />
            ) : null
          }
        >
          {rows.map((r) => (
            <Tr key={r.id}>
              <Td>
                <div className="font-medium">{r.name}</div>
              </Td>
              <Td className="text-muted-foreground">{r.lead_name ?? "—"}</Td>
              <Td>{r.member_count}</Td>
              <Td className="max-w-md truncate text-muted-foreground">{r.description ?? "—"}</Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>
    </>
  );
}
