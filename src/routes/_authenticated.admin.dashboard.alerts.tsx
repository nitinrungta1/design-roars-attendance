import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/dashboard/alerts")({
  head: () => seo({
    title: "Alerts | Admin",
    description: "Platform-level alerts and incidents.",
    kind: "product",
    path: "/admin/dashboard/alerts",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Alerts"
      description="Platform-level alerts and incidents."
      shippedIn="Batch 8"
    />
  ),
});
