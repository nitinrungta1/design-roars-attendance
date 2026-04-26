import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/sla")({
  head: () => seo({
    title: "SLA | Admin",
    description: "SLA policies and timers.",
    kind: "product",
    path: "/admin/support/sla",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="SLA"
      description="SLA policies and timers."
      shippedIn="Batch 4"
    />
  ),
});
