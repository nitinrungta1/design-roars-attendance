import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/holidays")({
  head: () => seo({
    title: "Holidays | Admin",
    description: "Holiday calendar per region.",
    kind: "product",
    path: "/admin/workforce/holidays",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Holidays"
      description="Holiday calendar per region."
      shippedIn="Batch 3"
    />
  ),
});
