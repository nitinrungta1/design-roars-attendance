import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/system/settings")({
  head: () => seo({
    title: "Settings | Admin",
    description: "Global platform configuration.",
    kind: "product",
    path: "/admin/system/settings",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Settings"
      description="Global platform configuration."
      shippedIn="Batch 10"
    />
  ),
});
