import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/system/backups")({
  head: () => seo({
    title: "Backups | Admin",
    description: "Manual snapshots and downloads.",
    kind: "product",
    path: "/admin/system/backups",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Backups"
      description="Manual snapshots and downloads."
      shippedIn="Batch 10"
    />
  ),
});
