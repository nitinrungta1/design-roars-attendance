import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  LifeBuoy,
  Receipt,
  UserPlus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { getSaasOverview } from "@/lib/admin-overview.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: SaasOverview,
  errorComponent: ({ error, reset }) => {
    if (typeof console !== "undefined") console.error("[admin/index] errorComponent", error);
    return (
      <div className="m-6 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold text-destructive">SaaS Overview failed to load</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error?.message ?? "An unexpected error occurred."}
        </p>
        <button
          onClick={() => reset()}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="m-6 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
      Page not found.
    </div>
  ),
});

type Counts = Awaited<ReturnType<typeof getSaasOverview>>["counts"];
type Overview = Awaited<ReturnType<typeof getSaasOverview>>;

interface KpiSpec {
  key: keyof Counts;
  label: string;
  icon: LucideIcon;
  format?: (v: number) => string;
  hint?: string;
}

const KPIS: KpiSpec[] = [
  { key: "customers", label: "Total Companies", icon: Building2 },
  { key: "activeCompanies", label: "Active (paid)", icon: TrendingUp },
  {
    key: "newTrials7d",
    label: "New Trials (7d)",
    icon: UserPlus,
    hint: "From demo requests in the last 7 days.",
  },
  {
    key: "newSignups30d",
    label: "New Leads (30d)",
    icon: Sparkles,
    hint: "Public form submissions in the last 30 days.",
  },
  { key: "totalEmployees", label: "Employees Managed", icon: Users, hint: "Available after Workforce module ships." },
  { key: "todayCheckins", label: "Daily Check-ins", icon: Clock, hint: "Available after Attendance module ships." },
  { key: "openTickets", label: "Open Tickets", icon: LifeBuoy, hint: "Available after Support module ships." },
  { key: "pendingInvoices", label: "Pending Invoices", icon: Receipt, hint: "Available after Billing module ships." },
];

function KpiCard({ spec, value, loading }: { spec: KpiSpec; value: number | null; loading: boolean }) {
  const Icon = spec.icon;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {spec.label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : value == null ? (
          <p
            className="text-2xl font-bold text-muted-foreground/60"
            title={spec.hint ?? "No data yet"}
          >
            —
          </p>
        ) : (
          <p className="text-2xl font-bold tabular">{value.toLocaleString()}</p>
        )}
        {spec.hint && value == null && !loading && (
          <p className="mt-1 text-[11px] text-muted-foreground">{spec.hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SaasOverview() {
  const { profile, user, isSuperAdmin } = useAuth();
  const fn = useServerFn(getSaasOverview);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    fn({ data: undefined as never })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        console.error("getSaasOverview failed", err);
        if (!cancelled) {
          setData(null);
          setLoadError(err instanceof Error ? err.message : "Failed to load overview.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fn]);

  const fullName = typeof profile?.full_name === "string" ? profile.full_name : "";
  const emailLocal = typeof user?.email === "string" ? user.email.split("@")[0] : "";
  const name = fullName.split(" ")[0] || emailLocal || "there";

  return (
    <>
      <PageHeader
        eyebrow="SaaS Overview"
        title={`Welcome back, ${name}.`}
        description="The high-level pulse of your Punchly business — customers, growth, and operations at a glance."
        actions={
          isSuperAdmin && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Super Admin
            </Badge>
          )
        }
      />
      <PageBody className="space-y-6">
        {loadError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Couldn't load overview data: {loadError}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((spec) => (
            <KpiCard
              key={spec.key}
              spec={spec}
              value={data?.counts?.[spec.key] ?? null}
              loading={loading}
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Lead trend (last 30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.signupTrend ?? []}>
                      <defs>
                        <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="day"
                        tickFormatter={(d: string) => d.slice(5)}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="leads"
                        stroke="hsl(var(--chart-1))"
                        fill="url(#leadGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trial → Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
                <p className="text-5xl font-bold text-muted-foreground/60">—</p>
                <p className="text-sm text-muted-foreground">
                  Available once subscriptions go live (Batch 5).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent leads</CardTitle>
              <Badge variant="outline">{data?.recentLeads.length ?? 0}</Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (data?.recentLeads.length ?? 0) === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No leads yet. Marketing forms will populate this list.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data!.recentLeads.map((l) => (
                    <li key={l.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{l.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {l.email} {l.company ? `· ${l.company}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        {l.source && (
                          <Badge variant="outline" className="capitalize">
                            {l.source}
                          </Badge>
                        )}
                        <span className="mt-1 text-[11px] text-muted-foreground">
                          {new Date(l.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Activity log</CardTitle>
              <Badge variant="outline">{data?.recentAudit.length ?? 0}</Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (data?.recentAudit.length ?? 0) === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No activity yet. Admin actions across the platform will appear here.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data!.recentAudit.map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{a.action}</p>
                        {a.entity_type && (
                          <p className="truncate text-xs text-muted-foreground">{a.entity_type}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">What's next on the roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Batch 2", "Customers · Companies · CRM accounts", TrendingUp],
                ["Batch 3", "Workforce · Attendance · Timesheets", Clock],
                ["Batch 4", "Leads pipeline · Support desk", LifeBuoy],
                ["Batch 5", "Plans · Subscriptions · Invoices", CreditCard],
                ["Batch 6", "Website CMS · Blogs · Media", Building2],
                ["Batch 7", "Product analytics · Cohorts", TrendingDown],
              ].map(([batch, label, Icon]) => {
                const I = Icon as LucideIcon;
                return (
                  <li
                    key={batch as string}
                    className="flex items-start gap-2 rounded-lg border border-border bg-card/40 p-3"
                  >
                    <I className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {batch as string}
                      </p>
                      <p className="text-sm">{label as string}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
