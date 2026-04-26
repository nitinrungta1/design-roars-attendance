import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/careers")({
  head: () => seo({
    title: "CMS · Careers | Admin",
    description: "Job postings management.",
    kind: "product",
    path: "/admin/cms/careers",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="CMS · Careers"
      description="Job postings management."
      shippedIn="Batch 6"
    />
  ),
});
