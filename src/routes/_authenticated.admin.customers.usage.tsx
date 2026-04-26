import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/customers/usage")({
  head: () => seo({
    title: "Customer Usage | Admin",
    description: "Per-company usage and quotas.",
    kind: "product",
    path: "/admin/customers/usage",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Customer Usage"
      description="Per-company usage and quotas."
      shippedIn="Batch 2"
    />
  ),
});
