import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/dashboard/trials")({
  head: () => seo({
    title: "Trials | Admin",
    description: "Active trials, conversions, expirations.",
    kind: "product",
    path: "/admin/dashboard/trials",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Trials"
      description="Active trials, conversions, expirations."
      shippedIn="Batch 5"
    />
  ),
});
