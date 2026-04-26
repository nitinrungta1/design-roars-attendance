import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, StatusBadge, fmtRelative } from "@/components/admin/data-shell";
import { listCmsPages } from "@/lib/cms.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/pages")({
  head: () => seo({ title: "CMS · Pages | Admin", description: "Landing-page builder and publishing.", kind: "product", path: "/admin/cms/pages", noindex: true }),
  component: PagesPage,
});

function PagesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "cms-pages"], queryFn: () => listCmsPages() });
  const pages = data?.pages ?? [];
  const published = pages.filter((p) => p.status === "published").length;

  return (
    <>
      <PageHeader eyebrow="Content" title="Pages" description="Landing pages, legal pages, and static content." breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Pages" }]} />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Pages" value={pages.length} />
          <StatCard label="Published" value={published} tone="success" />
          <StatCard label="No-index" value={pages.filter((p) => p.noindex).length} />
        </div>
        <DataTable
          headers={["Title", "Slug", "Status", "No-index", "Updated"]}
          empty={!isLoading && pages.length === 0 ? <EmptyState icon={Layout} title="No pages yet" description="Add a landing page to get started." /> : null}
        >
          {pages.map((p) => (
            <Tr key={p.id}>
              <Td className="font-medium">{p.title}</Td>
              <Td mono>/{p.slug}</Td>
              <Td><StatusBadge status={p.status} /></Td>
              <Td>{p.noindex ? "Yes" : "—"}</Td>
              <Td className="text-muted-foreground">{fmtRelative(p.updated_at)}</Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>
    </>
  );
}
