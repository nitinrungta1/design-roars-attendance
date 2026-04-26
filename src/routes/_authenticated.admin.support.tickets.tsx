import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ticket } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, StatusBadge, fmtRelative } from "@/components/admin/data-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { listTickets, patchTicket, TICKET_STATUSES } from "@/lib/support.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/tickets")({
  head: () => seo({ title: "Tickets | Admin", description: "Customer support tickets and SLA.", kind: "product", path: "/admin/support/tickets", noindex: true }),
  component: TicketsPage,
});

function TicketsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "tickets"], queryFn: () => listTickets() });
  const mut = useMutation({
    mutationFn: (vars: { id: string; status: typeof TICKET_STATUSES[number] }) => patchTicket({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) qc.invalidateQueries({ queryKey: ["admin", "tickets"] });
      else toast.error(res.error);
    },
  });
  const tickets = data?.tickets ?? [];
  const open = tickets.filter((t) => t.status === "open").length;
  const pending = tickets.filter((t) => t.status === "pending").length;
  const resolved = tickets.filter((t) => t.status === "resolved").length;

  return (
    <>
      <PageHeader
        eyebrow="Customer Support"
        title="Tickets"
        description="Inbound conversations across email, chat, portal, WhatsApp & API."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Tickets" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={tickets.length} />
          <StatCard label="Open" value={open} tone="warning" />
          <StatCard label="Pending" value={pending} />
          <StatCard label="Resolved" value={resolved} tone="success" />
        </div>
        <DataTable
          headers={["Subject", "Requester", "Priority", "Status", "Channel", "Updated"]}
          empty={!isLoading && tickets.length === 0 ? <EmptyState icon={Ticket} title="No tickets yet" description="Customer tickets will appear here." /> : null}
        >
          {tickets.map((t) => (
            <Tr key={t.id}>
              <Td className="font-medium">{t.subject}</Td>
              <Td>
                <div className="text-sm">{t.requester_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{t.requester_email}</div>
              </Td>
              <Td><StatusBadge status={t.priority} /></Td>
              <Td>
                <Select value={t.status} onValueChange={(v) => mut.mutate({ id: t.id, status: v as typeof TICKET_STATUSES[number] })}>
                  <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Td>
              <Td className="capitalize">{t.channel}</Td>
              <Td className="text-muted-foreground">{fmtRelative(t.updated_at)}</Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>
    </>
  );
}
