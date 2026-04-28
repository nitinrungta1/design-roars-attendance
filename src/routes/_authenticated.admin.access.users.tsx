import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, X, Settings2, AlertCircle } from "lucide-react";
import { UserAccessSheet } from "@/components/admin/user-access-sheet";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import type { PlatformUserRow } from "@/lib/access.functions";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate, StatCard } from "@/components/admin/data-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  listPlatformUsers,
  revokeRole,
  type AppRole,
} from "@/lib/access.functions";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { useRequirePermission } from "@/hooks/use-require-permission";

export const Route = createFileRoute("/_authenticated/admin/access/users")({
  head: () =>
    seo({
      title: "Users | Admin",
      description: "User accounts and role assignments.",
      kind: "product",
      path: "/admin/access/users",
      noindex: true,
    }),
  component: UsersPage,
});

const ROLE_TONES: Record<string, string> = {
  super_admin: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  admin: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  hr: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  manager: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  finance: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  sales: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  support: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  developer: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
  viewer: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  employee: "bg-muted text-muted-foreground",
};

function UsersPage() {
  const blocked = useRequirePermission("access.users.read");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeUser, setActiveUser] = useState<PlatformUserRow | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "platform-users"],
    queryFn: () => listPlatformUsers(),
    enabled: !blocked,
  });

  const revoke = useMutation({
    mutationFn: (vars: { userId: string; role: AppRole }) =>
      revokeRole({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Role revoked");
        qc.invalidateQueries({ queryKey: ["admin", "platform-users"] });
      } else toast.error(res.error);
    },
  });

  const users = data?.users ?? [];
  const filtered = search
    ? users.filter((u) => {
        const q = search.toLowerCase();
        return (
          (u.full_name ?? "").toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q) ||
          (u.primary_company?.name ?? "").toLowerCase().includes(q) ||
          u.roles.some((r) => r.includes(q))
        );
      })
    : users;

  const totals = {
    all: users.length,
    admins: users.filter((u) => u.roles.includes("admin") || u.roles.includes("super_admin")).length,
    super: users.filter((u) => u.roles.includes("super_admin")).length,
    none: users.filter((u) => u.roles.length === 0).length,
  };

  if (blocked) return blocked;

  return (
    <>
      <PageHeader
        eyebrow="Access Control"
        title="Users"
        description="Every authenticated identity, their company, and their roles."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Users" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Users" value={totals.all} />
          <StatCard label="Admins" value={totals.admins} tone="success" />
          <StatCard label="Super admins" value={totals.super} tone="warning" />
          <StatCard label="No roles" value={totals.none} tone={totals.none > 0 ? "danger" : "default"} />
        </div>

        {data?.error && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300/40 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{data.error}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by name, company, or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            {search && (
              <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
                Clear
              </Button>
            )}
          </div>
          {data?.canCreate && <CreateUserDialog />}
        </div>

        <DataTable
          headers={["User", "Primary company", "Roles", "Joined", "Manage"]}
          empty={
            !isLoading && filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users found"
                description="Try a different search or invite users to your platform."
              />
            ) : null
          }
        >
          {filtered.map((u) => (
            <Tr key={u.user_id}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.full_name ?? ""} />}
                    <AvatarFallback className="text-xs">
                      {(u.full_name ?? u.email ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 truncate font-medium">
                      <span className="truncate">{u.full_name ?? "Unnamed"}</span>
                      {!u.email_confirmed_at && (
                        <Badge variant="secondary" className="rounded-full bg-amber-100 text-[10px] text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Pending email
                        </Badge>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {u.email ?? (
                        <span className="font-mono text-[10px]">{u.user_id.slice(0, 8)}…</span>
                      )}
                    </div>
                  </div>
                </div>
              </Td>
              <Td className="text-muted-foreground">
                {u.primary_company?.name ?? "—"}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {u.roles.length === 0 && (
                    <span className="text-xs text-muted-foreground">No roles</span>
                  )}
                  {u.roles.map((r) => (
                    <Badge
                      key={r}
                      variant="secondary"
                      className={cn("group rounded-full pr-1", ROLE_TONES[r] ?? "bg-muted")}
                    >
                      <span>{r}</span>
                      <button
                        type="button"
                        onClick={() => revoke.mutate({ userId: u.user_id, role: r })}
                        className="ml-1 rounded-full p-0.5 opacity-60 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </Td>
              <Td className="text-muted-foreground text-xs">
                {u.joined_at ? fmtDate(u.joined_at) : "—"}
              </Td>
              <Td>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setActiveUser(u)}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Roles & permissions
                </Button>
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>
      <UserAccessSheet
        user={activeUser}
        open={!!activeUser}
        onOpenChange={(o) => !o && setActiveUser(null)}
      />
    </>
  );
}
