import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/timesheets")({
  head: () => seo({
    title: "Timesheets | Admin",
    description: "Submitted, locked, billable timesheets.",
    kind: "product",
    path: "/admin/workforce/timesheets",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Timesheets"
      description="Submitted, locked, billable timesheets."
      shippedIn="Batch 3"
    />
  ),
});
