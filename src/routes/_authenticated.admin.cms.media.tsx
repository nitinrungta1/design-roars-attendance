import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/media")({
  head: () => seo({
    title: "CMS · Media | Admin",
    description: "Media library.",
    kind: "product",
    path: "/admin/cms/media",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="CMS · Media"
      description="Media library."
      shippedIn="Batch 6"
    />
  ),
});
