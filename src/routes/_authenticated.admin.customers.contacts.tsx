import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2, Users } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate, StatCard } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  listContacts,
  createContact,
  deleteContact,
  CONTACT_STAGES,
  type ContactStage,
} from "@/lib/crm.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/customers/contacts")({
  head: () =>
    seo({
      title: "Contacts | Admin",
      description: "CRM contacts across the funnel.",
      kind: "product",
      path: "/admin/customers/contacts",
      noindex: true,
    }),
  component: ContactsPage,
});

function ContactsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<ContactStage | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "contacts"],
    queryFn: () => listContacts(),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteContact({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Contact removed");
        qc.invalidateQueries({ queryKey: ["admin", "contacts"] });
      } else {
        toast.error(res.error);
      }
    },
  });

  const contacts = data?.contacts ?? [];
  const filtered = contacts.filter(
    (c) =>
      (stageFilter === "all" || c.stage === stageFilter) &&
      (!search ||
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? "").toLowerCase().includes(search.toLowerCase())),
  );

  const counts = {
    all: contacts.length,
    customers: contacts.filter((c) => c.stage === "customer").length,
    leads: contacts.filter((c) => c.stage === "lead" || c.stage === "mql" || c.stage === "sql")
      .length,
  };

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Contacts"
        description="People across your sales and customer lifecycle."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Contacts" }]}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" /> New contact
              </Button>
            </DialogTrigger>
            <CreateContactDialog onClose={() => setCreateOpen(false)} />
          </Dialog>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="All contacts" value={counts.all} />
          <StatCard label="Active leads" value={counts.leads} />
          <StatCard label="Customers" value={counts.customers} tone="success" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as typeof stageFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {CONTACT_STAGES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          headers={["Name", "Email", "Company", "Stage", "Added", ""]}
          empty={
            !isLoading && filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No contacts yet"
                description="Add a contact or import from the website forms."
              />
            ) : null
          }
        >
          {filtered.map((c) => (
            <Tr key={c.id}>
              <Td>
                <p className="font-medium">{c.full_name}</p>
                {c.title && <p className="text-xs text-muted-foreground">{c.title}</p>}
              </Td>
              <Td className="text-muted-foreground">{c.email ?? "—"}</Td>
              <Td className="text-muted-foreground">{c.company_name ?? "—"}</Td>
              <Td>
                <Badge variant="secondary" className="capitalize">
                  {c.stage}
                </Badge>
              </Td>
              <Td className="text-muted-foreground">{fmtDate(c.created_at)}</Td>
              <Td>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Remove ${c.full_name}?`)) delMut.mutate(c.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>
    </>
  );
}

function CreateContactDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    title: "",
    company_name: "",
    stage: "lead" as ContactStage,
  });

  const mut = useMutation({
    mutationFn: () => createContact({ data: form }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Contact added");
        qc.invalidateQueries({ queryKey: ["admin", "contacts"] });
        onClose();
        setForm({
          full_name: "",
          email: "",
          phone: "",
          title: "",
          company_name: "",
          stage: "lead",
        });
      } else {
        toast.error(res.error);
      }
    },
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New contact</DialogTitle>
        <DialogDescription>Add a person to the CRM.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Full name</Label>
          <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <Label>Company</Label>
          <Input
            value={form.company_name}
            onChange={(e) => set("company_name", e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <Label>Stage</Label>
          <Select value={form.stage} onValueChange={(v) => set("stage", v as ContactStage)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_STAGES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!form.full_name || mut.isPending} onClick={() => mut.mutate()}>
          {mut.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
