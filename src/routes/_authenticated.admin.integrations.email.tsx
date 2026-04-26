import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/integrations/email")({
  head: () => seo({
    title: "Email Integration | Admin",
    description: "Lovable Email and third-party providers.",
    kind: "product",
    path: "/admin/integrations/email",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Email Integration"
      description="Lovable Email and third-party providers."
      shippedIn="Batch 9"
    />
  ),
});
