import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/integrations/apis")({
  head: () => seo({
    title: "Public APIs | Admin",
    description: "API key issuance for mobile/integrations.",
    kind: "product",
    path: "/admin/integrations/apis",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Public APIs"
      description="API key issuance for mobile/integrations."
      shippedIn="Batch 9"
    />
  ),
});
