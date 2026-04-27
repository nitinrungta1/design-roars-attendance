import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, fmtRelative } from "@/components/admin/data-shell";
import {
  FiltersBar, RowCheckbox, ConfirmDelete, useSelection,
} from "@/components/admin/cms-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { listMedia, addMedia, deleteMedia, type MediaRow } from "@/lib/cms.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/media")({
  head: () => seo({ title: "Media library | Admin", description: "Uploaded images & assets.", kind: "product", path: "/admin/cms/media", noindex: true }),
  component: MediaPage,
});

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function MediaPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "media"], queryFn: () => listMedia() });
  const media = data?.media ?? [];

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "other">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MediaRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return media.filter((m) => {
      if (typeFilter === "image" && !m.mime_type?.startsWith("image/")) return false;
      if (typeFilter === "other" && m.mime_type?.startsWith("image/")) return false;
      if (!q) return true;
      return m.file_name.toLowerCase().includes(q) || (m.alt_text ?? "").toLowerCase().includes(q);
    });
  }, [media, search, typeFilter]);

  const sel = useSelection(filtered);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "media"] });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteMedia({ data: { id } }),
    onSuccess: (res) => { if (res.ok) { toast.success("File removed"); refresh(); } else toast.error(res.error); },
  });

  const totalBytes = media.reduce((s, m) => s + Number(m.size_bytes ?? 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Media Library"
        description="Images and assets used across blogs, pages, and emails."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Media" }]}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add file</Button>}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Files" value={media.length} />
          <StatCard label="Storage" value={fmtBytes(totalBytes)} />
          <StatCard label="Images" value={media.filter((m) => m.mime_type?.startsWith("image/")).length} />
        </div>

        <FiltersBar
          search={search}
          onSearch={setSearch}
          filters={
            <div className="flex gap-1 rounded-md border border-border p-1">
              {(["all", "image", "other"] as const).map((v) => (
                <button key={v} onClick={() => setTypeFilter(v)}
                  className={`rounded px-3 py-1 text-xs font-medium capitalize ${typeFilter === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {v}
                </button>
              ))}
            </div>
          }
        />

        <DataTable
          headers={["", "Preview", "File", "Type", "Size", "Alt", "Uploaded", ""]}
          empty={!isLoading && filtered.length === 0 ? <EmptyState icon={ImageIcon} title="No media yet" description="Add images to use across your site & emails." action={<Button onClick={() => setAddOpen(true)}>Add file</Button>} /> : null}
        >
          {filtered.map((m) => (
            <Tr key={m.id}>
              <Td><RowCheckbox checked={sel.selected.has(m.id)} onChange={() => sel.toggle(m.id)} /></Td>
              <Td>
                {m.mime_type?.startsWith("image/") ? (
                  <img src={m.url} alt={m.alt_text ?? ""} className="h-10 w-10 rounded object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">FILE</div>
                )}
              </Td>
              <Td className="font-medium">
                <a href={m.url} target="_blank" rel="noreferrer" className="hover:underline">{m.file_name}</a>
              </Td>
              <Td mono>{m.mime_type ?? "—"}</Td>
              <Td>{fmtBytes(Number(m.size_bytes ?? 0))}</Td>
              <Td className="text-muted-foreground">{m.alt_text ?? "—"}</Td>
              <Td className="text-muted-foreground">{fmtRelative(m.created_at)}</Td>
              <Td>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setPendingDelete(m)}>Delete</Button>
              </Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>

      <AddMediaDialog open={addOpen} onOpenChange={setAddOpen} onSaved={refresh} />

      <ConfirmDelete
        open={!!pendingDelete}
        onOpenChange={(v) => { if (!v) setPendingDelete(null); }}
        title={`Remove "${pendingDelete?.file_name ?? ""}"?`}
        description="This removes the metadata record. The file itself remains at its URL until removed from storage."
        onConfirm={() => { if (pendingDelete) { delMut.mutate(pendingDelete.id); setPendingDelete(null); } }}
      />
    </>
  );
}

function AddMediaDialog({
  open, onOpenChange, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [fileName, setFileName] = useState("");
  const [url, setUrl] = useState("");
  const [mime, setMime] = useState("");
  const [size, setSize] = useState("");
  const [alt, setAlt] = useState("");

  useEffect(() => {
    if (open) { setFileName(""); setUrl(""); setMime(""); setSize(""); setAlt(""); }
  }, [open]);

  const save = useMutation({
    mutationFn: () => addMedia({
      data: {
        file_name: fileName,
        url,
        mime_type: mime || null,
        size_bytes: size ? Number(size) : 0,
        alt_text: alt || null,
      },
    }),
    onSuccess: (res) => { if (res.ok) { toast.success("File added"); onSaved(); onOpenChange(false); } else toast.error(res.error); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add media file</DialogTitle>
          <DialogDescription>Register an externally-hosted file (CDN, Lovable storage, etc.) in the library.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>File name</Label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="hero-banner.jpg" />
          </div>
          <div>
            <Label>URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>MIME type</Label>
              <Input value={mime} onChange={(e) => setMime(e.target.value)} placeholder="image/jpeg" />
            </div>
            <div>
              <Label>Size (bytes)</Label>
              <Input type="number" value={size} onChange={(e) => setSize(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Alt text</Label>
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image for SEO/a11y" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !fileName || !url}>
            {save.isPending ? "Adding…" : "Add file"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
