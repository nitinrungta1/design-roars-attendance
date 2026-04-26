import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/analytics/acquisition")({
  head: () => seo({
    title: "Acquisition | Admin",
    description: "Source-wise signups, campaign ROI.",
    kind: "product",
    path: "/admin/analytics/acquisition",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Acquisition"
      description="Source-wise signups, campaign ROI."
      shippedIn="Batch 7"
    />
  ),
});
