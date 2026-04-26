import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/analytics/churn")({
  head: () => seo({
    title: "Churn | Admin",
    description: "Churn rate and cohort retention.",
    kind: "product",
    path: "/admin/analytics/churn",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Churn"
      description="Churn rate and cohort retention."
      shippedIn="Batch 7"
    />
  ),
});
