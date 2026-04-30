import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Mail,
  MoreHorizontal,
  PencilLine,
  RotateCcw,
  ShieldOff,
  Trash2,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { seo } from "@/lib/seo";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate, StatCard } from "@/components/admin/data-shell";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { EditRolePanel } from "@/components/admin/edit-role-panel";
import { PlatformShell } from "@/components/admin/platform-shell";
import {
  listUsers,
  PLATFORM_ROLES,
  resendInvite,
  revokeUser,
  setUserBanned,
  type PlatformRole,
  type PlatformUser,
  type UserStatus,
} from "@/lib/platform-users.functions";

export const Route = createFileRoute("/_authenticated/admin_/users")({
  head: () =>
    seo({
      title: "Users | Admin",
      description: "Platform-wide user management.",
      kind: "product",
      path: "/admin/users",
      noindex: true,
    }),
  component: PlatformUsersPage,
  errorComponent: ({ error, reset }) => (
    <PlatformShell>
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold text-destructive">Users page failed to load</h2>
        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
          {error?.message ?? String(error)}
        </p>
        {error?.stack && (
          <pre className="mt-3 max-h-64 overflow-auto rounded bg-muted/50 p-2 text-[11px] text-muted-foreground">
            {error.stack}
          </pre>
        )}
        <button
          onClick={() => reset()}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </PlatformShell>
  ),
});

  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  deactivated: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

const ROLE_TONE: Record<PlatformRole, string> = {
  super_admin: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  manager: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  employee: "bg-muted text-muted-foreground",
};

