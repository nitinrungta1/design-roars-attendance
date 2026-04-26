import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/customers/contacts")({
  head: () => seo({
    title: "Contacts | Admin",
    description: "All human contacts across customer companies.",
    kind: "product",
    path: "/admin/customers/contacts",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Contacts"
      description="All human contacts across customer companies."
      shippedIn="Batch 2"
    />
  ),
});
