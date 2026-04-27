import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, StatusBadge, fmtRelative } from "@/components/admin/data-shell";
import {
  FiltersBar,
  StatusFilter,
  BulkActionBar,
  RowCheckbox,
  ConfirmDelete,
  useSelection,
  slugify,
} from "@/components/admin/cms-shell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  listCmsPages,
  getCmsPage,
  upsertCmsPage,
  deleteCmsPage,
  bulkCmsPages,
  POST_STATUSES,
  type CmsPageRow,
  type PostStatus,
} from "@/lib/cms.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/pages")({
  head: () => seo({ title: "CMS · Pages | Admin", description: "Landing-page builder and publishing.", kind: "product", path: "/admin/cms/pages", noindex: true }),
  component: PagesPage,
});

const STATUS_OPTIONS = POST_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));

function PagesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "cms-pages"], queryFn: () => listCmsPages() });
  const pages = data?.pages ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editorId, setEditorId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CmsPageRow | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pages.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });
  }, [pages, search, statusFilter]);

  const sel = useSelection(filtered);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "cms-pages"] });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteCmsPage({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) { toast.success("Page deleted"); refresh(); }
      else toast.error(res.error);
    },
  });

  const bulkMut = useMutation({
    mutationFn: (action: "publish" | "archive" | "draft" | "delete") =>
      bulkCmsPages({ data: { ids: sel.ids, action } }),
    onSuccess: (res) => {
      if (res.ok) { toast.success(`${res.count} pages updated`); sel.clear(); refresh(); }
      else toast.error(res.error);
    },
  });

  const openNew = () => { setEditorId(null); setEditorOpen(true); };
  const openEdit = (id: string) => { setEditorId(id); setEditorOpen(true); };

  const published = pages.filter((p) => p.status === "published").length;

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Pages"
        description="Landing pages, legal pages, and static content."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Pages" }]}
        actions={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New page</Button>}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Pages" value={pages.length} />
          <StatCard label="Published" value={published} tone="success" />
          <StatCard label="No-index" value={pages.filter((p) => p.noindex).length} />
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
          filters={<StatusFilter value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />}
        />

        <DataTable
          headers={["", "Title", "Slug", "Status", "No-index", "Updated", ""]}
          empty={!isLoading && filtered.length === 0 ? <EmptyState icon={Layout} title="No pages match" description="Try clearing filters or add a new page." action={<Button onClick={openNew}>New page</Button>} /> : null}
        >
          {filtered.map((p) => (
            <Tr key={p.id}>
              <Td><RowCheckbox checked={sel.selected.has(p.id)} onChange={() => sel.toggle(p.id)} /></Td>
              <Td className="font-medium">{p.title}</Td>
              <Td mono>/{p.slug}</Td>
              <Td><StatusBadge status={p.status} /></Td>
              <Td>{p.noindex ? "Yes" : "—"}</Td>
              <Td className="text-muted-foreground">{fmtRelative(p.updated_at)}</Td>
              <Td>
                <div className="flex items-center justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p.id)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setPendingDelete(p)}>Delete</Button>
                </div>
              </Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>

      <PageEditor
        open={editorOpen}
        id={editorId}
        onOpenChange={(v) => { setEditorOpen(v); if (!v) setEditorId(null); }}
        onSaved={refresh}
      />

      <ConfirmDelete
        open={!!pendingDelete}
        onOpenChange={(v) => { if (!v) setPendingDelete(null); }}
        title={`Delete "${pendingDelete?.title ?? ""}"?`}
        description="This permanently removes the page. This cannot be undone."
        onConfirm={() => { if (pendingDelete) { delMut.mutate(pendingDelete.id); setPendingDelete(null); } }}
      />

      <ConfirmDelete
        open={bulkConfirm}
        onOpenChange={setBulkConfirm}
        title={`Delete ${sel.count} pages?`}
        description="Selected pages will be permanently removed. This cannot be undone."
        onConfirm={() => { bulkMut.mutate("delete"); setBulkConfirm(false); }}
        confirmLabel={`Delete ${sel.count}`}
      />
    </>
  );
}

function PageEditor({
  open,
  id,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  id: string | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { data } = useQuery({
    queryKey: ["admin", "cms-page", id],
    queryFn: () => getCmsPage({ data: { id: id! } }),
    enabled: !!id && open,
  });
  const existing = data?.page ?? null;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [noindex, setNoindex] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");

  useEffect(() => {
    if (open && existing) {
      setTitle(existing.title); setSlug(existing.slug); setBody(existing.body ?? "");
      setStatus(existing.status); setNoindex(existing.noindex);
      setSeoTitle(existing.seo_title ?? ""); setSeoDesc(existing.seo_description ?? "");
    } else if (open && !id) {
      setTitle(""); setSlug(""); setBody(""); setStatus("draft"); setNoindex(false); setSeoTitle(""); setSeoDesc("");
    }
  }, [open, id, existing]);

  const save = useMutation({
    mutationFn: () => upsertCmsPage({
      data: {
        id: id ?? undefined,
        title, slug, body: body || null,
        status, noindex,
        seo_title: seoTitle || null,
        seo_description: seoDesc || null,
      },
    }),
    onSuccess: (res) => {
      if (res.ok) { toast.success("Page saved"); onSaved(); onOpenChange(false); }
      else toast.error(res.error);
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{id ? "Edit page" : "New page"}</SheetTitle>
          <SheetDescription>Static content for marketing & legal pages.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => { setTitle(e.target.value); if (!id && !slug) setSlug(slugify(e.target.value)); }} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="terms-of-service" />
          </div>
          <div>
            <Label>Body (Markdown / HTML)</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="font-mono text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POST_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-between rounded-md border border-border px-3 py-2">
              <Label htmlFor="noindex">No-index</Label>
              <Switch id="noindex" checked={noindex} onCheckedChange={setNoindex} />
            </div>
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
              {save.isPending ? "Saving…" : "Save page"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
