import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PERMISSION_KEYS,
  PLATFORM_ROLES,
  updateUserRole,
  type PermissionKey,
  type PlatformRole,
  type PlatformUser,
} from "@/lib/platform-users.functions";

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  view_users: "View users",
  invite_users: "Invite users",
  edit_roles: "Edit roles",
  delete_users: "Delete users",
  view_billing: "View billing",
  edit_settings: "Edit settings",
};

export function EditRolePanel({
  user,
  open,
  onOpenChange,
}: {
  user: PlatformUser | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [role, setRole] = useState<PlatformRole>("employee");
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(
    () => Object.fromEntries(PERMISSION_KEYS.map((k) => [k, false])) as Record<PermissionKey, boolean>,
  );

  useEffect(() => {
    if (!user) return;
    const next: Record<PermissionKey, boolean> = Object.fromEntries(
      PERMISSION_KEYS.map((k) => [k, Boolean(user.permissions?.[k])]),
    ) as Record<PermissionKey, boolean>;
    setRole((user.role ?? "employee") as PlatformRole);
    setPermissions(next);
  }, [user]);

  const isSuper = role === "super_admin";

  const save = useMutation({
    mutationFn: () =>
      updateUserRole({
        data: {
          userId: user!.user_id,
          role,
          permissions: isSuper
            ? Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true]))
            : permissions,
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Role updated");
        qc.invalidateQueries({ queryKey: ["admin", "platform-users"] });
        onOpenChange(false);
      } else {
        toast.error("Failed to update role", { description: res.error });
      }
    },
    onError: (e: Error) => toast.error("Failed to update role", { description: e.message }),
  });

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name ?? ""} />}
              <AvatarFallback className="text-xs">
                {(user.full_name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="truncate">{user.full_name ?? "Unnamed"}</SheetTitle>
              <SheetDescription className="truncate">{user.email}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 flex-1 space-y-6 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as PlatformRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORM_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Permissions</Label>
              <p className="text-xs text-muted-foreground">
                {isSuper
                  ? "Super admins have all permissions enabled and they cannot be turned off."
                  : "Per-user overrides for this account."}
              </p>
            </div>
            <div className="space-y-2 rounded-lg border border-border p-3">
              {PERMISSION_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <Label htmlFor={`perm-${key}`} className="cursor-pointer text-sm font-normal">
                    {PERMISSION_LABELS[key]}
                  </Label>
                  <Switch
                    id={`perm-${key}`}
                    checked={isSuper ? true : !!permissions[key]}
                    disabled={isSuper}
                    onCheckedChange={(v) => setPermissions((prev) => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
