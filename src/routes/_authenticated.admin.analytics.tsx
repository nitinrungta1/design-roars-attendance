import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, TrendingUp, Filter, Megaphone, GitBranch, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => seo({
    title: "Marketing Analytics",
    description: "First-party traffic analytics, attribution, and conversion tracking.",
    kind: "product",
    path: "/admin/analytics",
    noindex: true,
  }),
  component: AnalyticsLayout,
});

const TABS = [
  { to: "/admin/analytics", label: "Dashboard", icon: BarChart3, exact: true },
  { to: "/admin/analytics/traffic", label: "Traffic", icon: TrendingUp },
  { to: "/admin/analytics/attribution", label: "Attribution", icon: Filter },
  { to: "/admin/analytics/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/admin/analytics/funnel", label: "Funnel", icon: GitBranch },
  { to: "/admin/analytics/settings", label: "Tracking Settings", icon: SettingsIcon },
] as const;

function AnalyticsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Marketing Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See where every visitor comes from — UTMs, ad clicks, referrers, devices, and conversion to leads.
        </p>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = "exact" in t && t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
