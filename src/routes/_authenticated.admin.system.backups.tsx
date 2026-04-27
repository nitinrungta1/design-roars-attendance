import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HardDrive, Download, RefreshCw, Plus } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtRelative, StatCard } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { listBackups, requestBackup } from "@/lib/system.functions";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/system/backups")({
  head: () =>
    seo({
      title: "Backups | Admin",
      description: "Manual snapshots and downloads.",
      kind: "product",
      path: "/admin/system/backups",
      noindex: true,
    }),
  component: BackupsPage,
});

const STATUS_TONES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  running: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  failed: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

function fmtBytes(n: number) {
  if (n === 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

function BackupsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "backups"],
    queryFn: () => listBackups(),
    refetchInterval: 5000,
  });

  const request = useMutation({
    mutationFn: () => requestBackup(),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Backup queued");
        qc.invalidateQueries({ queryKey: ["admin", "backups"] });
      } else toast.error(res.error);
    },
  });

  const backups = data?.backups ?? [];
  const totals = {
    all: backups.length,
    completed: backups.filter((b) => b.status === "completed").length,
    pending: backups.filter((b) => b.status === "pending" || b.status === "running").length,
    bytes: backups.filter((b) => b.status === "completed").reduce((a, b) => a + b.size_bytes, 0),
  };

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Backups"
        description="Request on-demand snapshots and download recent exports."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Backups" }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => qc.invalidateQueries({ queryKey: ["admin", "backups"] })}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => request.mutate()} disabled={request.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Request snapshot
            </Button>
          </div>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Snapshots" value={totals.all} />
          <StatCard label="Completed" value={totals.completed} tone="success" />
          <StatCard label="In progress" value={totals.pending} tone="warning" />
          <StatCard label="Total size" value={fmtBytes(totals.bytes)} />
        </div>

        <DataTable
          headers={["Status", "Tables", "Rows", "Size", "Requested by", "Requested", "Download"]}
          empty={
            !isLoading && backups.length === 0 ? (
              <EmptyState
                icon={HardDrive}
                title="No backups yet"
                description="Click 'Request snapshot' to create your first export."
                action={
                  <Button size="sm" onClick={() => request.mutate()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Request snapshot
                  </Button>
                }
              />
            ) : null
          }
        >
          {backups.map((b) => (
            <Tr key={b.id}>
              <Td>
                <Badge
                  variant="secondary"
                  className={cn("rounded-full capitalize", STATUS_TONES[b.status] ?? "bg-muted")}
                >
                  {b.status}
                </Badge>
                {b.error && (
                  <p className="mt-1 max-w-xs truncate text-[10px] text-rose-500">{b.error}</p>
                )}
              </Td>
              <Td className="font-mono text-xs">{b.table_count || "—"}</Td>
              <Td className="font-mono text-xs">{b.row_count.toLocaleString()}</Td>
              <Td className="font-mono text-xs">{fmtBytes(b.size_bytes)}</Td>
              <Td className="text-muted-foreground">{b.requested_by_name ?? "—"}</Td>
              <Td className="text-muted-foreground text-xs">{fmtRelative(b.requested_at)}</Td>
              <Td>
                {b.download_url ? (
                  <Button size="sm" variant="outline" asChild>
                    <a href={b.download_url} target="_blank" rel="noreferrer">
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>
    </>
  );
}
