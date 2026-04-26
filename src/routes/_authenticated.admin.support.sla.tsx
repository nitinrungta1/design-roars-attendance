import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Timer } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, StatusBadge } from "@/components/admin/data-shell";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { listSlaPolicies, patchSlaPolicy } from "@/lib/support.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/sla")({
  head: () => seo({ title: "SLA policies | Admin", description: "Response & resolution targets.", kind: "product", path: "/admin/support/sla", noindex: true }),
  component: SlaPage,
});

function SlaPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "sla"], queryFn: () => listSlaPolicies() });
  const mut = useMutation({
    mutationFn: (vars: { id: string; first_response_minutes?: number; resolution_minutes?: number; is_active?: boolean }) => patchSlaPolicy({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) qc.invalidateQueries({ queryKey: ["admin", "sla"] });
      else toast.error(res.error);
    },
  });
  const policies = data?.policies ?? [];

  return (
    <>
      <PageHeader eyebrow="Customer Support" title="SLA Policies" description="Response & resolution targets per priority." breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "SLA" }]} />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {policies.map((p) => (
            <StatCard key={p.id} label={p.name} value={`${p.first_response_minutes}m`} hint={`Resolve ≤ ${Math.round(p.resolution_minutes / 60)}h`} />
          ))}
        </div>
        <DataTable
          headers={["Priority", "First response (min)", "Resolution (min)", "Active"]}
          empty={!isLoading && policies.length === 0 ? <EmptyState icon={Timer} title="No SLA policies" description="Default policies will appear here." /> : null}
        >
          {policies.map((p) => (
            <Tr key={p.id}>
              <Td><StatusBadge status={p.priority} /></Td>
              <Td>
                <Input type="number" defaultValue={p.first_response_minutes} className="h-8 w-24"
                  onBlur={(e) => { const v = Number(e.target.value); if (v && v !== p.first_response_minutes) mut.mutate({ id: p.id, first_response_minutes: v }); }} />
              </Td>
              <Td>
                <Input type="number" defaultValue={p.resolution_minutes} className="h-8 w-28"
                  onBlur={(e) => { const v = Number(e.target.value); if (v && v !== p.resolution_minutes) mut.mutate({ id: p.id, resolution_minutes: v }); }} />
              </Td>
              <Td><Switch checked={p.is_active} onCheckedChange={(v) => mut.mutate({ id: p.id, is_active: v })} /></Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>
    </>
  );
}
