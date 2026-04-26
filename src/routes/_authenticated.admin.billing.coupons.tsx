import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/billing/coupons")({
  head: () => seo({
    title: "Coupons | Admin",
    description: "Discount codes and promotions.",
    kind: "product",
    path: "/admin/billing/coupons",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Coupons"
      description="Discount codes and promotions."
      shippedIn="Batch 5"
    />
  ),
});
