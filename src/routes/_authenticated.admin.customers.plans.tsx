import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/customers/plans")({
  head: () => seo({
    title: "Customer Plans | Admin",
    description: "Plan assignments per company.",
    kind: "product",
    path: "/admin/customers/plans",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Customer Plans"
      description="Plan assignments per company."
      shippedIn="Batch 2"
    />
  ),
});
