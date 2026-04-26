import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/overtime")({
  head: () => seo({
    title: "Overtime | Admin",
    description: "Overtime rules engine and approvals queue.",
    kind: "product",
    path: "/admin/workforce/overtime",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Overtime"
      description="Overtime rules engine and approvals queue."
      shippedIn="Batch 3"
    />
  ),
});
