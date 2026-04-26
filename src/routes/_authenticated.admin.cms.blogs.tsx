import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, StatusBadge, fmtRelative } from "@/components/admin/data-shell";
import { listBlogPosts } from "@/lib/cms.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/blogs")({
  head: () => seo({ title: "Blogs | Admin", description: "Marketing blog posts.", kind: "product", path: "/admin/cms/blogs", noindex: true }),
  component: BlogsPage,
});

function BlogsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "blog-posts"], queryFn: () => listBlogPosts() });
  const posts = data?.posts ?? [];
  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;

  return (
    <>
      <PageHeader eyebrow="Content" title="Blog Posts" description="Marketing posts powering oqlio.com/blog." breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Blogs" }]} />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Posts" value={posts.length} />
          <StatCard label="Published" value={published} tone="success" />
          <StatCard label="Drafts" value={drafts} />
        </div>
        <DataTable
          headers={["Title", "Slug", "Category", "Tags", "Status", "Updated"]}
          empty={!isLoading && posts.length === 0 ? <EmptyState icon={FileText} title="No posts yet" description="Write your first marketing blog post." /> : null}
        >
          {posts.map((p) => (
            <Tr key={p.id}>
              <Td className="font-medium">{p.title}</Td>
              <Td mono>{p.slug}</Td>
              <Td>{p.category ?? "—"}</Td>
              <Td className="text-xs text-muted-foreground">{p.tags.join(", ") || "—"}</Td>
              <Td><StatusBadge status={p.status} /></Td>
              <Td className="text-muted-foreground">{fmtRelative(p.updated_at)}</Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>
    </>
  );
}
