import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/billing/taxes")({
  head: () => seo({
    title: "Taxes | Admin",
    description: "Tax rules and rates.",
    kind: "product",
    path: "/admin/billing/taxes",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Taxes"
      description="Tax rules and rates."
      shippedIn="Batch 5"
    />
  ),
});
