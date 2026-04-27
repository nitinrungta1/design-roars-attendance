import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, fmtRelative } from "@/components/admin/data-shell";
import {
  FiltersBar, BulkActionBar, RowCheckbox, ConfirmDelete, useSelection, slugify,
} from "@/components/admin/cms-shell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import { listForms, upsertForm, deleteForm, type FormRow } from "@/lib/cms.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/forms")({
  head: () => seo({ title: "Forms | Admin", description: "Marketing forms & lead capture.", kind: "product", path: "/admin/cms/forms", noindex: true }),
  component: FormsPage,
});

function FormsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "marketing-forms"], queryFn: () => listForms() });
  const forms = data?.forms ?? [];

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [editorRow, setEditorRow] = useState<FormRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FormRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return forms.filter((f) => {
      if (activeFilter === "active" && !f.is_active) return false;
      if (activeFilter === "inactive" && f.is_active) return false;
      if (!q) return true;
      return f.name.toLowerCase().includes(q) || f.slug.toLowerCase().includes(q);
    });
  }, [forms, search, activeFilter]);

  const sel = useSelection(filtered);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "marketing-forms"] });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteForm({ data: { id } }),
    onSuccess: (res) => { if (res.ok) { toast.success("Form deleted"); refresh(); } else toast.error(res.error); },
  });

  const toggleActive = useMutation({
    mutationFn: (form: FormRow) => upsertForm({
      data: { id: form.id, slug: form.slug, name: form.name, description: form.description, target_email: form.target_email, is_active: !form.is_active },
    }),
    onSuccess: (res) => { if (res.ok) refresh(); else toast.error(res.error); },
  });

  const openNew = () => { setEditorRow(null); setEditorOpen(true); };
  const openEdit = (f: FormRow) => { setEditorRow(f); setEditorOpen(true); };

  const totalSubmissions = forms.reduce((s, f) => s + f.submission_count, 0);

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Marketing Forms"
        description="Demo forms, contact forms, newsletter — all submissions land in Leads."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Forms" }]}
        actions={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New form</Button>}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Forms" value={forms.length} />
          <StatCard label="Active" value={forms.filter((f) => f.is_active).length} tone="success" />
          <StatCard label="Submissions" value={totalSubmissions} />
        </div>

        <FiltersBar
          search={search}
          onSearch={setSearch}
          filters={
            <div className="flex gap-1 rounded-md border border-border p-1">
              {(["all", "active", "inactive"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveFilter(v)}
                  className={`rounded px-3 py-1 text-xs font-medium capitalize ${activeFilter === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          }
        />

        <BulkActionBar
          count={sel.count}
          onClear={sel.clear}
          actions={[]}
        />

        <DataTable
          headers={["", "Name", "Slug", "Target email", "Submissions", "Active", "Updated", ""]}
          empty={!isLoading && filtered.length === 0 ? <EmptyState icon={ClipboardList} title="No forms match" description="Create a marketing form to capture leads." action={<Button onClick={openNew}>New form</Button>} /> : null}
        >
          {filtered.map((f) => (
            <Tr key={f.id}>
              <Td><RowCheckbox checked={sel.selected.has(f.id)} onChange={() => sel.toggle(f.id)} /></Td>
              <Td className="font-medium">
                <div className="flex flex-col">
                  <span>{f.name}</span>
                  {f.description && <span className="text-xs text-muted-foreground">{f.description}</span>}
                </div>
              </Td>
              <Td mono>{f.slug}</Td>
              <Td className="text-muted-foreground">{f.target_email ?? "—"}</Td>
              <Td><Badge variant="secondary">{f.submission_count}</Badge></Td>
              <Td><Switch checked={f.is_active} onCheckedChange={() => toggleActive.mutate(f)} /></Td>
              <Td className="text-muted-foreground">{fmtRelative(f.updated_at)}</Td>
              <Td>
                <div className="flex items-center justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setPendingDelete(f)}>Delete</Button>
                </div>
              </Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>

      <FormEditor
        open={editorOpen}
        existing={editorRow}
        onOpenChange={(v) => { setEditorOpen(v); if (!v) setEditorRow(null); }}
        onSaved={refresh}
      />

      <ConfirmDelete
        open={!!pendingDelete}
        onOpenChange={(v) => { if (!v) setPendingDelete(null); }}
        title={`Delete "${pendingDelete?.name ?? ""}"?`}
        description="This removes the form. Existing submissions remain in the database."
        onConfirm={() => { if (pendingDelete) { delMut.mutate(pendingDelete.id); setPendingDelete(null); } }}
      />
    </>
  );
}

function FormEditor({
  open, existing, onOpenChange, onSaved,
}: { open: boolean; existing: FormRow | null; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (open && existing) {
      setName(existing.name); setSlug(existing.slug); setDescription(existing.description ?? "");
      setTarget(existing.target_email ?? ""); setActive(existing.is_active);
    } else if (open && !existing) {
      setName(""); setSlug(""); setDescription(""); setTarget(""); setActive(true);
    }
  }, [open, existing]);

  const save = useMutation({
    mutationFn: () => upsertForm({
      data: {
        id: existing?.id,
        name, slug,
        description: description || null,
        target_email: target || null,
        is_active: active,
      },
    }),
    onSuccess: (res) => { if (res.ok) { toast.success("Form saved"); onSaved(); onOpenChange(false); } else toast.error(res.error); },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{existing ? "Edit form" : "New form"}</SheetTitle>
          <SheetDescription>Marketing form metadata. Field schema is managed in code for now.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); if (!existing && !slug) setSlug(slugify(e.target.value)); }} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Target email (notifications)</Label>
            <Input type="email" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="sales@oqlio.com" />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="active-form">Active</Label>
            <Switch id="active-form" checked={active} onCheckedChange={setActive} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !name || !slug}>
              {save.isPending ? "Saving…" : "Save form"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
