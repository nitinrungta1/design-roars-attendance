/**
 * Shared client-side analytics queries used by the admin dashboards.
 * All read directly via supabase (RLS = admin-only).
 */
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export type RangeDays = 7 | 30 | 90;

export type Visitor = {
  visitor_id: string;
  first_seen: string;
  total_sessions: number;
  total_leads: number;
  first_touch: Record<string, unknown> | null;
};
export type Session = {
  session_id: string;
  visitor_id: string;
  started_at: string;
  device: string | null;
  browser: string | null;
  os: string | null;
  landing_url: string | null;
  city: string | null;
  country: string | null;
  referrer: string | null;
  page_count: number;
  last_touch: Record<string, unknown> | null;
};
export type EventRow = {
  event_name: string;
  occurred_at: string;
  visitor_id: string | null;
  session_id: string | null;
  page_path: string | null;
  props: Record<string, unknown> | null;
};
export type Lead = {
  id: string;
  created_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  placement: string | null;
  creative_type: string | null;
  device: string | null;
  landing_url: string | null;
  referrer: string | null;
};

export async function fetchAnalyticsBundle(days: RangeDays) {
  const since = subDays(new Date(), days).toISOString();
  const [v, s, e, l] = await Promise.all([
    supabase
      .from("analytics_visitors")
      .select("visitor_id, first_seen, total_sessions, total_leads, first_touch")
      .gte("first_seen", since)
      .limit(5000),
    supabase
      .from("analytics_sessions")
      .select("session_id, visitor_id, started_at, device, browser, os, landing_url, city, country, referrer, page_count, last_touch")
      .gte("started_at", since)
      .limit(5000),
    supabase
      .from("analytics_events")
      .select("event_name, occurred_at, visitor_id, session_id, page_path, props")
      .gte("occurred_at", since)
      .limit(20000),
    supabase
      .from("leads")
      .select("id, created_at, utm_source, utm_medium, utm_campaign, utm_content, placement, creative_type, device, landing_url, referrer")
      .gte("created_at", since)
      .limit(2000),
  ]);
  return {
    visitors: ((v.data ?? []) as unknown) as Visitor[],
    sessions: ((s.data ?? []) as unknown) as Session[],
    events: ((e.data ?? []) as unknown) as EventRow[],
    leads: ((l.data ?? []) as unknown) as Lead[],
  };
}

export function groupBy<T extends Record<string, unknown>>(
  arr: T[],
  key: keyof T,
  fallback = "(unknown)"
) {
  const m: Record<string, number> = {};
  arr.forEach((row) => {
    const v = (row[key] as string | null) || fallback;
    m[v] = (m[v] || 0) + 1;
  });
  return Object.entries(m)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export const CHART_COLORS = [
  "hsl(var(--primary))",
  "#7C3AED",
  "#06B6D4",
  "#10B981",
  "#EF4444",
  "#F59E0B",
  "#3B82F6",
  "#EC4899",
];
