import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus, BarChart3, MessageSquare, FolderTree, AlertTriangle } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, StatusBadge, fmtRelative } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { adminListKbArticles } from "@/lib/kb-admin.functions";
import { seo } from "@/lib/seo";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin/support/kb")({
  head: () => seo({ title: "Knowledge base | Admin", description: "Help center articles & categories.", kind: "product", path: "/admin/support/kb", noindex: true }),
  component: KbPage,
});

function KbPage() {
  const { hasPermission, hasAnyRole, loading: authLoading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const canRead =
    isSuperAdmin ||
    hasPermission("support.kb.read") ||
    hasPermission("support.kb.write") ||
    hasAnyRole(["admin", "hr", "support"]);
  const canWrite = isSuperAdmin || hasPermission("support.kb.write") || hasAnyRole(["admin", "support"]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "kb"],
    queryFn: () => adminListKbArticles(),
    retry: 1,
    enabled: !authLoading && canRead,
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
            <Button
              type="button"
              size="sm"
              className="bg-gradient-brand"
              disabled={authLoading || !canWrite}
              title={canWrite ? "Create article" : "Requires support.kb.write permission"}
              onClick={() => navigate({ to: "/admin/support/kb/new" })}
            >
              <Plus className="mr-1 h-4 w-4" />New article
            </Button>
          </div>
        }
      />
      <PageBody className="space-y-6">
        {!authLoading && !canRead && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
            <p className="font-semibold text-amber-600 dark:text-amber-400">Access denied</p>
            <p className="mt-1 text-muted-foreground">
              Your account does not have permission to view the Knowledge Base. Ask a super admin to grant you the
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">support.kb.read</code> permission.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Articles" value={articles.length} />
          <StatCard label="Published" value={published} tone="success" />
          <StatCard label="Drafts" value={drafts} />
          <StatCard label="Total views" value={totalViews} />
        </div>

        {error && (
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-destructive">Failed to load articles</p>
                <p className="mt-1 text-xs text-muted-foreground break-words">
                  {(error as Error)?.message ?? "Unknown error"}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Retrying…" : "Retry"}
            </Button>
          </div>
        )}

        <DataTable
          headers={["Title", "Slug", "Category", "Status", "Views", "Updated"]}
          empty={!isLoading && !error && articles.length === 0 ? <EmptyState icon={BookOpen} title="No articles" description="Create your first KB article to help customers help themselves." /> : null}
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
