import { createFileRoute } from "@tanstack/react-router";
import { IntegrationModule } from "@/components/admin/integration-module";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/integrations/whatsapp")({
  head: () => seo({ title: "WhatsApp integrations | Admin", description: "Cloud API & WhatsApp BSPs.", kind: "product", path: "/admin/integrations/whatsapp", noindex: true }),
  component: () => (
    <IntegrationModule kind="whatsapp" eyebrow="Integrations" title="WhatsApp" description="Connect WhatsApp Cloud API or a BSP for templated employee notifications."
      breadcrumbLabel="WhatsApp" emptyHint="Add a WhatsApp Business connection to enable shift reminders & approvals on chat." />
  ),
});
