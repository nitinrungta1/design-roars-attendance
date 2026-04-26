import { createFileRoute } from "@tanstack/react-router";
import { IntegrationModule } from "@/components/admin/integration-module";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/integrations/sms")({
  head: () => seo({ title: "SMS integrations | Admin", description: "Twilio, MSG91, Plivo.", kind: "product", path: "/admin/integrations/sms", noindex: true }),
  component: () => (
    <IntegrationModule kind="sms" eyebrow="Integrations" title="SMS Providers" description="Send OTPs, attendance reminders and alerts via SMS."
      breadcrumbLabel="SMS" emptyHint="Connect Twilio, MSG91, or Plivo to enable SMS-based reminders." />
  ),
});
