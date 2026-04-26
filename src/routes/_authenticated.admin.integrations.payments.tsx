import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/integrations/payments")({
  head: () => seo({
    title: "Payment Gateways | Admin",
    description: "Stripe, Razorpay, PayPal toggles.",
    kind: "product",
    path: "/admin/integrations/payments",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Payment Gateways"
      description="Stripe, Razorpay, PayPal toggles."
      shippedIn="Batch 9"
    />
  ),
});
