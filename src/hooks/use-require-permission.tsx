import { ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader, PageBody } from "@/components/admin/primitives";

/**
 * Page-level permission guard. Call at the top of an admin route component.
 * Returns `null` when the user is allowed (render the page normally).
 * Returns a JSX block with a "Permission required" empty state otherwise.
 *
 * Usage:
 *   const blocked = useRequirePermission("billing.plans.read");
 *   if (blocked) return blocked;
 */
export function useRequirePermission(key: string): JSX.Element | null {
  const { hasPermission, loading } = useAuth();

  if (loading) return null;
  if (hasPermission(key)) return null;

  return (
    <>
      <PageHeader
        eyebrow="Restricted"
        title="Permission required"
        description="You don't have access to this area. Ask a super admin to grant the permission below."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Restricted" }]}
      />
      <PageBody>
        <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <ShieldAlert className="mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Missing permission</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This page requires the permission:
          </p>
          <code className="mt-3 rounded-md border border-border bg-muted px-3 py-1.5 font-mono text-xs">
            {key}
          </code>
          <p className="mt-4 text-xs text-muted-foreground">
            A super admin can grant it from the Permission Matrix.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/admin">Back to overview</Link>
          </Button>
        </div>
      </PageBody>
    </>
  );
}
