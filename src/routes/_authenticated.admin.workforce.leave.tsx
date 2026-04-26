import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/leave")({
  head: () => seo({
    title: "Leave | Admin",
    description: "Leave balances, requests, policies.",
    kind: "product",
    path: "/admin/workforce/leave",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Leave"
      description="Leave balances, requests, policies."
      shippedIn="Batch 3"
    />
  ),
});
