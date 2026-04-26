import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/access/users")({
  head: () => seo({
    title: "Users | Admin",
    description: "User accounts and role assignments.",
    kind: "product",
    path: "/admin/access/users",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Users"
      description="User accounts and role assignments."
      shippedIn="Batch 8"
    />
  ),
});
