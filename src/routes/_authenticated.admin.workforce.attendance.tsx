import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/attendance")({
  head: () => seo({
    title: "Attendance | Admin",
    description: "Live attendance logs, geo punches, exceptions.",
    kind: "product",
    path: "/admin/workforce/attendance",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Attendance"
      description="Live attendance logs, geo punches, exceptions."
      shippedIn="Batch 3"
    />
  ),
});
