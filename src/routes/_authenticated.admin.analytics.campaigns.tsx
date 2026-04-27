import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { seo } from "@/lib/seo";
import { fetchAnalyticsBundle, type RangeDays } from "@/lib/analytics-queries";

export const Route = createFileRoute("/_authenticated/admin/analytics/campaigns")({
  head: () => seo({ title: "Campaigns", description: "Per-campaign performance.", kind: "product", path: "/admin/analytics/campaigns", noindex: true }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const [days, setDays] = useState<RangeDays>(30);
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof fetchAnalyticsBundle>> | null>(null);
  const [sortKey, setSortKey] = useState<"sessions" | "leads" | "cr">("leads");
  useEffect(() => { setBundle(null); fetchAnalyticsBundle(days).then(setBundle); }, [days]);

  const rows = useMemo(() => {
    if (!bundle) return null;
    const { sessions, leads } = bundle;
    const map: Record<string, { campaign: string; source: string; sessions: number; leads: number }> = {};
    sessions.forEach((s) => {
      const lt = s.last_touch as Record<string, unknown> | null;
      const camp = (lt?.utm_campaign as string) || "(none)";
      const src = (lt?.utm_source as string) || "direct";
      const k = `${camp}::${src}`;
      if (!map[k]) map[k] = { campaign: camp, source: src, sessions: 0, leads: 0 };
      map[k].sessions++;
    });
    leads.forEach((l) => {
      const camp = l.utm_campaign || "(none)";
      const src = l.utm_source || "direct";
      const k = `${camp}::${src}`;
      if (!map[k]) map[k] = { campaign: camp, source: src, sessions: 0, leads: 0 };
      map[k].leads++;
    });
    return Object.values(map).map((r) => ({ ...r, cr: r.sessions > 0 ? (r.leads / r.sessions) * 100 : 0 }));
  }, [bundle]);

  const sorted = useMemo(() => {
    if (!rows) return null;
    return [...rows].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));
  }, [rows, sortKey]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Range:</span>
        {([7, 30, 90] as RangeDays[]).map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`rounded-md border px-2.5 py-1 text-xs ${days === d ? "border-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>{d} days</button>
        ))}
      </div>
      {!sorted ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <Card className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="text-left py-2">Campaign</th>
                  <th className="text-left">Source</th>
                  <th className="text-right cursor-pointer" onClick={() => setSortKey("sessions")}>Sessions {sortKey === "sessions" && "▾"}</th>
                  <th className="text-right cursor-pointer" onClick={() => setSortKey("leads")}>Leads {sortKey === "leads" && "▾"}</th>
                  <th className="text-right cursor-pointer" onClick={() => setSortKey("cr")}>CR% {sortKey === "cr" && "▾"}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No campaign data yet — UTMs in your URLs will populate this table.</td></tr>}
                {sorted.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-2 truncate max-w-[260px]">{r.campaign}</td>
                    <td className="truncate max-w-[180px]">{r.source}</td>
                    <td className="text-right">{r.sessions}</td>
                    <td className="text-right">{r.leads}</td>
                    <td className="text-right">{r.cr.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
