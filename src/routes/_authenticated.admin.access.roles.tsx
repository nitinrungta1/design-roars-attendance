import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/access/roles")({
  head: () => seo({
    title: "Roles | Admin",
    description: "Role editor with per-module permissions.",
    kind: "product",
    path: "/admin/access/roles",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Roles"
      description="Role editor with per-module permissions."
      shippedIn="Batch 8"
    />
  ),
});
