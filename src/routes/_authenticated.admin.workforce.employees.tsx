import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderModule } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/employees")({
  head: () => seo({
    title: "Employees | Admin",
    description: "Employee directory, departments, designations.",
    kind: "product",
    path: "/admin/workforce/employees",
    noindex: true,
  }),
  component: () => (
    <PlaceholderModule
      title="Employees"
      description="Employee directory, departments, designations."
      shippedIn="Batch 3"
    />
  ),
});
