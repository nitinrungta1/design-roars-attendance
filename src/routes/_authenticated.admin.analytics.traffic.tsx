import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { Card } from "@/components/ui/card";
import { seo } from "@/lib/seo";
import { fetchAnalyticsBundle, groupBy, CHART_COLORS, type RangeDays } from "@/lib/analytics-queries";

export const Route = createFileRoute("/_authenticated/admin/analytics/traffic")({
  head: () => seo({ title: "Traffic", description: "Visitor and session trends.", kind: "product", path: "/admin/analytics/traffic", noindex: true }),
  component: TrafficPage,
});

function TrafficPage() {
  const [days, setDays] = useState<RangeDays>(30);
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof fetchAnalyticsBundle>> | null>(null);

  useEffect(() => { setBundle(null); fetchAnalyticsBundle(days).then(setBundle); }, [days]);

  const stats = useMemo(() => {
    if (!bundle) return null;
    const { visitors, sessions } = bundle;

    // Daily series
    const dayMap: Record<string, { date: string; new_visitors: number; sessions: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(startOfDay(subDays(new Date(), i)), "MMM dd");
      dayMap[d] = { date: d, new_visitors: 0, sessions: 0 };
    }
    visitors.forEach((v) => {
      const d = format(startOfDay(new Date(v.first_seen)), "MMM dd");
      if (dayMap[d]) dayMap[d].new_visitors++;
    });
    sessions.forEach((s) => {
      const d = format(startOfDay(new Date(s.started_at)), "MMM dd");
      if (dayMap[d]) dayMap[d].sessions++;
    });

    // New vs returning (visitor with >1 sessions = returning)
    const returning = visitors.filter((v) => (v.total_sessions ?? 0) > 1).length;
    const newVisitors = visitors.length - returning;

    // Page-depth distribution
    const depthBuckets: Record<string, number> = { "1": 0, "2": 0, "3-5": 0, "6-10": 0, "10+": 0 };
    sessions.forEach((s) => {
      const c = s.page_count ?? 1;
      if (c <= 1) depthBuckets["1"]++;
      else if (c === 2) depthBuckets["2"]++;
      else if (c <= 5) depthBuckets["3-5"]++;
      else if (c <= 10) depthBuckets["6-10"]++;
      else depthBuckets["10+"]++;
    });
    const depthData = Object.entries(depthBuckets).map(([name, value]) => ({ name, value }));

    const byBrowser = groupBy(sessions, "browser", "unknown");
    const byOs = groupBy(sessions, "os", "unknown");
    const byCountry = groupBy(sessions.filter((s) => s.country), "country").slice(0, 10);

    return {
      series: Object.values(dayMap),
      newReturning: [
        { name: "New", value: newVisitors },
        { name: "Returning", value: returning },
      ],
      depthData, byBrowser, byOs, byCountry,
    };
  }, [bundle, days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Range:</span>
        {([7, 30, 90] as RangeDays[]).map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`rounded-md border px-2.5 py-1 text-xs ${days === d ? "border-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>{d} days</button>
        ))}
      </div>
      {!stats ? <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <>
          <Card className="p-4">
            <div className="mb-2 text-sm font-medium">Daily visitors & sessions</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Line type="monotone" dataKey="new_visitors" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sessions" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <div className="mb-2 text-sm font-medium">New vs returning visitors</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.newReturning}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill={CHART_COLORS[0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4">
              <div className="mb-2 text-sm font-medium">Pages per session</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.depthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill={CHART_COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4">
              <div className="mb-2 text-sm font-medium">Browser</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.byBrowser}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill={CHART_COLORS[3]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4">
              <div className="mb-2 text-sm font-medium">OS</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.byOs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill={CHART_COLORS[4]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-4">
            <div className="mb-2 text-sm font-medium">Top countries</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.byCountry} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill={CHART_COLORS[2]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}
