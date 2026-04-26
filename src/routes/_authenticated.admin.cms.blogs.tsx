import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/blogs")({
  head: () => seo({
    title: "CMS · Blogs | Admin",
    description: "Blog post editor with SEO.",
    kind: "product",
    path: "/admin/cms/blogs",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="CMS · Blogs"
      description="Blog post editor with SEO."
      shippedIn="Batch 6"
    />
  ),
});
