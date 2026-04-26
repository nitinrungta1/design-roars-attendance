import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/billing/subscriptions")({
  head: () => seo({
    title: "Subscriptions | Admin",
    description: "Per-company subscriptions.",
    kind: "product",
    path: "/admin/billing/subscriptions",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Subscriptions"
      description="Per-company subscriptions."
      shippedIn="Batch 5"
    />
  ),
});
