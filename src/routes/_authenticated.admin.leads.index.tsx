import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/leads/")({
  head: () => seo({
    title: "Leads Pipeline | Admin",
    description: "Sales pipeline: lead → demo → trial → won/lost.",
    kind: "product",
    path: "/admin/leads",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Leads Pipeline"
      description="Sales pipeline: lead → demo → trial → won/lost."
      shippedIn="Batch 4"
    />
  ),
});
