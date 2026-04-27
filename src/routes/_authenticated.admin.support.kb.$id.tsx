import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { adminGetKbArticle, upsertKbArticle, deleteKbArticle } from "@/lib/kb-admin.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/kb/$id")({
  head: () => seo({ title: "Edit article | Admin", description: "Edit KB article", path: "/admin/support/kb", kind: "product", noindex: true }),
  loader: ({ params }) => adminGetKbArticle({ data: { id: params.id } }),
  component: EditArticlePage,
});

function EditArticlePage() {
  const { article, tags } = Route.useLoaderData();
  const upsert = useServerFn(upsertKbArticle);
  const del = useServerFn(deleteKbArticle);
  const nav = useNavigate();
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [category, setCategory] = useState(article?.category ?? "");
  const [status, setStatus] = useState<"draft" | "published" | "archived">(article?.status ?? "draft");
  const [seoTitle, setSeoTitle] = useState(article?.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(article?.seo_description ?? "");
  const [tagStr, setTagStr] = useState(tags.join(", "));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setSlug(article.slug);
    }
  }, [article]);

  if (!article) return <PageBody>Article not found.</PageBody>;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await upsert({
      data: {
        id: article.id,
        title,
        slug,
        excerpt,
        body,
        category: category || null,
        status,
        seo_title: seoTitle || null,
        seo_description: seoDesc || null,
        tags: tagStr.split(",").map((t) => t.trim()).filter(Boolean),
      },
    });
    setLoading(false);
    if (res.ok) toast.success("Saved");
    else toast.error(res.error);
  };

  const onDelete = async () => {
    if (!confirm("Delete this article?")) return;
    const res = await del({ data: { id: article.id } });
    if (res.ok) {
      toast.success("Deleted");
      nav({ to: "/admin/support/kb" });
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="KB"
        title={`Edit: ${article.title}`}
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Knowledge base", to: "/admin/support/kb" }, { label: "Edit" }]}
        actions={<Button variant="outline" size="sm" onClick={onDelete}>Delete</Button>}
      />
      <PageBody>
        <form onSubmit={onSave} className="mx-auto max-w-3xl space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={300} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} required maxLength={160} /></div>
            <div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={120} /></div>
          </div>
          <div><Label>Excerpt</Label><Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={1000} rows={2} /></div>
          <div><Label>Body (HTML)</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={16} className="font-mono text-sm" /></div>
          <div><Label>Tags (comma separated)</Label><Input value={tagStr} onChange={(e) => setTagStr(e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>SEO title</Label><Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={200} /></div>
            <div><Label>Status</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published" | "archived")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div><Label>SEO description</Label><Textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} maxLength={400} rows={2} /></div>
          <Button type="submit" disabled={loading} className="bg-gradient-brand">Save changes</Button>
        </form>
      </PageBody>
    </>
  );
}
