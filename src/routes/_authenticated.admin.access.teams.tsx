import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/access/teams")({
  head: () => seo({
    title: "Teams | Admin",
    description: "Team groupings.",
    kind: "product",
    path: "/admin/access/teams",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Teams"
      description="Team groupings."
      shippedIn="Batch 8"
    />
  ),
});
