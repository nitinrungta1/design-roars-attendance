import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { KeyRound, Check } from "lucide-react";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  listPermissionMatrix,
  togglePermission,
  type AppRole,
} from "@/lib/access.functions";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/access/permissions")({
  head: () =>
    seo({
      title: "Permissions | Admin",
      description: "Granular permission grid.",
      kind: "product",
      path: "/admin/access/permissions",
      noindex: true,
    }),
  component: PermissionsPage,
});

function PermissionsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "permission-matrix"],
    queryFn: () => listPermissionMatrix(),
  });

  const mut = useMutation({
    mutationFn: (vars: { role: AppRole; permissionKey: string; granted: boolean }) =>
      togglePermission({ data: vars }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["admin", "permission-matrix"] });
      const prev = qc.getQueryData<typeof data>(["admin", "permission-matrix"]);
      if (prev) {
        const grants = { ...prev.grants };
        const set = new Set(grants[vars.role] ?? []);
        if (vars.granted) set.add(vars.permissionKey);
        else set.delete(vars.permissionKey);
        grants[vars.role] = [...set];
        qc.setQueryData(["admin", "permission-matrix"], { ...prev, grants });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin", "permission-matrix"], ctx.prev);
      toast.error("Failed to update permission");
    },
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error ?? "Failed");
        qc.invalidateQueries({ queryKey: ["admin", "permission-matrix"] });
      }
    },
  });

  const matrix = data;
  const modules = useMemo(() => {
    if (!matrix) return [];
    return [...new Set(matrix.permissions.map((p) => p.module))].sort();
  }, [matrix]);

  const filtered = useMemo(() => {
    if (!matrix) return [];
    return matrix.permissions.filter((p) => {
      if (moduleFilter !== "all" && p.module !== moduleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.key.toLowerCase().includes(q) ||
          p.label.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [matrix, moduleFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const p of filtered) {
      const arr = map.get(p.module) ?? [];
      arr.push(p);
      map.set(p.module, arr);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const grantedSet = (role: AppRole) => new Set(matrix?.grants[role] ?? []);

  return (
    <>
      <PageHeader
        eyebrow="Access Control"
        title="Permission Matrix"
        description="Toggle individual permissions for each role. Changes apply instantly."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Permissions" }]}
      />
      <PageBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search permissions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-1 overflow-x-auto">
            <Button
              variant={moduleFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setModuleFilter("all")}
            >
              All
            </Button>
            {modules.map((m) => (
              <Button
                key={m}
                variant={moduleFilter === m ? "default" : "outline"}
                size="sm"
                onClick={() => setModuleFilter(m)}
                className="capitalize"
              >
                {m}
              </Button>
            ))}
          </div>
        </div>

        {isLoading || !matrix ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Loading matrix…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <KeyRound className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No permissions match.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                  <tr>
                    <th className="sticky left-0 z-20 min-w-[280px] bg-muted/60 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Permission
                    </th>
                    {matrix.roles.map((r) => (
                      <th
                        key={r}
                        className="px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="capitalize">{r.replace(/_/g, " ")}</span>
                          <span className="text-[9px] opacity-60">
                            {grantedSet(r).size}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grouped.map(([mod, perms]) => (
                    <>
                      <tr key={`mod-${mod}`} className="bg-muted/30">
                        <td
                          colSpan={matrix.roles.length + 1}
                          className="sticky left-0 px-4 py-2 text-left"
                        >
                          <Badge
                            variant="secondary"
                            className="rounded-full text-[10px] capitalize"
                          >
                            {mod}
                          </Badge>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {perms.length} permission{perms.length === 1 ? "" : "s"}
                          </span>
                        </td>
                      </tr>
                      {perms.map((p) => (
                        <tr key={p.key} className="border-t border-border hover:bg-accent/20">
                          <td className="sticky left-0 z-10 bg-card/80 px-4 py-2 backdrop-blur">
                            <div className="font-medium">{p.label}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {p.key}
                            </div>
                          </td>
                          {matrix.roles.map((r) => {
                            const granted = grantedSet(r).has(p.key);
                            const isSuper = r === "super_admin";
                            return (
                              <td key={r} className="px-2 py-1 text-center">
                                <button
                                  type="button"
                                  disabled={isSuper}
                                  onClick={() =>
                                    mut.mutate({
                                      role: r,
                                      permissionKey: p.key,
                                      granted: !granted,
                                    })
                                  }
                                  className={cn(
                                    "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition",
                                    granted
                                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400"
                                      : "border-border bg-background hover:bg-accent",
                                    isSuper && "opacity-60",
                                  )}
                                  title={
                                    isSuper
                                      ? "Super admin always has all permissions"
                                      : granted
                                        ? "Revoke"
                                        : "Grant"
                                  }
                                >
                                  {(granted || isSuper) && <Check className="h-3.5 w-3.5" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageBody>
    </>
  );
}
