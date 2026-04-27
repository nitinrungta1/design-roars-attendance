import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, StatusBadge, fmtRelative } from "@/components/admin/data-shell";
import {
  FiltersBar, StatusFilter, BulkActionBar, RowCheckbox, ConfirmDelete, useSelection, slugify,
} from "@/components/admin/cms-shell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  listBlogPosts, getBlogPost, upsertBlogPost, deleteBlogPost, bulkBlogPosts,
  POST_STATUSES, type BlogPostRow, type PostStatus,
} from "@/lib/cms.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/blogs")({
  head: () => seo({ title: "Blogs | Admin", description: "Marketing blog posts.", kind: "product", path: "/admin/cms/blogs", noindex: true }),
  component: BlogsPage,
});

const STATUS_OPTIONS = POST_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));

function BlogsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "blog-posts"], queryFn: () => listBlogPosts() });
  const posts = data?.posts ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editorId, setEditorId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BlogPostRow | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.excerpt ?? "").toLowerCase().includes(q);
    });
  }, [posts, search, statusFilter, categoryFilter]);

  const sel = useSelection(filtered);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "blog-posts"] });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteBlogPost({ data: { id } }),
    onSuccess: (res) => { if (res.ok) { toast.success("Post deleted"); refresh(); } else toast.error(res.error); },
  });
  const bulkMut = useMutation({
    mutationFn: (action: "publish" | "archive" | "draft" | "delete") => bulkBlogPosts({ data: { ids: sel.ids, action } }),
    onSuccess: (res) => { if (res.ok) { toast.success(`${res.count} posts updated`); sel.clear(); refresh(); } else toast.error(res.error); },
  });

  const openNew = () => { setEditorId(null); setEditorOpen(true); };
  const openEdit = (id: string) => { setEditorId(id); setEditorOpen(true); };

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Blog Posts"
        description="Marketing posts powering oqlio.com/blog."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Blogs" }]}
        actions={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New post</Button>}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Posts" value={posts.length} />
          <StatCard label="Published" value={posts.filter((p) => p.status === "published").length} tone="success" />
          <StatCard label="Drafts" value={posts.filter((p) => p.status === "draft").length} />
        </div>

        <BulkActionBar
          count={sel.count}
          onClear={sel.clear}
          actions={[
            { label: "Publish", onClick: () => bulkMut.mutate("publish") },
            { label: "Move to draft", onClick: () => bulkMut.mutate("draft") },
            { label: "Archive", onClick: () => bulkMut.mutate("archive") },
            { label: "Delete", tone: "danger", onClick: () => setBulkConfirm(true) },
          ]}
        />

        <FiltersBar
          search={search}
          onSearch={setSearch}
          filters={
            <>
              <StatusFilter value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
              {categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </>
          }
        />

        <DataTable
          headers={["", "Title", "Slug", "Category", "Tags", "Status", "Updated", ""]}
          empty={!isLoading && filtered.length === 0 ? <EmptyState icon={FileText} title="No posts match" description="Try clearing filters or write a new post." action={<Button onClick={openNew}>New post</Button>} /> : null}
        >
          {filtered.map((p) => (
            <Tr key={p.id}>
              <Td><RowCheckbox checked={sel.selected.has(p.id)} onChange={() => sel.toggle(p.id)} /></Td>
              <Td className="font-medium">{p.title}</Td>
              <Td mono>{p.slug}</Td>
              <Td>{p.category ?? "—"}</Td>
              <Td className="text-xs text-muted-foreground">{p.tags.join(", ") || "—"}</Td>
              <Td><StatusBadge status={p.status} /></Td>
              <Td className="text-muted-foreground">{fmtRelative(p.updated_at)}</Td>
              <Td>
                <div className="flex items-center justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p.id)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setPendingDelete(p)}>Delete</Button>
                </div>
              </Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>

      <BlogEditor
        open={editorOpen}
        id={editorId}
        onOpenChange={(v) => { setEditorOpen(v); if (!v) setEditorId(null); }}
        onSaved={refresh}
      />

      <ConfirmDelete
        open={!!pendingDelete}
        onOpenChange={(v) => { if (!v) setPendingDelete(null); }}
        title={`Delete "${pendingDelete?.title ?? ""}"?`}
        description="This permanently removes the blog post. This cannot be undone."
        onConfirm={() => { if (pendingDelete) { delMut.mutate(pendingDelete.id); setPendingDelete(null); } }}
      />
      <ConfirmDelete
        open={bulkConfirm}
        onOpenChange={setBulkConfirm}
        title={`Delete ${sel.count} posts?`}
        description="Selected posts will be permanently removed."
        onConfirm={() => { bulkMut.mutate("delete"); setBulkConfirm(false); }}
        confirmLabel={`Delete ${sel.count}`}
      />
    </>
  );
}

function BlogEditor({
  open, id, onOpenChange, onSaved,
}: { open: boolean; id: string | null; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const { data } = useQuery({
    queryKey: ["admin", "blog-post", id],
    queryFn: () => getBlogPost({ data: { id: id! } }),
    enabled: !!id && open,
  });
  const existing = data?.post ?? null;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [cover, setCover] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");

  useEffect(() => {
    if (open && existing) {
      setTitle(existing.title); setSlug(existing.slug);
      setExcerpt(existing.excerpt ?? ""); setBody(existing.body ?? "");
      setCover(existing.cover_url ?? ""); setCategory(existing.category ?? "");
      setTags(existing.tags.join(", ")); setStatus(existing.status);
      setSeoTitle(existing.seo_title ?? ""); setSeoDesc(existing.seo_description ?? "");
    } else if (open && !id) {
      setTitle(""); setSlug(""); setExcerpt(""); setBody(""); setCover(""); setCategory(""); setTags(""); setStatus("draft"); setSeoTitle(""); setSeoDesc("");
    }
  }, [open, id, existing]);

  const save = useMutation({
    mutationFn: () => upsertBlogPost({
      data: {
        id: id ?? undefined,
        title, slug,
        excerpt: excerpt || null,
        body: body || null,
        cover_url: cover || null,
        category: category || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        status,
        seo_title: seoTitle || null,
        seo_description: seoDesc || null,
      },
    }),
    onSuccess: (res) => { if (res.ok) { toast.success("Post saved"); onSaved(); onOpenChange(false); } else toast.error(res.error); },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{id ? "Edit blog post" : "New blog post"}</SheetTitle>
          <SheetDescription>Marketing content for the public blog.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => { setTitle(e.target.value); if (!id && !slug) setSlug(slugify(e.target.value)); }} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div>
            <Label>Excerpt</Label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Body (Markdown)</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="font-mono text-xs" />
          </div>
          <div>
            <Label>Cover image URL</Label>
            <Input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{POST_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="hr, attendance, payroll" />
          </div>
          <div>
            <Label>SEO title</Label>
            <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          </div>
          <div>
            <Label>SEO description</Label>
            <Textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !title || !slug}>
              {save.isPending ? "Saving…" : "Save post"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
