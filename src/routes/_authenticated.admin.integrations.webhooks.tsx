import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Webhook } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, fmtRelative } from "@/components/admin/data-shell";
import { listWebhooks } from "@/lib/integrations.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/integrations/webhooks")({
  head: () => seo({ title: "Webhooks | Admin", description: "Outbound webhook endpoints.", kind: "product", path: "/admin/integrations/webhooks", noindex: true }),
  component: WebhooksPage,
});

function WebhooksPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "webhooks"], queryFn: () => listWebhooks() });
  const rows = data?.webhooks ?? [];
  return (
    <>
      <PageHeader eyebrow="Integrations" title="Webhooks" description="Subscribe external systems to events from Punchly."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Webhooks" }]} />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Endpoints" value={rows.length} />
          <StatCard label="Active" value={rows.filter((w) => w.is_active).length} tone="success" />
          <StatCard label="Failing" value={rows.filter((w) => (w.last_status ?? 200) >= 400).length} tone="danger" />
        </div>
        <DataTable headers={["Label", "URL", "Events", "Status", "Last call"]}
          empty={!isLoading && rows.length === 0 ? <EmptyState icon={Webhook} title="No webhooks yet" description="Add an endpoint to forward events to Slack, Zapier, or your own system." /> : null}>
          {rows.map((w) => (
            <Tr key={w.id}>
              <Td className="font-medium">{w.label}</Td>
              <Td mono className="max-w-[20rem] truncate">{w.url}</Td>
              <Td className="text-xs text-muted-foreground">{w.events.join(", ") || "*"}</Td>
              <Td mono>{w.last_status ?? "—"}</Td>
              <Td className="text-muted-foreground">{w.last_called_at ? fmtRelative(w.last_called_at) : "—"}</Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>
    </>
  );
}
