import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Group, Plus, Pencil, Trash2 } from "lucide-react";
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
  listDepartmentsFull,
  upsertDepartment,
  deleteDepartment,
  type DepartmentRow,
} from "@/lib/workforce-pro.functions";
import { listCompanies } from "@/lib/customers.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/departments")({
  head: () =>
    seo({
      title: "Departments | Admin",
      description: "Manage org departments across all tenants.",
      kind: "product",
      path: "/admin/workforce/departments",
      noindex: true,
    }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<DepartmentRow | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "departments"],
    queryFn: () => listDepartmentsFull(),
  });
  const { data: companies } = useQuery({
    queryKey: ["admin", "companies-lite"],
    queryFn: () => listCompanies(),
  });

  const upsert = useMutation({
    mutationFn: (vars: { id?: string; company_id: string; name: string; code?: string }) =>
      upsertDepartment({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(editing ? "Department updated" : "Department created");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "departments"] });
        setOpen(false);
        setEditing(null);
      } else toast.error(res.error);
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteDepartment({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Department deleted");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "departments"] });
      } else toast.error(res.error);
    },
  });

  const rows = data?.rows ?? [];
  const totalEmployees = rows.reduce((s, r) => s + r.employee_count, 0);

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Departments"
        description="Org units used to group employees, route approvals, and structure reports."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Departments" }]}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New department
          </Button>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Departments" value={rows.length} />
          <StatCard label="Avg headcount" value={rows.length ? Math.round(totalEmployees / rows.length) : 0} />
          <StatCard label="Employees mapped" value={totalEmployees} tone="success" />
        </div>

        <DataTable
          headers={["Name", "Code", "Employees", ""]}
          empty={
            !isLoading && rows.length === 0 ? (
              <EmptyState
                icon={Group}
                title="No departments yet"
                description="Create departments to organize employees and unlock dept-level reports."
              />
            ) : null
          }
        >
          {rows.map((r) => (
            <Tr key={r.id}>
              <Td>
                <div className="font-medium">{r.name}</div>
              </Td>
              <Td mono>{r.code ?? "—"}</Td>
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
                      if (confirm(`Delete department "${r.name}"?`)) del.mutate(r.id);
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

      <DepartmentDialog
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

function DepartmentDialog({
  open,
  onOpenChange,
  editing,
  companies,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: DepartmentRow | null;
  companies: { id: string; name: string }[];
  onSubmit: (data: { id?: string; company_id: string; name: string; code?: string }) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [code, setCode] = useState(editing?.code ?? "");
  const [companyId, setCompanyId] = useState(editing?.company_id ?? companies[0]?.id ?? "");

  // Reset on open
  useState(() => {
    setName(editing?.name ?? "");
    setCode(editing?.code ?? "");
    setCompanyId(editing?.company_id ?? companies[0]?.id ?? "");
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit department" : "New department"}</DialogTitle>
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
            <Label className="text-xs">Code (optional)</Label>
            <Input
              className="mt-1"
              value={code ?? ""}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. ENG, OPS"
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
                code: code?.trim() || undefined,
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
