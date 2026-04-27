import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box, Plus, Pencil, Trash2, UserPlus, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard } from "@/components/admin/data-shell";
import { ExportMenu } from "@/components/admin/export-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  listAssets,
  upsertAsset,
  deleteAsset,
  assignAsset,
  returnAsset,
  type AssetRow,
} from "@/lib/workforce-ops.functions";
import { listCompanies } from "@/lib/customers.functions";
import { listEmployees } from "@/lib/workforce.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/assets")({
  head: () =>
    seo({
      title: "Assets | Workforce",
      description: "Track company-owned hardware and assignments.",
      kind: "product",
      path: "/admin/workforce/assets",
      noindex: true,
    }),
  component: AssetsPage,
});

const KINDS = ["laptop", "phone", "sim", "id_card", "accessory", "other"] as const;
const STATUSES = ["available", "assigned", "lost", "retired"] as const;

const STATUS_TONE: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  assigned: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  lost: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  retired: "bg-muted text-muted-foreground",
};

function AssetsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AssetRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<AssetRow | null>(null);
  const [assignEmployee, setAssignEmployee] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "assets"],
    queryFn: () => listAssets(),
  });
  const { data: companies } = useQuery({
    queryKey: ["admin", "companies-lite"],
    queryFn: () => listCompanies(),
  });
  const { data: employees } = useQuery({
    queryKey: ["admin", "employees-lite"],
    queryFn: () => listEmployees(),
  });

  const rows = data?.rows ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.serial_number ?? "").toLowerCase().includes(q) ||
        (r.assigned_to?.name ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const assigned = rows.filter((r) => r.status === "assigned").length;
    const available = rows.filter((r) => r.status === "available").length;
    const totalValue = rows.reduce((s, r) => s + (r.value ?? 0), 0);
    return { total, assigned, available, totalValue };
  }, [rows]);

  const upsertM = useMutation({
    mutationFn: upsertAsset,
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Asset saved");
        setDialogOpen(false);
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "assets"] });
      } else toast.error(res.error);
    },
  });
  const deleteM = useMutation({
    mutationFn: deleteAsset,
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Asset removed");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "assets"] });
      } else toast.error(res.error);
    },
  });
  const assignM = useMutation({
    mutationFn: assignAsset,
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Asset assigned");
        setAssignTarget(null);
        setAssignEmployee("");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "assets"] });
      } else toast.error(res.error);
    },
  });
  const returnM = useMutation({
    mutationFn: returnAsset,
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Asset returned");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "assets"] });
      } else toast.error(res.error);
    },
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const valueRaw = form.get("value")?.toString().trim();
    const payload = {
      id: editing?.id,
      company_id: form.get("company_id") as string,
      name: form.get("name") as string,
      kind: form.get("kind") as (typeof KINDS)[number],
      status: form.get("status") as (typeof STATUSES)[number],
      serial_number: (form.get("serial_number") as string) || "",
      value: valueRaw ? Number(valueRaw) : undefined,
      purchased_at: (form.get("purchased_at") as string) || "",
      notes: (form.get("notes") as string) || "",
    };
    upsertM.mutate({ data: payload });
  }

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Assets"
        description="Track laptops, phones, ID cards and other company-owned hardware with assignment history."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              filename="workforce-assets"
              columns={[
                { key: "name", header: "Name" },
                { key: "kind", header: "Kind" },
                { key: "status", header: "Status" },
                { key: "serial_number", header: "Serial" },
                { key: "value", header: "Value" },
                { key: "assigned", header: "Assigned To", accessor: (r: AssetRow) => r.assigned_to?.name ?? "" },
                { key: "purchased_at", header: "Purchased" },
              ]}
              rows={filtered}
              sheetName="Assets"
            />
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> New Asset
            </Button>
          </div>
        }
      />
      <PageBody>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Assets" value={stats.total} />
          <StatCard label="Assigned" value={stats.assigned} tone="success" />
          <StatCard label="Available" value={stats.available} />
          <StatCard label="Asset Value" value={`$${stats.totalValue.toLocaleString()}`} />
        </div>

        <div className="mt-6 mb-4 flex items-center gap-2">
          <Input
            placeholder="Search by name, serial, or assignee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading assets…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Box}
            title="No assets yet"
            description="Add your first laptop, phone, or accessory to start tracking ownership."
          />
        ) : (
          <DataTable headers={["Name", "Kind", "Status", "Serial", "Value", "Assigned To", "Actions"]}>
            {filtered.map((row) => (
              <Tr key={row.id}>
                <Td className="font-medium">{row.name}</Td>
                <Td className="capitalize">{row.kind.replace(/_/g, " ")}</Td>
                <Td>
                  <Badge variant="secondary" className={`rounded-full capitalize ${STATUS_TONE[row.status] ?? ""}`}>
                    {row.status}
                  </Badge>
                </Td>
                <Td mono>{row.serial_number ?? "—"}</Td>
                <Td>{row.value !== null ? `$${row.value.toLocaleString()}` : "—"}</Td>
                <Td>{row.assigned_to?.name ?? <span className="text-muted-foreground">—</span>}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    {row.assigned_to ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => returnM.mutate({ data: { asset_id: row.id } })}
                      >
                        <Undo2 className="h-4 w-4" /> Return
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setAssignTarget(row)}>
                        <UserPlus className="h-4 w-4" /> Assign
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => { setEditing(row); setDialogOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete ${row.name}?`)) deleteM.mutate({ data: { id: row.id } });
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit asset" : "New asset"}</DialogTitle>
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
              <Label>Name</Label>
              <Input name="name" required defaultValue={editing?.name} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kind</Label>
                <Select name="kind" defaultValue={editing?.kind ?? "laptop"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KINDS.map((k) => (
                      <SelectItem key={k} value={k} className="capitalize">{k.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select name="status" defaultValue={editing?.status ?? "available"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Serial Number</Label>
                <Input name="serial_number" defaultValue={editing?.serial_number ?? ""} />
              </div>
              <div>
                <Label>Value (USD)</Label>
                <Input name="value" type="number" step="0.01" min="0" defaultValue={editing?.value ?? ""} />
              </div>
            </div>
            <div>
              <Label>Purchased At</Label>
              <Input name="purchased_at" type="date" defaultValue={editing?.purchased_at?.slice(0, 10) ?? ""} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea name="notes" rows={3} defaultValue={editing?.notes ?? ""} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsertM.isPending}>
                {editing ? "Save changes" : "Create asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignTarget} onOpenChange={(o) => { if (!o) setAssignTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign {assignTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Employee</Label>
            <Select value={assignEmployee} onValueChange={setAssignEmployee}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {(employees?.employees ?? [])
                  .filter((e) => e.company_id === assignTarget?.company_id)
                  .map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignTarget(null)}>Cancel</Button>
            <Button
              disabled={!assignEmployee || assignM.isPending}
              onClick={() => {
                if (!assignTarget) return;
                assignM.mutate({
                  data: {
                    asset_id: assignTarget.id,
                    company_id: assignTarget.company_id,
                    employee_id: assignEmployee,
                  },
                });
              }}
            >
              Assign asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
