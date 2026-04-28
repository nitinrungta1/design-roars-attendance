import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { upsertKbArticle } from "@/lib/kb-admin.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/kb/new")({
  head: () => seo({ title: "New article | Admin", description: "Create KB article", path: "/admin/support/kb/new", kind: "product", noindex: true }),
  component: NewArticlePage,
});

function NewArticlePage() {
  const upsert = useServerFn(upsertKbArticle);
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const autoSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await upsert({
        data: { title, slug: slug || autoSlug(title), excerpt, body, category: category || null, status },
      });
      if (res.ok) {
        toast.success("Article created");
        nav({ to: "/admin/support/kb" });
      } else {
        console.error("upsertKbArticle failed", res);
        setErrorMsg(res.error);
        toast.error(res.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unexpected error creating article";
      console.error("upsertKbArticle threw", err);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="KB" title="New article" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Knowledge base", to: "/admin/support/kb" }, { label: "New" }]} />
      <PageBody>
        <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(autoSlug(e.target.value)); }} required maxLength={300} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} required maxLength={160} />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} maxLength={120} placeholder="Getting Started" />
            </div>
          </div>
          <div>
            <Label>Excerpt</Label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={1000} rows={2} />
          </div>
          <div>
            <Label>Body (HTML)</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} className="font-mono text-sm" />
          </div>
          <div>
            <Label>Status</Label>
            <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <Button type="submit" disabled={loading} className="bg-gradient-brand">Create article</Button>
        </form>
      </PageBody>
    </>
  );
}
