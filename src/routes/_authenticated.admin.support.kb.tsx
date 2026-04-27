import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus, BarChart3, MessageSquare, FolderTree } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, StatusBadge, fmtRelative } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { adminListKbArticles } from "@/lib/kb-admin.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/kb")({
  head: () => seo({ title: "Knowledge base | Admin", description: "Help center articles & categories.", kind: "product", path: "/admin/support/kb", noindex: true }),
  component: KbPage,
});

function KbPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "kb"],
    queryFn: () => adminListKbArticles(),
  });
  const articles = data?.articles ?? [];
  const published = articles.filter((a) => a.status === "published").length;
  const drafts = articles.filter((a) => a.status === "draft").length;
  const totalViews = articles.reduce((s, a) => s + a.view_count, 0);

  return (
    <>
      <PageHeader
        eyebrow="Customer Support"
        title="Knowledge Base"
        description="Self-serve help centre articles, categories and analytics."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Knowledge base" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/support/kb/categories">
              <Button variant="outline" size="sm"><FolderTree className="mr-1 h-4 w-4" />Categories</Button>
            </Link>
            <Link to="/admin/support/kb/feedback">
              <Button variant="outline" size="sm"><MessageSquare className="mr-1 h-4 w-4" />Feedback</Button>
            </Link>
            <Link to="/admin/support/kb/analytics">
              <Button variant="outline" size="sm"><BarChart3 className="mr-1 h-4 w-4" />Analytics</Button>
            </Link>
            <Link to="/admin/support/kb/new">
              <Button size="sm" className="bg-gradient-brand"><Plus className="mr-1 h-4 w-4" />New article</Button>
            </Link>
          </div>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Articles" value={articles.length} />
          <StatCard label="Published" value={published} tone="success" />
          <StatCard label="Drafts" value={drafts} />
          <StatCard label="Total views" value={totalViews} />
        </div>
        <DataTable
          headers={["Title", "Slug", "Category", "Status", "Views", "Updated"]}
          empty={!isLoading && articles.length === 0 ? <EmptyState icon={BookOpen} title="No articles" description="Create your first KB article to help customers help themselves." /> : null}
        >
          {articles.map((a) => (
            <Tr key={a.id}>
              <Td className="font-medium">
                <Link to="/admin/support/kb/$id" params={{ id: a.id }} className="hover:text-primary">
                  {a.title}
                </Link>
              </Td>
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
