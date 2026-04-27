import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { seo } from "@/lib/seo";
import { fetchAnalyticsBundle, CHART_COLORS, type RangeDays } from "@/lib/analytics-queries";

export const Route = createFileRoute("/_authenticated/admin/analytics/funnel")({
  head: () => seo({ title: "Funnel", description: "Visitors → Leads conversion funnel.", kind: "product", path: "/admin/analytics/funnel", noindex: true }),
  component: FunnelPage,
});

function FunnelPage() {
  const [days, setDays] = useState<RangeDays>(30);
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof fetchAnalyticsBundle>> | null>(null);
  useEffect(() => { setBundle(null); fetchAnalyticsBundle(days).then(setBundle); }, [days]);

  const funnel = useMemo(() => {
    if (!bundle) return null;
    const { visitors, sessions, events, leads } = bundle;
    const visitorsN = visitors.length;
    const sessionsN = sessions.length;
    const scrolled = new Set(events.filter((e) => e.event_name === "scroll_depth").map((e) => e.session_id)).size;
    const formOpens = new Set(events.filter((e) => e.event_name === "form_open").map((e) => e.session_id)).size;
    const submits = new Set(events.filter((e) => e.event_name === "form_submit").map((e) => e.session_id)).size;
    const leadsN = leads.length;
    const steps = [
      { name: "Visitors", value: visitorsN },
      { name: "Sessions", value: sessionsN },
      { name: "Scrolled", value: scrolled },
      { name: "Form Open", value: formOpens },
      { name: "Form Submit", value: submits },
      { name: "Leads", value: leadsN },
    ];
    const withDrop = steps.map((s, i) => {
      const prev = i === 0 ? s.value : steps[i - 1].value;
      const drop = prev > 0 ? Math.round(((prev - s.value) / prev) * 100) : 0;
      const ofTop = visitorsN > 0 ? ((s.value / visitorsN) * 100).toFixed(1) : "0";
      return { ...s, drop, ofTop };
    });
    return withDrop;
  }, [bundle]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Range:</span>
        {([7, 30, 90] as RangeDays[]).map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`rounded-md border px-2.5 py-1 text-xs ${days === d ? "border-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>{d} days</button>
        ))}
      </div>
      {!funnel ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <>
          <Card className="p-4">
            <div className="mb-2 text-sm font-medium">Funnel</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={110} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill={CHART_COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr><th className="text-left py-2">Step</th><th className="text-right">Count</th><th className="text-right">% of visitors</th><th className="text-right">Drop-off</th></tr>
                </thead>
                <tbody>
                  {funnel.map((s) => (
                    <tr key={s.name} className="border-t border-border">
                      <td className="py-2">{s.name}</td>
                      <td className="text-right">{s.value.toLocaleString()}</td>
                      <td className="text-right">{s.ofTop}%</td>
                      <td className="text-right text-muted-foreground">{s.drop > 0 ? `−${s.drop}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
