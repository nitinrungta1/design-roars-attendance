import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/dashboard/revenue")({
  head: () => seo({
    title: "Revenue | Admin",
    description: "MRR, ARR, expansion, contraction.",
    kind: "product",
    path: "/admin/dashboard/revenue",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Revenue"
      description="MRR, ARR, expansion, contraction."
      shippedIn="Batch 5"
    />
  ),
});
