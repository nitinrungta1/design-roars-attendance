import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plug } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, fmtRelative } from "@/components/admin/data-shell";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { listIntegrations, toggleIntegration, type IntegrationKind } from "@/lib/integrations.functions";

export function IntegrationModule({
  kind,
  eyebrow,
  title,
  description,
  breadcrumbLabel,
  emptyHint,
}: {
  kind: IntegrationKind;
  eyebrow: string;
  title: string;
  description: string;
  breadcrumbLabel: string;
  emptyHint: string;
}): ReactNode {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "integrations", kind],
    queryFn: () => listIntegrations({ data: { kind } }),
  });
  const mut = useMutation({
    mutationFn: (vars: { id: string; is_enabled: boolean }) => toggleIntegration({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) qc.invalidateQueries({ queryKey: ["admin", "integrations", kind] });
      else toast.error(res.error);
    },
  });
  const rows = data?.integrations ?? [];

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: breadcrumbLabel }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Connected" value={rows.length} />
          <StatCard label="Enabled" value={rows.filter((r) => r.is_enabled).length} tone="success" />
          <StatCard label="Disabled" value={rows.filter((r) => !r.is_enabled).length} />
        </div>
        <DataTable
          headers={["Provider", "Label", "Enabled", "Last sync", "Updated"]}
          empty={!isLoading && rows.length === 0 ? <EmptyState icon={Plug} title="No connections yet" description={emptyHint} /> : null}
        >
          {rows.map((r) => (
            <Tr key={r.id}>
              <Td className="font-medium capitalize">{r.provider}</Td>
              <Td>{r.label ?? "—"}</Td>
              <Td>
                <Switch
                  checked={r.is_enabled}
                  onCheckedChange={(v) => mut.mutate({ id: r.id, is_enabled: v })}
                />
              </Td>
              <Td className="text-muted-foreground">{r.last_synced_at ? fmtRelative(r.last_synced_at) : "—"}</Td>
              <Td className="text-muted-foreground">{fmtRelative(r.updated_at)}</Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>
    </>
  );
}
