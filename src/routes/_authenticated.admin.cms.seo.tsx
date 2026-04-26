import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/seo")({
  head: () => seo({
    title: "CMS · SEO | Admin",
    description: "Global SEO config, redirects, sitemap.",
    kind: "product",
    path: "/admin/cms/seo",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="CMS · SEO"
      description="Global SEO config, redirects, sitemap."
      shippedIn="Batch 6"
    />
  ),
});
