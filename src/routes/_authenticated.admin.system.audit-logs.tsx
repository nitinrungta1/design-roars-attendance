import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollText, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtRelative } from "@/components/admin/data-shell";
import { listAuditLogs } from "@/lib/system.functions";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/system/audit-logs")({
  head: () =>
    seo({
      title: "Audit Logs | Admin",
      description: "Searchable platform audit trail.",
      kind: "product",
      path: "/admin/system/audit-logs",
      noindex: true,
    }),
  component: AuditLogsPage,
});

function actionTone(action: string): string {
  if (action.includes(".created") || action.includes(".granted") || action.includes(".enabled"))
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (action.includes(".deleted") || action.includes(".revoked") || action.includes(".disabled"))
    return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";
  if (action.includes(".updated") || action.includes(".changed") || action.includes(".set"))
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  return "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300";
}

function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-logs", search, actionFilter],
    queryFn: () =>
      listAuditLogs({
        data: {
          q: search || undefined,
          action: actionFilter !== "all" ? actionFilter : undefined,
          limit: 200,
        },
      }),
  });

  const logs = data?.logs ?? [];
  const actions = data?.actions ?? [];

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Audit Logs"
        description="Every privileged change across the platform — who, what, and when."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Audit Logs" }]}
      />
      <PageBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search by action, entity, or id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || actionFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setActionFilter("all");
              }}
            >
              Clear
            </Button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {logs.length} event{logs.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No audit events"
            description="Privileged changes will appear here as they happen."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
            <ul className="divide-y divide-border">
              {logs.map((log) => {
                const isOpen = expanded.has(log.id);
                return (
                  <li key={log.id}>
                    <button
                      type="button"
                      onClick={() => toggle(log.id)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-accent/30"
                    >
                      <span className="mt-1 text-muted-foreground">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </span>
                      <Avatar className="mt-0.5 h-7 w-7">
                        {log.actor_avatar && <AvatarImage src={log.actor_avatar} />}
                        <AvatarFallback className="text-[10px]">
                          {(log.actor_name ?? "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {log.actor_name ?? "System"}
                          </span>
                          <Badge
                            variant="secondary"
                            className={cn("rounded-full text-[10px]", actionTone(log.action))}
                          >
                            {log.action}
                          </Badge>
                          {log.entity_type && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {log.entity_type}
                              {log.entity_id ? `:${log.entity_id.slice(0, 8)}` : ""}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {fmtRelative(log.created_at)}
                          {log.ip ? ` • ${log.ip}` : ""}
                        </p>
                      </div>
                    </button>
                    {isOpen && log.diff && (
                      <div className="border-t border-border bg-muted/20 px-12 py-3">
                        <pre className="max-h-64 overflow-auto rounded-lg bg-background/60 p-3 text-[11px] leading-snug">
                          {JSON.stringify(log.diff, null, 2)}
                        </pre>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </PageBody>
    </>
  );
}
