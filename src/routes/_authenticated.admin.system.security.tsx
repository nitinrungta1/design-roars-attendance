import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/system/security")({
  head: () => seo({
    title: "Security | Admin",
    description: "2FA, sessions, IP allowlists, HIBP.",
    kind: "product",
    path: "/admin/system/security",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Security"
      description="2FA, sessions, IP allowlists, HIBP."
      shippedIn="Batch 10"
    />
  ),
});
