import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/integrations/sms")({
  head: () => seo({
    title: "SMS Integration | Admin",
    description: "Twilio and other SMS providers.",
    kind: "product",
    path: "/admin/integrations/sms",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="SMS Integration"
      description="Twilio and other SMS providers."
      shippedIn="Batch 9"
    />
  ),
});
