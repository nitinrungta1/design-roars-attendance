import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/kb")({
  head: () => seo({
    title: "Knowledge Base | Admin",
    description: "Self-service KB articles.",
    kind: "product",
    path: "/admin/support/kb",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Knowledge Base"
      description="Self-service KB articles."
      shippedIn="Batch 4"
    />
  ),
});
