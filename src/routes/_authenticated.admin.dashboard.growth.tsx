import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/dashboard/growth")({
  head: () => seo({
    title: "Growth Metrics | Admin",
    description: "Acquisition, activation, retention, revenue, referral.",
    kind: "product",
    path: "/admin/dashboard/growth",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Growth Metrics"
      description="Acquisition, activation, retention, revenue, referral."
      shippedIn="Batch 7"
    />
  ),
});
