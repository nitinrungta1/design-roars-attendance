import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/integrations/whatsapp")({
  head: () => seo({
    title: "WhatsApp Integration | Admin",
    description: "WhatsApp Cloud API.",
    kind: "product",
    path: "/admin/integrations/whatsapp",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="WhatsApp Integration"
      description="WhatsApp Cloud API."
      shippedIn="Batch 9"
    />
  ),
});
