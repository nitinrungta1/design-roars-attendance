import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/chat")({
  head: () => seo({
    title: "Live Chat | Admin",
    description: "Real-time chat with customers.",
    kind: "product",
    path: "/admin/support/chat",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Live Chat"
      description="Real-time chat with customers."
      shippedIn="Batch 4"
    />
  ),
});
