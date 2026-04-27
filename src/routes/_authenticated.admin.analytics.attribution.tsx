import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { seo } from "@/lib/seo";
import { fetchAnalyticsBundle, type RangeDays } from "@/lib/analytics-queries";

export const Route = createFileRoute("/_authenticated/admin/analytics/attribution")({
  head: () => seo({ title: "Attribution", description: "First-touch vs last-touch attribution.", kind: "product", path: "/admin/analytics/attribution", noindex: true }),
  component: AttributionPage,
});

function pickStr(o: Record<string, unknown> | null | undefined, key: string, fallback = "(none)") {
  const v = o?.[key];
  return typeof v === "string" && v.trim() ? v : fallback;
}

function AttributionPage() {
  const [days, setDays] = useState<RangeDays>(30);
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof fetchAnalyticsBundle>> | null>(null);
  useEffect(() => { setBundle(null); fetchAnalyticsBundle(days).then(setBundle); }, [days]);

  const stats = useMemo(() => {
    if (!bundle) return null;
    const { visitors, sessions, leads } = bundle;

    const tally = (key: string, source: "first" | "last") => {
      const m: Record<string, number> = {};
      const arr = source === "first" ? visitors : sessions;
      arr.forEach((row) => {
        const touch = (source === "first" ? (row as typeof visitors[number]).first_touch : (row as typeof sessions[number]).last_touch) as Record<string, unknown> | null;
        const v = pickStr(touch, key);
        m[v] = (m[v] || 0) + 1;
      });
      return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 12);
    };

    // Lead-attributed source/medium/campaign
    const leadSrc: Record<string, number> = {};
    leads.forEach((l) => {
      const k = `${l.utm_source || "direct"} / ${l.utm_medium || "(none)"}`;
      leadSrc[k] = (leadSrc[k] || 0) + 1;
    });
    const leadSrcRows = Object.entries(leadSrc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 15);

    return {
      firstSource: tally("utm_source", "first"),
      lastSource: tally("utm_source", "last"),
      firstMedium: tally("utm_medium", "first"),
      lastMedium: tally("utm_medium", "last"),
      leadSrcRows,
    };
  }, [bundle]);

  const Table = ({ title, rows }: { title: string; rows: { name: string; value: number }[] }) => (
    <Card className="p-4">
      <div className="mb-3 text-sm font-medium">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr><th className="text-left py-1">Value</th><th className="text-right">Count</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">No data yet</td></tr>}
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-border">
                <td className="py-2 truncate max-w-[280px]">{r.name}</td>
                <td className="text-right">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Range:</span>
        {([7, 30, 90] as RangeDays[]).map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`rounded-md border px-2.5 py-1 text-xs ${days === d ? "border-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>{d} days</button>
        ))}
      </div>
      {!stats ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <div className="grid gap-4 md:grid-cols-2">
          <Table title="First-touch source (visitors)" rows={stats.firstSource} />
          <Table title="Last-touch source (sessions)" rows={stats.lastSource} />
          <Table title="First-touch medium" rows={stats.firstMedium} />
          <Table title="Last-touch medium" rows={stats.lastMedium} />
          <div className="md:col-span-2">
            <Table title="Leads — source / medium" rows={stats.leadSrcRows} />
          </div>
        </div>
      )}
    </div>
  );
}
