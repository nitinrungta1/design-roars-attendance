import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/access/permissions")({
  head: () => seo({
    title: "Permissions | Admin",
    description: "Granular permission grid.",
    kind: "product",
    path: "/admin/access/permissions",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Permissions"
      description="Granular permission grid."
      shippedIn="Batch 8"
    />
  ),
});
