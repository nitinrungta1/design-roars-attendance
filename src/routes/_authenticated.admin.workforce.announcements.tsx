import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Pencil, Trash2, Pin, Eye } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, fmtRelative } from "@/components/admin/data-shell";
import { ExportMenu } from "@/components/admin/export-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listAnnouncements,
  upsertAnnouncement,
  deleteAnnouncement,
  type AnnouncementRow,
} from "@/lib/workforce-ops.functions";
import { listCompanies } from "@/lib/customers.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/announcements")({
  head: () =>
    seo({
      title: "Announcements | Workforce",
      description: "Broadcast updates to teams, departments, or the entire company.",
      kind: "product",
      path: "/admin/workforce/announcements",
      noindex: true,
    }),
  component: AnnouncementsPage,
});

const AUDIENCES = ["all", "department", "team", "role"] as const;

function AnnouncementsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [publishNow, setPublishNow] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "announcements"],
    queryFn: () => listAnnouncements(),
  });
  const { data: companies } = useQuery({
    queryKey: ["admin", "companies-lite"],
    queryFn: () => listCompanies(),
  });

  const rows = data?.rows ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.body ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const published = rows.filter((r) => r.published_at).length;
    const pinnedCount = rows.filter((r) => r.pinned).length;
    const totalReads = rows.reduce((s, r) => s + r.read_count, 0);
    return { total, published, pinnedCount, totalReads };
  }, [rows]);

  const upsertM = useMutation({
    mutationFn: upsertAnnouncement,
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Announcement saved");
        setOpen(false);
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "announcements"] });
      } else toast.error(res.error);
    },
  });
  const deleteM = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Announcement removed");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "announcements"] });
      } else toast.error(res.error);
    },
  });

  function openNew() {
    setEditing(null);
    setPinned(false);
    setPublishNow(true);
    setOpen(true);
  }

  function openEdit(row: AnnouncementRow) {
    setEditing(row);
    setPinned(row.pinned);
    setPublishNow(!!row.published_at);
    setOpen(true);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    upsertM.mutate({
      data: {
        id: editing?.id,
        company_id: form.get("company_id") as string,
        title: form.get("title") as string,
        body: (form.get("body") as string) || "",
        audience: form.get("audience") as (typeof AUDIENCES)[number],
        audience_id: "",
        pinned,
        publish_now: publishNow,
      },
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Announcements"
        description="Broadcast updates and company-wide news with audience targeting and read tracking."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              filename="announcements"
              columns={[
                { key: "title", header: "Title" },
                { key: "audience", header: "Audience" },
                { key: "pinned", header: "Pinned" },
                { key: "read_count", header: "Reads" },
                { key: "published_at", header: "Published" },
                { key: "created_at", header: "Created" },
              ]}
              rows={filtered}
              sheetName="Announcements"
            />
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> New Announcement
            </Button>
          </div>
        }
      />
      <PageBody>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Published" value={stats.published} tone="success" />
          <StatCard label="Pinned" value={stats.pinnedCount} />
          <StatCard label="Reads" value={stats.totalReads.toLocaleString()} />
        </div>

        <div className="mt-6 mb-4 flex items-center gap-2">
          <Input
            placeholder="Search title or body…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading announcements…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Broadcast company news, policy updates, or holiday alerts to your workforce."
            action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Create one</Button>}
          />
        ) : (
          <DataTable headers={["Title", "Audience", "Reads", "Status", "Created", "Actions"]}>
            {filtered.map((row) => (
              <Tr key={row.id}>
                <Td>
                  <div className="flex items-center gap-2">
                    {row.pinned && <Pin className="h-3 w-3 text-amber-600" />}
                    <span className="font-medium">{row.title}</span>
                  </div>
                  {row.body && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{row.body}</p>
                  )}
                </Td>
                <Td>
                  <Badge variant="secondary" className="rounded-full capitalize">{row.audience}</Badge>
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1 text-sm">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    {row.read_count}
                  </span>
                </Td>
                <Td>
                  {row.published_at ? (
                    <Badge variant="secondary" className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-full">Draft</Badge>
                  )}
                </Td>
                <Td className="text-muted-foreground">{fmtRelative(row.created_at)}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete announcement "${row.title}"?`)) {
                          deleteM.mutate({ data: { id: row.id } });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </PageBody>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit announcement" : "New announcement"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label>Company</Label>
              <Select name="company_id" defaultValue={editing?.company_id ?? companies?.companies?.[0]?.id}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {companies?.companies?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input name="title" required defaultValue={editing?.title} />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea name="body" rows={5} defaultValue={editing?.body ?? ""} />
            </div>
            <div>
              <Label>Audience</Label>
              <Select name="audience" defaultValue={editing?.audience ?? "all"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm">Pin to top</Label>
                <p className="text-xs text-muted-foreground">Keeps the message visible at the top of the feed.</p>
              </div>
              <Switch checked={pinned} onCheckedChange={setPinned} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm">Publish now</Label>
                <p className="text-xs text-muted-foreground">Uncheck to save as a draft.</p>
              </div>
              <Switch checked={publishNow} onCheckedChange={setPublishNow} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={upsertM.isPending}>
                {editing ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
