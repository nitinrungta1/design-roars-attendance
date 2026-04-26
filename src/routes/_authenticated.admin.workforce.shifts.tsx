import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/shifts")({
  head: () => seo({
    title: "Shifts | Admin",
    description: "Shift templates, rotations, assignments.",
    kind: "product",
    path: "/admin/workforce/shifts",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Shifts"
      description="Shift templates, rotations, assignments."
      shippedIn="Batch 3"
    />
  ),
});
