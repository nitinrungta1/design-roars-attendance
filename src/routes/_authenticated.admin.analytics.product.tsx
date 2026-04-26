import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/analytics/product")({
  head: () => seo({
    title: "Product Usage | Admin",
    description: "DAU/WAU/MAU, feature usage.",
    kind: "product",
    path: "/admin/analytics/product",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Product Usage"
      description="DAU/WAU/MAU, feature usage."
      shippedIn="Batch 7"
    />
  ),
});
