import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, fmtRelative } from "@/components/admin/data-shell";
import { Switch } from "@/components/ui/switch";
import { listForms } from "@/lib/cms.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/forms")({
  head: () => seo({ title: "Forms | Admin", description: "Marketing forms & lead capture.", kind: "product", path: "/admin/cms/forms", noindex: true }),
  component: FormsPage,
});

function FormsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "marketing-forms"], queryFn: () => listForms() });
  const forms = data?.forms ?? [];

  return (
    <>
      <PageHeader eyebrow="Content" title="Marketing Forms" description="Demo forms, contact forms, newsletter — all submissions land in Leads." breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Forms" }]} />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Forms" value={forms.length} />
          <StatCard label="Active" value={forms.filter((f) => f.is_active).length} tone="success" />
          <StatCard label="Submissions" value={forms.reduce((s, f) => s + f.submission_count, 0)} />
        </div>
        <DataTable
          headers={["Name", "Slug", "Target email", "Submissions", "Active", "Updated"]}
          empty={!isLoading && forms.length === 0 ? <EmptyState icon={ClipboardList} title="No forms yet" description="Built-in demo and contact forms feed Leads automatically." /> : null}
        >
          {forms.map((f) => (
            <Tr key={f.id}>
              <Td className="font-medium">{f.name}</Td>
              <Td mono>{f.slug}</Td>
              <Td className="text-muted-foreground">{f.target_email ?? "—"}</Td>
              <Td mono>{f.submission_count}</Td>
              <Td><Switch checked={f.is_active} disabled /></Td>
              <Td className="text-muted-foreground">{fmtRelative(f.updated_at)}</Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>
    </>
  );
}
