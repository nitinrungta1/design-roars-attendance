import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/analytics/retention")({
  head: () => seo({
    title: "Retention | Admin",
    description: "Retention cohorts.",
    kind: "product",
    path: "/admin/analytics/retention",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Retention"
      description="Retention cohorts."
      shippedIn="Batch 7"
    />
  ),
});
