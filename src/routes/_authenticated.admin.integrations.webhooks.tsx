import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/integrations/webhooks")({
  head: () => seo({
    title: "Webhooks | Admin",
    description: "Outbound webhook subscriptions.",
    kind: "product",
    path: "/admin/integrations/webhooks",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Webhooks"
      description="Outbound webhook subscriptions."
      shippedIn="Batch 9"
    />
  ),
});
