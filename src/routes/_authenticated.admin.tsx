import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => seo({
    title: "Admin",
    description: "Punchly admin command center.",
    kind: "product",
    path: "/admin",
    noindex: true,
  }),
  component: AdminLayout,
  errorComponent: ({ error, reset }) => {
    if (typeof console !== "undefined") console.error("[admin] errorComponent", error);
    return (
      <AdminShell>
        <div className="m-6 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive">Admin module crashed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            onClick={() => reset()}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </AdminShell>
    );
  },
  notFoundComponent: () => (
    <AdminShell>
      <div className="m-6 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Page not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">This admin page doesn't exist.</p>
        <Link
          to="/admin"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to overview
        </Link>
      </div>
    </AdminShell>
  ),
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
