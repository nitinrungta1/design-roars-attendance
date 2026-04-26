import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Trash2 } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import {
  DataTable,
  Td,
  Tr,
  PlanBadge,
  fmtDate,
  StatCard,
} from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  listCompanies,
  createCompany,
  updateCompanyPlan,
  deleteCompany,
} from "@/lib/customers.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/customers/companies")({
  head: () =>
    seo({
      title: "Companies | Admin",
      description: "All customer companies on Punchly.",
      kind: "product",
      path: "/admin/customers/companies",
      noindex: true,
    }),
  component: CompaniesPage,
});

const PLANS = ["free", "starter", "growth", "business", "enterprise"] as const;

function CompaniesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "companies"],
    queryFn: () => listCompanies(),
  });

  const planMut = useMutation({
    mutationFn: (vars: { id: string; plan: (typeof PLANS)[number] }) =>
      updateCompanyPlan({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Plan updated");
        qc.invalidateQueries({ queryKey: ["admin", "companies"] });
      } else {
        toast.error(res.error);
      }
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCompany({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Company deleted");
        qc.invalidateQueries({ queryKey: ["admin", "companies"] });
      } else {
        toast.error(res.error);
      }
    },
  });

  const companies = data?.companies ?? [];
  const filtered = companies.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const totals = {
    all: companies.length,
    paid: companies.filter((c) => c.plan !== "free").length,
    members: companies.reduce((acc, c) => acc + c.member_count, 0),
  };

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Companies"
        description="Every workspace on Punchly. Suspend, upgrade, or delete tenants."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Companies" }]}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New company
              </Button>
            </DialogTrigger>
            <CreateCompanyDialog onClose={() => setCreateOpen(false)} />
          </Dialog>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total companies" value={totals.all} />
          <StatCard label="Paid plans" value={totals.paid} tone="success" />
          <StatCard label="Total members" value={totals.members} />
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <DataTable
          headers={["Name", "Slug", "Plan", "Members", "Created", ""]}
          empty={
            !isLoading && filtered.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No companies yet"
                description="Create your first tenant workspace to get started."
              />
            ) : null
          }
        >
          {filtered.map((c) => (
            <Tr key={c.id}>
              <Td>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  {c.is_default && (
                    <Badge variant="outline" className="text-[10px]">
                      platform
                    </Badge>
                  )}
                </div>
              </Td>
              <Td mono>{c.slug}</Td>
              <Td>
                <Select
                  value={c.plan}
                  onValueChange={(v) =>
                    planMut.mutate({ id: c.id, plan: v as (typeof PLANS)[number] })
                  }
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue>
                      <PlanBadge plan={c.plan} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PLANS.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Td>
              <Td>{c.member_count}</Td>
              <Td className="text-muted-foreground">{fmtDate(c.created_at)}</Td>
              <Td>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled={c.is_default}
                      onClick={() => {
                        if (
                          confirm(`Permanently delete "${c.name}"? This cannot be undone.`)
                        ) {
                          deleteMut.mutate(c.id);
                        }
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

function CreateCompanyDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState<(typeof PLANS)[number]>("free");

  const mut = useMutation({
    mutationFn: () => createCompany({ data: { name, slug: slug || undefined, plan } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Company created");
        qc.invalidateQueries({ queryKey: ["admin", "companies"] });
        onClose();
        setName("");
        setSlug("");
        setPlan("free");
      } else {
        toast.error(res.error);
      }
    },
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New company</DialogTitle>
        <DialogDescription>
          Create a new tenant workspace. You can invite owners afterward.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label htmlFor="co-name">Name</Label>
          <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="co-slug">Slug (optional)</Label>
          <Input
            id="co-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto from name"
          />
        </div>
        <div>
          <Label>Plan</Label>
          <Select value={plan} onValueChange={(v) => setPlan(v as (typeof PLANS)[number])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLANS.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p}
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
        <Button
          disabled={!name || mut.isPending}
          onClick={() => mut.mutate()}
        >
          {mut.isPending ? "Creating…" : "Create"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