function PlatformUsersPage() {
  const { isSuperAdmin, hasPermission, loading: authLoading } = useAuth();
  const allowed = !authLoading && (isSuperAdmin || hasPermission("access.users.read"));

  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | PlatformRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlatformUser | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<PlatformUser | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<PlatformUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "platform-users"],
    queryFn: () => listUsers(),
    enabled: allowed,
  });

  const deactivate = useMutation({
    mutationFn: (vars: { userId: string; banned: boolean }) => setUserBanned({ data: vars }),
    onSuccess: (res, vars) => {
      if (res.ok) {
        toast.success(vars.banned ? "User deactivated" : "User reactivated");
        qc.invalidateQueries({ queryKey: ["admin", "platform-users"] });
      } else toast.error("Action failed", { description: res.error });
    },
    onError: (e: Error) => toast.error("Action failed", { description: e.message }),
  });

  const resend = useMutation({
    mutationFn: (email: string) => resendInvite({ data: { email } }),
    onSuccess: (res, email) => {
      if (res.ok) toast.success(`Invite resent to ${email}`);
      else toast.error("Failed to resend invite", { description: res.error });
    },
    onError: (e: Error) => toast.error("Failed to resend invite", { description: e.message }),
  });

  const revoke = useMutation({
    mutationFn: (userId: string) => revokeUser({ data: { userId } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Invite revoked");
        qc.invalidateQueries({ queryKey: ["admin", "platform-users"] });
      } else toast.error("Failed to revoke", { description: res.error });
    },
    onError: (e: Error) => toast.error("Failed to revoke", { description: e.message }),
  });

  const users = data?.users ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (u.full_name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  if (!authLoading && !allowed) {
    return (
      <PlatformShell>
        <PageHeader
          eyebrow="Restricted"
          title="Users"
          description="Only super admins or admins can manage users."
          breadcrumbs={[{ label: "Home", to: "/home" }, { label: "Users" }]}
        />
        <PageBody>
          <EmptyState icon={UsersIcon} title="Permission required" description="Ask a super admin to grant access." />
        </PageBody>
      </PlatformShell>
    );
  }

  return (
    <PlatformShell>
      <PageHeader
        eyebrow="Platform"
        title="Users"
        description="Every account on the Oqlio platform — invites, roles, and access status."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Users" }]}
        actions={
          <Button size="sm" className="h-9 gap-1.5" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Invite user
          </Button>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total users" value={data?.stats.total ?? 0} />
          <StatCard label="Super admins" value={data?.stats.superAdmins ?? 0} tone="warning" />
          <StatCard label="Pending invites" value={data?.stats.pending ?? 0} />
          <StatCard label="Deactivated" value={data?.stats.deactivated ?? 0} tone={data?.stats.deactivated ? "danger" : "default"} />
        </div>

        {data?.error && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300/40 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{data.error}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
            <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {PLATFORM_ROLES.map((r) => (
                <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>
          {(search || roleFilter !== "all" || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
            >
              Clear
            </Button>
          )}
        </div>

        <DataTable
          headers={["User", "Role", "Status", "Joined", "Actions"]}
          empty={
            !isLoading && filtered.length === 0 ? (
              <EmptyState icon={UsersIcon} title="No users found" description="Try a different search or invite a teammate." />
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
                    <div className="truncate font-medium">{u.full_name ?? "Unnamed"}</div>
                    <div className="truncate text-xs text-muted-foreground">{u.email ?? "—"}</div>
                  </div>
                </div>
              </Td>
              <Td>
                {u.role ? (
                  <Badge className={`${ROLE_TONE[u.role]} rounded-full capitalize`} variant="secondary">
                    {u.role.replace("_", " ")}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">No role</span>
                )}
              </Td>
              <Td>
                <Badge className={`${STATUS_TONE[u.status]} rounded-full capitalize`} variant="secondary">
                  {u.status}
                </Badge>
              </Td>
              <Td className="text-xs text-muted-foreground">{u.joined_at ? fmtDate(u.joined_at) : "—"}</Td>
              <Td>
                <div className="flex items-center justify-end gap-1">
                  {u.status === "active" && (
                    <>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setEditTarget(u)}>
                        <PencilLine className="h-3.5 w-3.5" />
                        Edit role
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs text-rose-600 hover:text-rose-700"
                        onClick={() => setConfirmDeactivate(u)}
                      >
                        <ShieldOff className="h-3.5 w-3.5" />
                        Deactivate
                      </Button>
                    </>
                  )}
                  {u.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs"
                        disabled={resend.isPending}
                        onClick={() => u.email && resend.mutate(u.email)}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Resend invite
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-xs text-rose-600 hover:text-rose-700"
                        onClick={() => setConfirmRevoke(u)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Revoke
                      </Button>
                    </>
                  )}
                  {u.status === "deactivated" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                      disabled={deactivate.isPending}
                      onClick={() => deactivate.mutate({ userId: u.user_id, banned: false })}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reactivate
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTarget(u)}>Edit role & permissions</DropdownMenuItem>
                      {u.status !== "deactivated" && u.email && (
                        <DropdownMenuItem onClick={() => resend.mutate(u.email!)}>Send invite email</DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {u.status === "active" && (
                        <DropdownMenuItem className="text-rose-600" onClick={() => setConfirmDeactivate(u)}>
                          Deactivate user
                        </DropdownMenuItem>
                      )}
                      {u.status === "pending" && (
                        <DropdownMenuItem className="text-rose-600" onClick={() => setConfirmRevoke(u)}>
                          Revoke invite
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td>
            </tr>
          )}
        </DataTable>
      </PageBody>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <EditRolePanel
        user={editTarget}
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      />

      <AlertDialog open={!!confirmDeactivate} onOpenChange={(o) => !o && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {confirmDeactivate?.full_name ?? confirmDeactivate?.email ?? "user"}?</AlertDialogTitle>
            <AlertDialogDescription>They will lose access immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDeactivate) deactivate.mutate({ userId: confirmDeactivate.user_id, banned: true });
                setConfirmDeactivate(null);
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmRevoke} onOpenChange={(o) => !o && setConfirmRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invite for {confirmRevoke?.email}?</AlertDialogTitle>
            <AlertDialogDescription>The pending invite will be deleted and the email will no longer be able to accept it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmRevoke) revoke.mutate(confirmRevoke.user_id);
                setConfirmRevoke(null);
              }}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PlatformShell>
  );
}
