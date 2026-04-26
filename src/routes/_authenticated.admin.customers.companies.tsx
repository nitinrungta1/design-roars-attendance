import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/customers/companies")({
  head: () => seo({
    title: "Companies | Admin",
    description: "All customer companies on Punchly.",
    kind: "product",
    path: "/admin/customers/companies",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Companies"
      description="All customer companies on Punchly."
      shippedIn="Batch 2"
    />
  ),
});
