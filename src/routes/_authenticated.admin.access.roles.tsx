import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, KeyRound, Users } from "lucide-react";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { listRolesWithCounts } from "@/lib/access.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { useRequirePermission } from "@/hooks/use-require-permission";

export const Route = createFileRoute("/_authenticated/admin/access/roles")({
  head: () =>
    seo({
      title: "Roles | Admin",
      description: "Role editor with per-module permissions.",
      kind: "product",
      path: "/admin/access/roles",
      noindex: true,
    }),
  component: RolesPage,
});

const ROLE_INFO: Record<string, { tone: string; desc: string }> = {
  super_admin: {
    tone: "border-rose-500/30 bg-rose-500/5",
    desc: "Unrestricted access across every tenant and module.",
  },
  admin: {
    tone: "border-violet-500/30 bg-violet-500/5",
    desc: "Manage tenants, billing, content, and most settings.",
  },
  hr: {
    tone: "border-emerald-500/30 bg-emerald-500/5",
    desc: "Workforce, attendance, leave, and people operations.",
  },
  manager: {
    tone: "border-sky-500/30 bg-sky-500/5",
    desc: "Approve team timesheets, leave, and overtime.",
  },
  finance: {
    tone: "border-amber-500/30 bg-amber-500/5",
    desc: "Plans, invoices, payments, taxes, and coupons.",
  },
  sales: {
    tone: "border-orange-500/30 bg-orange-500/5",
    desc: "CRM pipeline, leads, contacts, and demo follow-ups.",
  },
  support: {
    tone: "border-indigo-500/30 bg-indigo-500/5",
    desc: "Tickets, knowledge base, and chat queue.",
  },
  developer: {
    tone: "border-pink-500/30 bg-pink-500/5",
    desc: "API keys, webhooks, integrations, and platform debugging.",
  },
  viewer: {
    tone: "border-slate-500/30 bg-slate-500/5",
    desc: "Read-only across analytics and dashboards.",
  },
  employee: {
    tone: "border-muted bg-muted/40",
    desc: "Default role for every signed-up user.",
  },
};

function RolesPage() {
  const blocked = useRequirePermission("access.roles.write");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => listRolesWithCounts(),
    enabled: !blocked,
  });

  const roles = data?.roles ?? [];

  if (blocked) return blocked;

  return (
    <>
      <PageHeader
        eyebrow="Access Control"
        title="Roles"
        description="Each role bundles a set of permissions. Edit grants in the matrix."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Roles" }]}
        actions={
          <Button asChild size="sm">
            <Link to="/admin/access/permissions">
              <KeyRound className="mr-2 h-4 w-4" />
              Open permission matrix
            </Link>
          </Button>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-2xl border border-border bg-muted/30"
                />
              ))
            : roles.map((r) => {
                const info = ROLE_INFO[r.role] ?? {
                  tone: "border-border bg-card/40",
                  desc: "Custom role.",
                };
                return (
                  <div
                    key={r.role}
                    className={cn(
                      "flex flex-col rounded-2xl border p-5 transition hover:shadow-sm",
                      info.tone,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background/80 backdrop-blur">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {r.permission_count} perms
                      </Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold capitalize">
                      {r.role.replace(/_/g, " ")}
                    </h3>
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">{info.desc}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {r.member_count} member{r.member_count === 1 ? "" : "s"}
                      </span>
                      <Link
                        to="/admin/access/permissions"
                        className="font-medium text-foreground hover:underline"
                      >
                        Edit →
                      </Link>
                    </div>
                  </div>
                );
              })}
        </div>
      </PageBody>
    </>
  );
}
