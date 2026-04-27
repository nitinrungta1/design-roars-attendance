import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tag, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  listDesignationsFull,
  upsertDesignation,
  deleteDesignation,
  type DesignationRow,
} from "@/lib/workforce-pro.functions";
import { listCompanies } from "@/lib/customers.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/designations")({
  head: () =>
    seo({
      title: "Designations | Admin",
      description: "Job titles and seniority levels across the workforce.",
      kind: "product",
      path: "/admin/workforce/designations",
      noindex: true,
    }),
  component: DesignationsPage,
});

function DesignationsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<DesignationRow | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "designations"],
    queryFn: () => listDesignationsFull(),
  });
  const { data: companies } = useQuery({
    queryKey: ["admin", "companies-lite"],
    queryFn: () => listCompanies(),
  });

  const upsert = useMutation({
    mutationFn: (vars: { id?: string; company_id: string; name: string; level?: number }) =>
      upsertDesignation({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(editing ? "Designation updated" : "Designation created");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "designations"] });
        setOpen(false);
        setEditing(null);
      } else toast.error(res.error);
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteDesignation({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Designation deleted");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "designations"] });
      } else toast.error(res.error);
    },
  });

  const rows = data?.rows ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Designations"
        description="Job titles, ranks, and seniority levels assigned to employees."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Designations" }]}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New designation
          </Button>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Designations" value={rows.length} />
          <StatCard
            label="Highest level"
            value={rows.reduce((m, r) => Math.max(m, r.level ?? 0), 0)}
          />
          <StatCard
            label="Employees mapped"
            value={rows.reduce((s, r) => s + r.employee_count, 0)}
            tone="success"
          />
        </div>

        <DataTable
          headers={["Name", "Level", "Employees", ""]}
          empty={
            !isLoading && rows.length === 0 ? (
              <EmptyState
                icon={Tag}
                title="No designations yet"
                description="Create titles like Engineer, Manager, Director to structure career levels."
              />
            ) : null
          }
        >
          {rows.map((r) => (
            <Tr key={r.id}>
              <Td>
                <div className="font-medium">{r.name}</div>
              </Td>
              <Td mono>L{r.level ?? 0}</Td>
              <Td>{r.employee_count}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete designation "${r.name}"?`)) del.mutate(r.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>

      <DesignationDialog
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
        editing={editing}
        companies={companies?.companies ?? []}
        onSubmit={(payload) => upsert.mutate(payload)}
        submitting={upsert.isPending}
      />
    </>
  );
}

function DesignationDialog({
  open,
  onOpenChange,
  editing,
  companies,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: DesignationRow | null;
  companies: { id: string; name: string }[];
  onSubmit: (data: { id?: string; company_id: string; name: string; level?: number }) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [level, setLevel] = useState<number>(editing?.level ?? 0);
  const [companyId, setCompanyId] = useState(editing?.company_id ?? companies[0]?.id ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit designation" : "New designation"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Company</Label>
            <Select value={companyId} onValueChange={setCompanyId} disabled={!!editing}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Name</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Level (0–20)</Label>
            <Input
              className="mt-1"
              type="number"
              min={0}
              max={20}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value) || 0)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name || !companyId || submitting}
            onClick={() =>
              onSubmit({
                id: editing?.id,
                company_id: companyId,
                name: name.trim(),
                level,
              })
            }
          >
            {editing ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
