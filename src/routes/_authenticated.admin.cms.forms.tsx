import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/forms")({
  head: () => seo({
    title: "CMS · Forms | Admin",
    description: "Form builder.",
    kind: "product",
    path: "/admin/cms/forms",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="CMS · Forms"
      description="Form builder."
      shippedIn="Batch 6"
    />
  ),
});
