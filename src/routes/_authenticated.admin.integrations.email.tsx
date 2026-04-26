import { createFileRoute } from "@tanstack/react-router";
import { IntegrationModule } from "@/components/admin/integration-module";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/integrations/email")({
  head: () => seo({ title: "Email integrations | Admin", description: "Resend, SES, Postmark.", kind: "product", path: "/admin/integrations/email", noindex: true }),
  component: () => (
    <IntegrationModule kind="email" eyebrow="Integrations" title="Email Delivery" description="SMTP and transactional email providers used for notifications & marketing."
      breadcrumbLabel="Email" emptyHint="Connect Resend, SES, or Postmark to send branded transactional email." />
  ),
});
