import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Building2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { profile, user, roles, isSuperAdmin, isAdmin } = useAuth();
  const name = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  const stats = [
    { label: "Active employees", value: "—", icon: Users, href: "/admin/people" },
    { label: "Today's check-ins", value: "—", icon: Clock, href: "/admin/attendance" },
    { label: "Companies", value: "—", icon: Building2, href: "/admin/company" },
    { label: "Pending roles", value: "—", icon: ShieldCheck, href: "/admin/access/users" },
  ];

  return (
    <div className="container-x mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Punchly Admin
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Welcome back, {name}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening with your team today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <Badge key={r} variant="secondary" className="capitalize">
              {r.replace("_", " ")}
            </Badge>
          ))}
          {roles.length === 0 && <Badge variant="outline">No roles assigned</Badge>}
        </div>
      </div>

      {isSuperAdmin && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            <strong>You're the super admin.</strong> You can promote teammates from{" "}
            <Link to="/admin/access/users" className="font-semibold underline">
              Access · Users
            </Link>
            .
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.href}>
            <Card className="transition-colors hover:border-primary/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Get started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Punchly is being set up for your organization. Next steps:
          </p>
          <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
            <li>Invite your team from <Link to="/admin/access/users" className="text-foreground underline">Access · Users</Link></li>
            <li>Configure attendance rules (coming soon)</li>
            <li>Set up shift schedules (coming soon)</li>
            <li>Connect payroll integration (coming soon)</li>
          </ul>
          {!isAdmin && (
            <p className="rounded-md border border-border bg-muted/40 p-3 text-xs">
              You don't have admin permissions yet. Ask your super admin to grant you a role.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
