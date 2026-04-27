import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Loader2, Users, MousePointerClick, Sparkles, TrendingUp, MessageCircle, Phone, Globe, Target } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { Card } from "@/components/ui/card";
import { seo } from "@/lib/seo";
import { fetchAnalyticsBundle, groupBy, CHART_COLORS, type RangeDays } from "@/lib/analytics-queries";

export const Route = createFileRoute("/_authenticated/admin/analytics/")({
  head: () => seo({
    title: "Analytics Dashboard",
    description: "First-party traffic analytics overview.",
    kind: "product",
    path: "/admin/analytics",
    noindex: true,
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [days, setDays] = useState<RangeDays>(30);
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof fetchAnalyticsBundle>> | null>(null);

  useEffect(() => {
    setBundle(null);
    fetchAnalyticsBundle(days).then(setBundle);
  }, [days]);

  const stats = useMemo(() => {
    if (!bundle) return null;
    const { visitors, sessions, events, leads } = bundle;
    const totalVisitors = visitors.length;
    const totalSessions = sessions.length;
    const totalLeads = leads.length;
    const totalPageviews = events.filter((e) => e.event_name === "page_view").length;
    const conversionRate = totalSessions > 0 ? (totalLeads / totalSessions) * 100 : 0;
    const wa = events.filter((e) => e.event_name === "whatsapp_click").length;
    const phone = events.filter((e) => e.event_name === "phone_click").length;

    const dayMap: Record<string, { date: string; visitors: number; leads: number; pageviews: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(startOfDay(subDays(new Date(), i)), "MMM dd");
      dayMap[d] = { date: d, visitors: 0, leads: 0, pageviews: 0 };
    }
    visitors.forEach((v) => {
      const d = format(startOfDay(new Date(v.first_seen)), "MMM dd");
      if (dayMap[d]) dayMap[d].visitors++;
    });
    leads.forEach((l) => {
      const d = format(startOfDay(new Date(l.created_at)), "MMM dd");
      if (dayMap[d]) dayMap[d].leads++;
    });
    events.filter((e) => e.event_name === "page_view").forEach((e) => {
      const d = format(startOfDay(new Date(e.occurred_at)), "MMM dd");
      if (dayMap[d]) dayMap[d].pageviews++;
    });
    const series = Object.values(dayMap);

    const bySource = groupBy(leads, "utm_source", "direct").slice(0, 8);
    const byPlacement = groupBy(leads, "placement", "unknown").slice(0, 7);
    const byCreative = groupBy(leads, "creative_type", "unknown").slice(0, 6);
    const byDevice = groupBy(sessions, "device", "unknown");
    const byCity = groupBy(sessions.filter((s) => s.city), "city").slice(0, 10);

    const lpMap: Record<string, { page: string; sessions: number; leads: number }> = {};
    sessions.forEach((s) => {
      const url = s.landing_url || "(unknown)";
      let p = url;
      try { p = url === "(unknown)" ? url : new URL(url).pathname; } catch { /* keep */ }
      if (!lpMap[p]) lpMap[p] = { page: p, sessions: 0, leads: 0 };
      lpMap[p].sessions++;
    });
    leads.forEach((l) => {
      if (!l.landing_url) return;
      try {
        const p = new URL(l.landing_url).pathname;
        if (lpMap[p]) lpMap[p].leads++;
      } catch { /* ignore */ }
    });
    const topPages = Object.values(lpMap).sort((a, b) => b.sessions - a.sessions).slice(0, 10);

    const campMap: Record<string, { name: string; leads: number }> = {};
    leads.forEach((l) => {
      const c = l.utm_campaign || "(none)";
      if (!campMap[c]) campMap[c] = { name: c, leads: 0 };
      campMap[c].leads++;
    });
    const topCampaigns = Object.values(campMap).sort((a, b) => b.leads - a.leads).slice(0, 8);

    const topSource = bySource[0]?.name || "—";
    const bestCampaign = topCampaigns[0]?.name || "—";

    const engaged = events.filter((e) => e.event_name === "form_open" || e.event_name === "scroll_depth").length;
    const funnel = [
      { name: "Visitors", value: totalVisitors },
      { name: "Sessions", value: totalSessions },
      { name: "Engaged", value: engaged },
      { name: "Leads", value: totalLeads },
    ];

    const insights: string[] = [];
    if (byCreative.length >= 2 && byCreative[0].value > byCreative[1].value * 1.3) {
      insights.push(`${byCreative[0].name} creatives are converting ${Math.round((byCreative[0].value / Math.max(byCreative[1].value, 1)) * 100 - 100)}% better than ${byCreative[1].name}.`);
    }
    if (byCity[0]) insights.push(`${byCity[0].name} is your top traffic city this period (${byCity[0].value} sessions).`);
    if (topSource !== "—") insights.push(`Top traffic source: ${topSource} — drove ${bySource[0]?.value || 0} leads.`);

    return { totalVisitors, totalSessions, totalLeads, totalPageviews, conversionRate, wa, phone, topSource, bestCampaign, series, bySource, byPlacement, byCreative, byDevice, byCity, topPages, funnel, insights };
  }, [bundle, days]);

  const KPI = ({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string | number; sub?: string }) => (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
      <div className="mt-2 font-display text-2xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground truncate">{sub}</div>}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Range:</span>
        {([7, 30, 90] as RangeDays[]).map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-md border px-2.5 py-1 text-xs ${days === d ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {d} days
          </button>
        ))}
      </div>

      {!stats ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {stats.insights.length > 0 && (
            <Card className="border-primary/30 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary"><Sparkles className="h-4 w-4" />Smart Insights (last {days} days)</div>
              <ul className="space-y-1 text-sm">{stats.insights.map((i, idx) => <li key={idx}>• {i}</li>)}</ul>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KPI icon={Users} label="Visitors" value={stats.totalVisitors.toLocaleString()} sub={`${stats.totalPageviews.toLocaleString()} pageviews`} />
            <KPI icon={MousePointerClick} label="Sessions" value={stats.totalSessions.toLocaleString()} />
            <KPI icon={Sparkles} label="Leads" value={stats.totalLeads.toLocaleString()} />
            <KPI icon={TrendingUp} label="Conversion" value={`${stats.conversionRate.toFixed(2)}%`} />
            <KPI icon={Globe} label="Top Source" value={stats.topSource} />
            <KPI icon={Target} label="Best Campaign" value={stats.bestCampaign} />
            <KPI icon={MessageCircle} label="WhatsApp clicks" value={stats.wa.toLocaleString()} />
            <KPI icon={Phone} label="Phone clicks" value={stats.phone.toLocaleString()} />
          </div>

          <Card className="p-4">
            <div className="mb-2 text-sm font-medium">Daily traffic & leads</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Line type="monotone" dataKey="visitors" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pageviews" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="leads" stroke={CHART_COLORS[3]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <div className="mb-2 text-sm font-medium">Leads by source</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.bySource}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill={CHART_COLORS[0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4">
              <div className="mb-2 text-sm font-medium">Leads by placement</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={stats.byPlacement} dataKey="value" nameKey="name" outerRadius={90} label>
                    {stats.byPlacement.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4">
              <div className="mb-2 text-sm font-medium">Creative type</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={stats.byCreative} dataKey="value" nameKey="name" outerRadius={90} label>
                    {stats.byCreative.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4">
              <div className="mb-2 text-sm font-medium">Device split</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.byDevice}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill={CHART_COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <div className="mb-3 text-sm font-medium">Top landing pages</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr><th className="text-left py-1">Page</th><th className="text-right">Sessions</th><th className="text-right">Leads</th><th className="text-right">CR%</th></tr>
                  </thead>
                  <tbody>
                    {stats.topPages.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No data yet</td></tr>}
                    {stats.topPages.map((p) => (
                      <tr key={p.page} className="border-t border-border">
                        <td className="py-2 truncate max-w-[200px]">{p.page}</td>
                        <td className="text-right">{p.sessions}</td>
                        <td className="text-right">{p.leads}</td>
                        <td className="text-right">{p.sessions > 0 ? ((p.leads / p.sessions) * 100).toFixed(1) : "0"}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card className="p-4">
              <div className="mb-3 text-sm font-medium">Top cities</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.byCity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill={CHART_COLORS[2]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-4">
            <div className="mb-2 text-sm font-medium">Funnel</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill={CHART_COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}
