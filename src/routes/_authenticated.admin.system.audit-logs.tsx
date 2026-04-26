import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/system/audit-logs")({
  head: () => seo({
    title: "Audit Logs | Admin",
    description: "Searchable platform audit trail.",
    kind: "product",
    path: "/admin/system/audit-logs",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Audit Logs"
      description="Searchable platform audit trail."
      shippedIn="Batch 8"
    />
  ),
});
