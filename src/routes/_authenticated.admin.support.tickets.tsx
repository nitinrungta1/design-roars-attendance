import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/tickets")({
  head: () => seo({
    title: "Tickets | Admin",
    description: "Customer support tickets and SLA.",
    kind: "product",
    path: "/admin/support/tickets",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Tickets"
      description="Customer support tickets and SLA."
      shippedIn="Batch 4"
    />
  ),
});
