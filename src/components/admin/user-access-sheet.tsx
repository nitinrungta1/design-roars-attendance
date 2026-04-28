import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Check, X as XIcon, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  assignRole,
  revokeRole,
  listPermissionMatrix,
  APP_ROLES,
  type AppRole,
  type PlatformUserRow,
} from "@/lib/access.functions";
import { cn } from "@/lib/utils";

interface Props {
  user: PlatformUserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserAccessSheet({ user, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { data: matrix } = useQuery({
    queryKey: ["admin", "permission-matrix"],
    queryFn: () => listPermissionMatrix(),
    enabled: open,
  });

  const [selectedModule, setSelectedModule] = useState<string>("__all__");

  const modules = useMemo(() => {
    if (!matrix) return [];
    return Array.from(new Set(matrix.permissions.map((p) => p.module))).sort();
  }, [matrix]);

  // Effective permissions = union across user's roles
  const effectivePerms = useMemo(() => {
    if (!matrix || !user) return new Set<string>();
    const set = new Set<string>();
    for (const r of user.roles) {
      for (const k of matrix.grants[r] ?? []) set.add(k);
    }
    return set;
  }, [matrix, user]);

  const filteredPerms = useMemo(() => {
    if (!matrix) return [];
    if (selectedModule === "__all__") return matrix.permissions;
    return matrix.permissions.filter((p) => p.module === selectedModule);
  }, [matrix, selectedModule]);

  const assign = useMutation({
    mutationFn: (vars: { userId: string; role: AppRole }) =>
      assignRole({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Role granted");
        qc.invalidateQueries({ queryKey: ["admin", "platform-users"] });
      } else toast.error(res.error);
    },
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

  if (!user) return null;

  const availableRoles = APP_ROLES.filter((r) => !user.roles.includes(r));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Access for {user.full_name ?? "user"}
          </SheetTitle>
          <SheetDescription>
            Roles grant bundles of permissions. Use the module filter to inspect what
            this user can do across the system.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Roles */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Assigned roles</h3>
              <Select
                value=""
                onValueChange={(v) =>
                  assign.mutate({ userId: user.user_id, role: v as AppRole })
                }
              >
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="+ Grant role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize text-xs">
                      {r.replace("_", " ")}
                    </SelectItem>
                  ))}
                  {availableRoles.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      All roles assigned
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {user.roles.length === 0 && (
                <span className="text-xs text-muted-foreground">No roles assigned</span>
              )}
              {user.roles.map((r) => (
                <Badge
                  key={r}
                  variant="secondary"
                  className="group rounded-full pr-1 capitalize"
                >
                  <span>{r.replace("_", " ")}</span>
                  <button
                    type="button"
                    onClick={() => revoke.mutate({ userId: user.user_id, role: r })}
                    className="ml-1 rounded-full p-0.5 opacity-60 hover:opacity-100"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </section>

          <Separator />

          {/* Permissions */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Effective permissions</h3>
                <p className="text-xs text-muted-foreground">
                  Read-only view of what the assigned roles allow.
                </p>
              </div>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <Layers className="mr-1 h-3 w-3" />
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="text-xs">
                    All modules
                  </SelectItem>
                  {modules.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize text-xs">
                      {m.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[420px] rounded-md border">
              <div className="divide-y">
                {filteredPerms.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    {matrix ? "No permissions in this module." : "Loading…"}
                  </div>
                )}
                {filteredPerms.map((p) => {
                  const granted = effectivePerms.has(p.key);
                  return (
                    <div
                      key={p.key}
                      className={cn(
                        "flex items-start justify-between gap-3 px-3 py-2.5 text-xs",
                        granted ? "bg-emerald-50/40 dark:bg-emerald-950/20" : "",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.label}</span>
                          <Badge
                            variant="outline"
                            className="h-4 px-1 text-[10px] capitalize"
                          >
                            {p.module.replace("_", " ")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="h-4 px-1 text-[10px] uppercase tracking-wide"
                          >
                            {p.action}
                          </Badge>
                        </div>
                        {p.description && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {p.description}
                          </p>
                        )}
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                          {p.key}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                          granted
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground",
                        )}
                        title={granted ? "Granted" : "Not granted"}
                      >
                        {granted ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <XIcon className="h-3 w-3" />
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <p className="text-[11px] text-muted-foreground">
              Tip: To change what a role can do, edit the role itself in{" "}
              <span className="font-medium">Access → Permissions</span>.
            </p>
          </section>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
