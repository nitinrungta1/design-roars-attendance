import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface Counts {
  customers: number | null;
  activeCompanies: number | null;
  newTrials7d: number | null;
  newSignups30d: number | null;
  totalEmployees: number | null;
  todayCheckins: number | null;
  openTickets: number | null;
  pendingInvoices: number | null;
  unreadNotifications: number | null;
  recentSignups7d: number | null;
}

interface SignupPoint {
  day: string;
  signups: number;
  leads: number;
}

interface OverviewPayload {
  counts: Counts;
  signupTrend: SignupPoint[];
  recentLeads: Array<{
    id: string;
    name: string;
    email: string;
    company: string | null;
    source: string | null;
    created_at: string;
  }>;
  recentAudit: Array<{
    id: string;
    action: string;
    entity_type: string | null;
    actor_id: string | null;
    created_at: string;
  }>;
}

const ZERO_OR_NULL = (n: number | null | undefined): number | null =>
  typeof n === "number" ? n : null;

export const getSaasOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OverviewPayload> => {
    const { supabase } = context;
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    async function safe<T>(label: string, p: PromiseLike<T>, fallback: T): Promise<T> {
      try {
        const res = await p;
        // supabase responses include { error }
        const maybe = res as unknown as { error?: { message?: string } | null };
        if (maybe && maybe.error) {
          console.error(`[saas-overview] ${label}`, maybe.error);
        }
        return res;
      } catch (err) {
        console.error(`[saas-overview] ${label} threw`, err);
        return fallback;
      }
    }

    const emptyCount = { count: null as number | null, error: null, data: null } as never;
    const emptyList = { data: [] as never[], error: null } as never;

    const [
      companies,
      activeCompanies,
      leads30d,
      demos7d,
      auditRecent,
      recentLeads,
    ] = await Promise.all([
      safe("companies", supabase.from("companies").select("id", { count: "exact", head: true }), emptyCount),
      safe(
        "activeCompanies",
        supabase
          .from("companies")
          .select("id", { count: "exact", head: true })
          .neq("plan", "free"),
        emptyCount,
      ),
      safe(
        "leads30d",
        supabase.from("leads").select("id, created_at, source").gte("created_at", since30),
        emptyList,
      ),
      safe(
        "demos7d",
        supabase
          .from("demo_requests")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since7),
        emptyCount,
      ),
      safe(
        "auditRecent",
        supabase
          .from("audit_logs")
          .select("id, action, entity_type, actor_id, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        emptyList,
      ),
      safe(
        "recentLeads",
        supabase
          .from("leads")
          .select("id, name, email, company, source, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        emptyList,
      ),
    ]);

    // Build daily signup trend (leads as proxy for signups until subscriptions ship)
    const dayBuckets = new Map<string, { signups: number; leads: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayBuckets.set(key, { signups: 0, leads: 0 });
    }
    for (const l of leads30d.data ?? []) {
      const key = (l.created_at as string).slice(0, 10);
      const bucket = dayBuckets.get(key);
      if (bucket) bucket.leads += 1;
    }
    const signupTrend: SignupPoint[] = Array.from(dayBuckets.entries()).map(([day, v]) => ({
      day,
      signups: v.signups,
      leads: v.leads,
    }));

    return {
      counts: {
        customers: ZERO_OR_NULL(companies.count),
        activeCompanies: ZERO_OR_NULL(activeCompanies.count),
        newTrials7d: ZERO_OR_NULL(demos7d.count),
        newSignups30d: leads30d.data?.length ?? null,
        totalEmployees: null,
        todayCheckins: null,
        openTickets: null,
        pendingInvoices: null,
        unreadNotifications: null,
        recentSignups7d: leads30d.data
          ? leads30d.data.filter((l) => (l.created_at as string) >= since7).length
          : null,
      },
      signupTrend,
      recentLeads: (recentLeads.data ?? []).map((l) => ({
        id: l.id,
        name: l.name,
        email: l.email,
        company: l.company,
        source: l.source,
        created_at: l.created_at as string,
      })),
      recentAudit: (auditRecent.data ?? []).map((a) => ({
        id: a.id,
        action: a.action,
        entity_type: a.entity_type,
        actor_id: a.actor_id,
        created_at: a.created_at as string,
      })),
    };
  });
