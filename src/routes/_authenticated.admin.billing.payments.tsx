import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/billing/payments")({
  head: () => seo({
    title: "Payments | Admin",
    description: "Payment log and refunds.",
    kind: "product",
    path: "/admin/billing/payments",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Payments"
      description="Payment log and refunds."
      shippedIn="Batch 5"
    />
  ),
});
