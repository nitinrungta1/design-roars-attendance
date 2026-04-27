import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Plus, Pencil } from "lucide-react";
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
  listJobs, getJob, upsertJob, deleteJob, bulkJobs,
  JOB_STATUSES, JOB_TYPES, type JobRow, type JobStatus, type JobType,
} from "@/lib/cms.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/careers")({
  head: () => seo({ title: "Careers | Admin", description: "Job postings management.", kind: "product", path: "/admin/cms/careers", noindex: true }),
  component: CareersPage,
});

const STATUS_OPTIONS = JOB_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));
const TYPE_LABELS: Record<JobType, string> = {
  full_time: "Full-time", part_time: "Part-time", contract: "Contract", internship: "Internship",
};

function CareersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "jobs"], queryFn: () => listJobs() });
  const jobs = data?.jobs ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [editorId, setEditorId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<JobRow | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const departments = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => { if (j.department) set.add(j.department); });
    return Array.from(set).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      if (deptFilter !== "all" && j.department !== deptFilter) return false;
      if (!q) return true;
      return j.title.toLowerCase().includes(q) || j.slug.toLowerCase().includes(q) || (j.location ?? "").toLowerCase().includes(q);
    });
  }, [jobs, search, statusFilter, deptFilter]);

  const sel = useSelection(filtered);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "jobs"] });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteJob({ data: { id } }),
    onSuccess: (res) => { if (res.ok) { toast.success("Job deleted"); refresh(); } else toast.error(res.error); },
  });
  const bulkMut = useMutation({
    mutationFn: (action: "publish" | "archive" | "close" | "draft" | "delete") => bulkJobs({ data: { ids: sel.ids, action } }),
    onSuccess: (res) => { if (res.ok) { toast.success(`${res.count} jobs updated`); sel.clear(); refresh(); } else toast.error(res.error); },
  });

  const openNew = () => { setEditorId(null); setEditorOpen(true); };
  const openEdit = (id: string) => { setEditorId(id); setEditorOpen(true); };

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Careers"
        description="Job postings published on /careers."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Careers" }]}
        actions={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New job</Button>}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={jobs.length} />
          <StatCard label="Published" value={jobs.filter((j) => j.status === "published").length} tone="success" />
          <StatCard label="Drafts" value={jobs.filter((j) => j.status === "draft").length} />
          <StatCard label="Closed" value={jobs.filter((j) => j.status === "closed").length} />
        </div>

        <BulkActionBar
          count={sel.count}
          onClear={sel.clear}
          actions={[
            { label: "Publish", onClick: () => bulkMut.mutate("publish") },
            { label: "Move to draft", onClick: () => bulkMut.mutate("draft") },
            { label: "Archive", onClick: () => bulkMut.mutate("archive") },
            { label: "Close", onClick: () => bulkMut.mutate("close") },
            { label: "Delete", tone: "danger", onClick: () => setBulkConfirm(true) },
          ]}
        />

        <FiltersBar
          search={search}
          onSearch={setSearch}
          filters={
            <>
              <StatusFilter value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
              {departments.length > 0 && (
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </>
          }
        />

        <DataTable
          headers={["", "Title", "Department", "Location", "Type", "Status", "Updated", ""]}
          empty={!isLoading && filtered.length === 0 ? <EmptyState icon={Briefcase} title="No jobs match" description="Add your first job opening." action={<Button onClick={openNew}>New job</Button>} /> : null}
        >
          {filtered.map((j) => (
            <Tr key={j.id}>
              <Td><RowCheckbox checked={sel.selected.has(j.id)} onChange={() => sel.toggle(j.id)} /></Td>
              <Td className="font-medium">{j.title}</Td>
              <Td>{j.department ?? "—"}</Td>
              <Td>{j.location ?? "—"}</Td>
              <Td>{TYPE_LABELS[j.employment_type]}</Td>
              <Td><StatusBadge status={j.status} /></Td>
              <Td className="text-muted-foreground">{fmtRelative(j.updated_at)}</Td>
              <Td>
                <div className="flex items-center justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(j.id)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setPendingDelete(j)}>Delete</Button>
                </div>
              </Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>

      <JobEditor
        open={editorOpen}
        id={editorId}
        onOpenChange={(v) => { setEditorOpen(v); if (!v) setEditorId(null); }}
        onSaved={refresh}
      />

      <ConfirmDelete
        open={!!pendingDelete}
        onOpenChange={(v) => { if (!v) setPendingDelete(null); }}
        title={`Delete "${pendingDelete?.title ?? ""}"?`}
        description="This permanently removes the job posting."
        onConfirm={() => { if (pendingDelete) { delMut.mutate(pendingDelete.id); setPendingDelete(null); } }}
      />
      <ConfirmDelete
        open={bulkConfirm}
        onOpenChange={setBulkConfirm}
        title={`Delete ${sel.count} jobs?`}
        description="Selected jobs will be permanently removed."
        onConfirm={() => { bulkMut.mutate("delete"); setBulkConfirm(false); }}
        confirmLabel={`Delete ${sel.count}`}
      />
    </>
  );
}

function JobEditor({
  open, id, onOpenChange, onSaved,
}: { open: boolean; id: string | null; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const { data } = useQuery({
    queryKey: ["admin", "job", id],
    queryFn: () => getJob({ data: { id: id! } }),
    enabled: !!id && open,
  });
  const existing = data?.job ?? null;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<JobType>("full_time");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [applyUrl, setApplyUrl] = useState("");
  const [status, setStatus] = useState<JobStatus>("draft");
  const [orderIndex, setOrderIndex] = useState(0);

  useEffect(() => {
    if (open && existing) {
      setTitle(existing.title); setSlug(existing.slug);
      setDepartment(existing.department ?? ""); setLocation(existing.location ?? "");
      setType(existing.employment_type); setSummary(existing.summary ?? ""); setDescription(existing.description ?? "");
      setSalaryMin(existing.salary_min?.toString() ?? ""); setSalaryMax(existing.salary_max?.toString() ?? "");
      setCurrency(existing.salary_currency ?? "INR"); setApplyUrl(existing.apply_url ?? "");
      setStatus(existing.status); setOrderIndex(existing.order_index);
    } else if (open && !id) {
      setTitle(""); setSlug(""); setDepartment(""); setLocation(""); setType("full_time"); setSummary(""); setDescription("");
      setSalaryMin(""); setSalaryMax(""); setCurrency("INR"); setApplyUrl(""); setStatus("draft"); setOrderIndex(0);
    }
  }, [open, id, existing]);

  const save = useMutation({
    mutationFn: () => upsertJob({
      data: {
        id: id ?? undefined,
        title, slug,
        department: department || null,
        location: location || null,
        employment_type: type,
        summary: summary || null,
        description: description || null,
        salary_min: salaryMin ? Number(salaryMin) : null,
        salary_max: salaryMax ? Number(salaryMax) : null,
        salary_currency: currency || null,
        apply_url: applyUrl || null,
        status,
        order_index: orderIndex,
      },
    }),
    onSuccess: (res) => { if (res.ok) { toast.success("Job saved"); onSaved(); onOpenChange(false); } else toast.error(res.error); },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{id ? "Edit job" : "New job"}</SheetTitle>
          <SheetDescription>Job posting shown on the public /careers page.</SheetDescription>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Engineering" />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote / Bangalore" />
            </div>
            <div>
              <Label>Employment type</Label>
              <Select value={type} onValueChange={(v) => setType(v as JobType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{JOB_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Summary (1-2 lines, shown on /careers list)</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Description (Markdown)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={10} className="font-mono text-xs" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Min salary</Label>
              <Input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
            </div>
            <div>
              <Label>Max salary</Label>
              <Input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Apply URL</Label>
              <Input value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} placeholder="mailto:jobs@…  or  https://…" />
            </div>
            <div>
              <Label>Order index</Label>
              <Input type="number" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !title || !slug}>
              {save.isPending ? "Saving…" : "Save job"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
