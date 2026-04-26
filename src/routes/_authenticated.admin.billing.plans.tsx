import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/billing/plans")({
  head: () => seo({
    title: "Plans | Admin",
    description: "Punchly plan catalog.",
    kind: "product",
    path: "/admin/billing/plans",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Plans"
      description="Punchly plan catalog."
      shippedIn="Batch 5"
    />
  ),
});
