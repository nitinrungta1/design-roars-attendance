import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/leads/forms")({
  head: () => seo({
    title: "Form Submissions | Admin",
    description: "Inbox of all marketing form submissions.",
    kind: "product",
    path: "/admin/leads/forms",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Form Submissions"
      description="Inbox of all marketing form submissions."
      shippedIn="Batch 4"
    />
  ),
});
