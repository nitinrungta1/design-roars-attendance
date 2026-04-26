import { createFileRoute } from "@tanstack/react-router";
import { IntegrationModule } from "@/components/admin/integration-module";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/integrations/payments")({
  head: () => seo({ title: "Payment integrations | Admin", description: "Stripe, Razorpay, PayPal connections.", kind: "product", path: "/admin/integrations/payments", noindex: true }),
  component: () => (
    <IntegrationModule kind="payment" eyebrow="Integrations" title="Payment Providers" description="Connect Stripe, Razorpay, PayPal — invoices and subscriptions sync automatically."
      breadcrumbLabel="Payments" emptyHint="Add your first payment connector to start collecting revenue." />
  ),
});
