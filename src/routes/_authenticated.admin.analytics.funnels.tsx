import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/analytics/funnels")({
  head: () => seo({
    title: "Conversion Funnels | Admin",
    description: "Funnel builder and analysis.",
    kind: "product",
    path: "/admin/analytics/funnels",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Conversion Funnels"
      description="Funnel builder and analysis."
      shippedIn="Batch 7"
    />
  ),
});
