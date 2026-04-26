import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/billing/invoices")({
  head: () => seo({
    title: "Invoices | Admin",
    description: "Invoices, GST/VAT, retries.",
    kind: "product",
    path: "/admin/billing/invoices",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Invoices"
      description="Invoices, GST/VAT, retries."
      shippedIn="Batch 5"
    />
  ),
});
