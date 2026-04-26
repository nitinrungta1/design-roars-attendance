import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { PlanBadge, StatCard } from "@/components/admin/data-shell";
import { listPlanRollup } from "@/lib/customers.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/customers/plans")({
  head: () =>
    seo({
      title: "Customer Plans | Admin",
      description: "Distribution of customers across plan tiers.",
      kind: "product",
      path: "/admin/customers/plans",
      noindex: true,
    }),
  component: CustomerPlansPage,
});

const PLAN_DESCRIPTIONS: Record<string, string> = {
  free: "Trial workspaces and pilots.",
  starter: "Small teams getting started.",
  growth: "Scaling teams with shifts and timesheets.",
  business: "Multi-site businesses with payroll integrations.",
  enterprise: "Custom contracts, SSO, dedicated support.",
};

function CustomerPlansPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "plan-rollup"],
    queryFn: () => listPlanRollup(),
  });

  const plans = data?.plans ?? [];
  const totalCompanies = plans.reduce((a, p) => a + p.companies, 0);
  const totalMembers = plans.reduce((a, p) => a + p.members, 0);

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Plan distribution"
        description="How tenants are spread across pricing tiers."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Plans" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard label="Total tenants" value={totalCompanies} />
          <StatCard label="Total members" value={totalMembers} />
        </div>

        {!isLoading && plans.length === 0 ? (
          <EmptyState icon={Tag} title="No plan data yet" />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.plan}
                className="rounded-2xl border border-border bg-card/40 p-5"
              >
                <div className="flex items-center justify-between">
                  <PlanBadge plan={p.plan} />
                  <span className="text-xs text-muted-foreground">
                    {totalCompanies > 0
                      ? `${Math.round((p.companies / totalCompanies) * 100)}%`
                      : "0%"}
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold">{p.companies}</p>
                <p className="text-xs text-muted-foreground">tenants</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {PLAN_DESCRIPTIONS[p.plan] ?? "—"}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-semibold">{p.members}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
