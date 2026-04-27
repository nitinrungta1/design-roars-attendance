import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Pencil, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, fmtDate } from "@/components/admin/data-shell";
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
  listEmployeeDocuments,
  upsertEmployeeDocument,
  deleteEmployeeDocument,
  type EmployeeDocumentRow,
} from "@/lib/workforce-ops.functions";
import { listCompanies } from "@/lib/customers.functions";
import { listEmployees } from "@/lib/workforce.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/documents")({
  head: () =>
    seo({
      title: "Documents | Workforce",
      description: "Track employee contracts, IDs, and HR documents.",
      kind: "product",
      path: "/admin/workforce/documents",
      noindex: true,
    }),
  component: DocumentsPage,
});

const DOC_TYPES = ["offer_letter", "nda", "id_proof", "contract", "policy", "other"] as const;

function DocumentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EmployeeDocumentRow | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "documents"],
    queryFn: () => listEmployeeDocuments(),
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
  const today = new Date().toISOString().slice(0, 10);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.employee_name.toLowerCase().includes(q) ||
        r.doc_type.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const expiring = rows.filter((r) => {
      if (!r.expires_at) return false;
      const days = Math.ceil((new Date(r.expires_at).getTime() - Date.now()) / 86_400_000);
      return days >= 0 && days <= 30;
    }).length;
    const expired = rows.filter((r) => r.expires_at && r.expires_at < today).length;
    const signed = rows.filter((r) => r.signed_at).length;
    return { total, expiring, expired, signed };
  }, [rows, today]);

  const upsertM = useMutation({
    mutationFn: upsertEmployeeDocument,
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Document saved");
        setOpen(false);
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "documents"] });
      } else toast.error(res.error);
    },
  });
  const deleteM = useMutation({
    mutationFn: deleteEmployeeDocument,
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Document removed");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "documents"] });
      } else toast.error(res.error);
    },
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    upsertM.mutate({
      data: {
        id: editing?.id,
        company_id: form.get("company_id") as string,
        employee_id: form.get("employee_id") as string,
        doc_type: form.get("doc_type") as (typeof DOC_TYPES)[number],
        title: form.get("title") as string,
        file_url: (form.get("file_url") as string) || "",
        signed_at: (form.get("signed_at") as string) || "",
        expires_at: (form.get("expires_at") as string) || "",
        notes: (form.get("notes") as string) || "",
      },
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Employee Documents"
        description="Centralized contract, NDA, ID and policy storage with expiry tracking."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              filename="employee-documents"
              columns={[
                { key: "employee_name", header: "Employee" },
                { key: "doc_type", header: "Type" },
                { key: "title", header: "Title" },
                { key: "signed_at", header: "Signed" },
                { key: "expires_at", header: "Expires" },
                { key: "uploaded_at", header: "Uploaded" },
              ]}
              rows={filtered}
              sheetName="Documents"
            />
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4" /> New Document
            </Button>
          </div>
        }
      />
      <PageBody>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Documents" value={stats.total} />
          <StatCard label="Signed" value={stats.signed} tone="success" />
          <StatCard label="Expiring (30d)" value={stats.expiring} tone="warning" />
          <StatCard label="Expired" value={stats.expired} tone="danger" />
        </div>

        <div className="mt-6 mb-4 flex items-center gap-2">
          <Input
            placeholder="Search by employee, title or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading documents…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Upload offer letters, contracts, IDs or signed policies to track them centrally."
          />
        ) : (
          <DataTable headers={["Employee", "Type", "Title", "Signed", "Expires", "Actions"]}>
            {filtered.map((row) => {
              const isExpired = row.expires_at && row.expires_at < today;
              const isExpiring = row.expires_at && !isExpired &&
                Math.ceil((new Date(row.expires_at).getTime() - Date.now()) / 86_400_000) <= 30;
              return (
                <Tr key={row.id}>
                  <Td className="font-medium">{row.employee_name}</Td>
                  <Td>
                    <Badge variant="secondary" className="rounded-full capitalize">
                      {row.doc_type.replace(/_/g, " ")}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span>{row.title}</span>
                      {row.file_url && (
                        <a
                          href={row.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </Td>
                  <Td>{row.signed_at ? fmtDate(row.signed_at) : <span className="text-muted-foreground">—</span>}</Td>
                  <Td>
                    {row.expires_at ? (
                      <span className={isExpired ? "text-rose-600 dark:text-rose-400" : isExpiring ? "text-amber-600 dark:text-amber-400" : ""}>
                        {(isExpired || isExpiring) && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                        {fmtDate(row.expires_at)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(row); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete document "${row.title}"?`)) {
                            deleteM.mutate({ data: { id: row.id } });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </DataTable>
        )}
      </PageBody>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit document" : "New document"}</DialogTitle>
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
              <Label>Employee</Label>
              <Select name="employee_id" defaultValue={editing?.employee_id}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {(employees?.employees ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select name="doc_type" defaultValue={editing?.doc_type ?? "contract"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input name="title" required defaultValue={editing?.title} />
              </div>
            </div>
            <div>
              <Label>File URL</Label>
              <Input name="file_url" type="url" placeholder="https://…" defaultValue={editing?.file_url ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Signed at</Label>
                <Input name="signed_at" type="date" defaultValue={editing?.signed_at?.slice(0, 10) ?? ""} />
              </div>
              <div>
                <Label>Expires at</Label>
                <Input name="expires_at" type="date" defaultValue={editing?.expires_at?.slice(0, 10) ?? ""} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea name="notes" rows={2} defaultValue={editing?.notes ?? ""} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={upsertM.isPending}>
                {editing ? "Save changes" : "Add document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
