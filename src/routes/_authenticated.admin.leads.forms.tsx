import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtRelative } from "@/components/admin/data-shell";
import { listDemoRequests } from "@/lib/crm.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/leads/forms")({
  head: () =>
    seo({
      title: "Form Submissions | Admin",
      description: "Demo requests and contact form submissions.",
      kind: "product",
      path: "/admin/leads/forms",
      noindex: true,
    }),
  component: FormSubmissionsPage,
});

function FormSubmissionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "demo-requests"],
    queryFn: () => listDemoRequests(),
  });

  const demos = data?.demos ?? [];

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Form submissions"
        description="Demo requests submitted from the marketing website."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Form submissions" }]}
      />
      <PageBody>
        <DataTable
          headers={["Name", "Email", "Company", "Team size", "Preferred time", "Source", "Submitted"]}
          empty={
            !isLoading && demos.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No demo requests yet"
                description="When someone books a demo on the website it will appear here."
              />
            ) : null
          }
        >
          {demos.map((d) => (
            <Tr key={d.id}>
              <Td className="font-medium">{d.name}</Td>
              <Td className="text-muted-foreground">{d.email}</Td>
              <Td className="text-muted-foreground">{d.company ?? "—"}</Td>
              <Td className="text-muted-foreground">{d.team_size ?? "—"}</Td>
              <Td className="text-muted-foreground">{d.preferred_time ?? "—"}</Td>
              <Td className="text-muted-foreground">{d.source ?? "—"}</Td>
              <Td className="text-muted-foreground">
                {fmtRelative(d.created_at as string)}
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
