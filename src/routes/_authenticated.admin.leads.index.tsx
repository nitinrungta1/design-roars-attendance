import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Filter, Mail, Phone } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import {
  DataTable,
  Td,
  Tr,
  StatusBadge,
  fmtRelative,
  StatCard,
} from "@/components/admin/data-shell";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  listLeads,
  updateLead,
  LEAD_STATUSES,
  type LeadStatus,
} from "@/lib/crm.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/leads/")({
  head: () =>
    seo({
      title: "Leads Pipeline | Admin",
      description: "Sales pipeline: lead → demo → trial → won/lost.",
      kind: "product",
      path: "/admin/leads",
      noindex: true,
    }),
  component: LeadsPage,
});

function LeadsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "leads"],
    queryFn: () => listLeads(),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; status: LeadStatus }) => updateLead({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Lead updated");
        qc.invalidateQueries({ queryKey: ["admin", "leads"] });
      } else {
        toast.error(res.error);
      }
    },
  });

  const leads = data?.leads ?? [];
  const filtered = leads.filter(
    (l) =>
      (statusFilter === "all" || l.status === statusFilter) &&
      (!search ||
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        (l.company ?? "").toLowerCase().includes(search.toLowerCase())),
  );

  const stageCounts = useMemo(() => {
    const m = new Map<LeadStatus, number>();
    for (const s of LEAD_STATUSES) m.set(s, 0);
    for (const l of leads) m.set(l.status, (m.get(l.status) ?? 0) + 1);
    return m;
  }, [leads]);

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Leads pipeline"
        description="Every inbound lead — drag through stages from new to won."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Leads" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {LEAD_STATUSES.map((s) => (
            <StatCard
              key={s}
              label={s.replace(/_/g, " ")}
              value={stageCounts.get(s) ?? 0}
              tone={s === "won" ? "success" : s === "lost" ? "danger" : "default"}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search name, email, company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          headers={["Lead", "Contact", "Company", "Source", "Stage", "Created"]}
          empty={
            !isLoading && filtered.length === 0 ? (
              <EmptyState
                icon={Filter}
                title="No leads yet"
                description="When someone fills out the website forms they will land here."
              />
            ) : null
          }
        >
          {filtered.map((l) => (
            <Tr key={l.id}>
              <Td>
                <p className="font-medium">{l.name}</p>
                {l.message && (
                  <p className="line-clamp-1 max-w-xs text-xs text-muted-foreground">
                    {l.message}
                  </p>
                )}
              </Td>
              <Td>
                <div className="flex flex-col gap-0.5 text-xs">
                  <a
                    href={`mailto:${l.email}`}
                    className="inline-flex items-center gap-1 text-foreground hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    {l.email}
                  </a>
                  {l.phone && (
                    <a
                      href={`tel:${l.phone}`}
                      className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {l.phone}
                    </a>
                  )}
                </div>
              </Td>
              <Td className="text-muted-foreground">{l.company ?? "—"}</Td>
              <Td className="text-muted-foreground">{l.source ?? "—"}</Td>
              <Td>
                <Select
                  value={l.status}
                  onValueChange={(v) =>
                    updateMut.mutate({ id: l.id, status: v as LeadStatus })
                  }
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue>
                      <StatusBadge status={l.status} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Td>
              <Td className="text-muted-foreground">{fmtRelative(l.created_at)}</Td>
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
