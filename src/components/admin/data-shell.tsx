import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "danger"
          ? "text-rose-600 dark:text-rose-400"
          : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-2 text-2xl font-bold tracking-tight", toneClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function DataTable({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: ReactNode;
  empty?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
      {empty}
    </div>
  );
}

export function Td({
  children,
  className,
  mono,
}: {
  children: ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-sm",
        mono && "font-mono text-xs",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("hover:bg-accent/30", className)}>{children}</tr>;
}

const PLAN_TONES: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  growth: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  business: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  enterprise:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export function PlanBadge({ plan }: { plan: string }) {
  const tone = PLAN_TONES[plan] ?? PLAN_TONES.free;
  return (
    <Badge variant="secondary" className={cn("rounded-full", tone)}>
      {plan}
    </Badge>
  );
}

const STATUS_TONES: Record<string, string> = {
  new: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  contacted: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  demo_booked: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  trial: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  negotiation: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  won: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  lost: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? "bg-muted text-muted-foreground";
  const label = status.replace(/_/g, " ");
  return (
    <Badge variant="secondary" className={cn("rounded-full capitalize", tone)}>
      {label}
    </Badge>
  );
}

export function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export function fmtRelative(iso: string) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = now - t;
  const min = 60_000;
  if (diff < min) return "just now";
  if (diff < 60 * min) return `${Math.floor(diff / min)}m ago`;
  if (diff < 24 * 60 * min) return `${Math.floor(diff / (60 * min))}h ago`;
  if (diff < 7 * 24 * 60 * min) return `${Math.floor(diff / (24 * 60 * min))}d ago`;
  return fmtDate(iso);
}
