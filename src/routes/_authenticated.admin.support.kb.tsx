import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, StatusBadge, fmtRelative } from "@/components/admin/data-shell";
import { listKbArticles } from "@/lib/support.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/kb")({
  head: () => seo({ title: "Knowledge base | Admin", description: "Help center articles & categories.", kind: "product", path: "/admin/support/kb", noindex: true }),
  component: KbPage,
});

function KbPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "kb"], queryFn: () => listKbArticles() });
  const articles = data?.articles ?? [];
  const published = articles.filter((a) => a.status === "published").length;
  const drafts = articles.filter((a) => a.status === "draft").length;

  return (
    <>
      <PageHeader eyebrow="Customer Support" title="Knowledge Base" description="Self-serve help center articles." breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Knowledge base" }]} />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Articles" value={articles.length} />
          <StatCard label="Published" value={published} tone="success" />
          <StatCard label="Drafts" value={drafts} />
        </div>
        <DataTable
          headers={["Title", "Slug", "Category", "Status", "Views", "Updated"]}
          empty={!isLoading && articles.length === 0 ? <EmptyState icon={BookOpen} title="No articles" description="Create your first KB article to help customers help themselves." /> : null}
        >
          {articles.map((a) => (
            <Tr key={a.id}>
              <Td className="font-medium">{a.title}</Td>
              <Td mono>{a.slug}</Td>
              <Td>{a.category ?? "—"}</Td>
              <Td><StatusBadge status={a.status} /></Td>
              <Td mono>{a.view_count}</Td>
              <Td className="text-muted-foreground">{fmtRelative(a.updated_at)}</Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>
    </>
  );
}
