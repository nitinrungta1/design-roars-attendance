import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/pages")({
  head: () => seo({
    title: "CMS · Pages | Admin",
    description: "Landing-page builder and publishing.",
    kind: "product",
    path: "/admin/cms/pages",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="CMS · Pages"
      description="Landing-page builder and publishing."
      shippedIn="Batch 6"
    />
  ),
});
