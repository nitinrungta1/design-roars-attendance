import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/customers/accounts")({
  head: () => seo({
    title: "Accounts | Admin",
    description: "Owner contacts per company.",
    kind: "product",
    path: "/admin/customers/accounts",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Accounts"
      description="Owner contacts per company."
      shippedIn="Batch 2"
    />
  ),
});
