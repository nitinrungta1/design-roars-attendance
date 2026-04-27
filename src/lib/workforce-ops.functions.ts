import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// Productivity Analytics
// ============================================================

export interface ProductivitySummary {
  kpis: {
    avg_productive_hours: number;
    avg_idle_hours: number;
    productivity_score: number; // 0..100
    total_tasks: number;
    employees_tracked: number;
  };
  trend: Array<{ date: string; productive: number; idle: number; tasks: number }>;
  top_employees: Array<{
    employee_id: string;
    name: string;
    productive_hours: number;
    idle_hours: number;
    tasks: number;
    score: number;
  }>;
  by_department: Array<{ department: string; productive_hours: number; idle_hours: number }>;
}

const RangeSchema = z
  .object({ days: z.number().int().min(1).max(180).default(30) })
  .optional();

export const getProductivitySummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RangeSchema.parse(input ?? {}) ?? { days: 30 })
  .handler(async ({ context, data }): Promise<ProductivitySummary> => {
    const { supabase } = context;
    const days = data?.days ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    const sinceStr = since.toISOString().slice(0, 10);

    const [{ data: logs }, { data: emps }] = await Promise.all([
      supabase
        .from("productivity_logs")
        .select("employee_id, log_date, productive_minutes, idle_minutes, tasks_completed")
        .gte("log_date", sinceStr)
        .limit(20000),
      supabase
        .from("employees")
        .select("id, full_name, department_id, departments(name)")
        .limit(5000),
    ]);

    const empMap = new Map<
      string,
      { name: string; department: string }
    >();
    for (const e of emps ?? []) {
      empMap.set(e.id, {
        name: e.full_name,
        department: (e.departments as { name: string } | null)?.name ?? "Unassigned",
      });
    }

    const byDate = new Map<string, { productive: number; idle: number; tasks: number }>();
    const byEmp = new Map<
      string,
      { productive: number; idle: number; tasks: number }
    >();
    const byDept = new Map<string, { productive: number; idle: number }>();
    let totalProductive = 0;
    let totalIdle = 0;
    let totalTasks = 0;
    const empSet = new Set<string>();

    for (const l of logs ?? []) {
      const p = Number(l.productive_minutes) || 0;
      const i = Number(l.idle_minutes) || 0;
      const t = Number(l.tasks_completed) || 0;
      totalProductive += p;
      totalIdle += i;
      totalTasks += t;
      empSet.add(l.employee_id);

      const d = byDate.get(l.log_date) ?? { productive: 0, idle: 0, tasks: 0 };
      d.productive += p;
      d.idle += i;
      d.tasks += t;
      byDate.set(l.log_date, d);

      const eRow = byEmp.get(l.employee_id) ?? { productive: 0, idle: 0, tasks: 0 };
      eRow.productive += p;
      eRow.idle += i;
      eRow.tasks += t;
      byEmp.set(l.employee_id, eRow);

      const meta = empMap.get(l.employee_id);
      const deptName = meta?.department ?? "Unassigned";
      const dRow = byDept.get(deptName) ?? { productive: 0, idle: 0 };
      dRow.productive += p;
      dRow.idle += i;
      byDept.set(deptName, dRow);
    }

    // Build full date series
    const trend: ProductivitySummary["trend"] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const v = byDate.get(key);
      trend.push({
        date: key,
        productive: v ? +(v.productive / 60).toFixed(2) : 0,
        idle: v ? +(v.idle / 60).toFixed(2) : 0,
        tasks: v?.tasks ?? 0,
      });
    }

    const topEmployees = Array.from(byEmp.entries())
      .map(([id, v]) => {
        const total = v.productive + v.idle;
        const score = total > 0 ? Math.round((v.productive / total) * 100) : 0;
        return {
          employee_id: id,
          name: empMap.get(id)?.name ?? "—",
          productive_hours: +(v.productive / 60).toFixed(2),
          idle_hours: +(v.idle / 60).toFixed(2),
          tasks: v.tasks,
          score,
        };
      })
      .sort((a, b) => b.productive_hours - a.productive_hours)
      .slice(0, 20);

    const byDepartment = Array.from(byDept.entries())
      .map(([department, v]) => ({
        department,
        productive_hours: +(v.productive / 60).toFixed(2),
        idle_hours: +(v.idle / 60).toFixed(2),
      }))
      .sort((a, b) => b.productive_hours - a.productive_hours);

    const employeesTracked = empSet.size;
    const avgProductiveHours =
      employeesTracked > 0 ? +(totalProductive / 60 / employeesTracked).toFixed(2) : 0;
    const avgIdleHours =
      employeesTracked > 0 ? +(totalIdle / 60 / employeesTracked).toFixed(2) : 0;
    const overallTotal = totalProductive + totalIdle;
    const productivityScore =
      overallTotal > 0 ? Math.round((totalProductive / overallTotal) * 100) : 0;

    return {
      kpis: {
        avg_productive_hours: avgProductiveHours,
        avg_idle_hours: avgIdleHours,
        productivity_score: productivityScore,
        total_tasks: totalTasks,
        employees_tracked: employeesTracked,
      },
      trend,
      top_employees: topEmployees,
      by_department: byDepartment,
    };
  });

// ============================================================
// Assets
// ============================================================

export interface AssetRow {
  id: string;
  company_id: string;
  name: string;
  kind: string;
  status: string;
  serial_number: string | null;
  value: number | null;
  purchased_at: string | null;
  notes: string | null;
  assigned_to: { employee_id: string; name: string } | null;
}

export const listAssets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: AssetRow[] }> => {
    const { supabase } = context;
    const [{ data: assets }, { data: assignments }, { data: emps }] = await Promise.all([
      supabase
        .from("assets")
        .select(
          "id, company_id, name, kind, status, serial_number, value, purchased_at, notes",
        )
        .order("name", { ascending: true })
        .limit(2000),
      supabase
        .from("asset_assignments")
        .select("asset_id, employee_id, returned_at")
        .is("returned_at", null)
        .limit(5000),
      supabase.from("employees").select("id, full_name").limit(5000),
    ]);

    const empName = new Map<string, string>();
    for (const e of emps ?? []) empName.set(e.id, e.full_name);
    const assignmentByAsset = new Map<string, { employee_id: string; name: string }>();
    for (const a of assignments ?? []) {
      assignmentByAsset.set(a.asset_id, {
        employee_id: a.employee_id,
        name: empName.get(a.employee_id) ?? "—",
      });
    }

    return {
      rows: (assets ?? []).map((a) => ({
        id: a.id,
        company_id: a.company_id,
        name: a.name,
        kind: a.kind,
        status: a.status,
        serial_number: a.serial_number,
        value: a.value !== null ? Number(a.value) : null,
        purchased_at: a.purchased_at,
        notes: a.notes,
        assigned_to: assignmentByAsset.get(a.id) ?? null,
      })),
    };
  });

const AssetUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  kind: z.enum(["laptop", "phone", "sim", "id_card", "accessory", "other"]),
  status: z.enum(["available", "assigned", "lost", "retired", "in_repair"]),
  serial_number: z.string().trim().max(120).optional().or(z.literal("")),
  value: z.number().nonnegative().optional(),
  purchased_at: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const upsertAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AssetUpsertSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const payload = {
      company_id: data.company_id,
      name: data.name,
      kind: data.kind,
      status: data.status,
      serial_number: data.serial_number || null,
      value: data.value ?? null,
      purchased_at: data.purchased_at || null,
      notes: data.notes || null,
    };
    const { error } = data.id
      ? await supabase.from("assets").update(payload).eq("id", data.id)
      : await supabase.from("assets").insert(payload);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("assets").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const AssignAssetSchema = z.object({
  asset_id: z.string().uuid(),
  company_id: z.string().uuid(),
  employee_id: z.string().uuid(),
});

export const assignAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AssignAssetSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Close any active assignment first
    await supabase
      .from("asset_assignments")
      .update({ returned_at: new Date().toISOString() })
      .eq("asset_id", data.asset_id)
      .is("returned_at", null);

    const { error } = await supabase.from("asset_assignments").insert({
      asset_id: data.asset_id,
      company_id: data.company_id,
      employee_id: data.employee_id,
      assigned_by: userId,
    });
    if (error) return { ok: false as const, error: error.message };
    await supabase.from("assets").update({ status: "assigned" }).eq("id", data.asset_id);
    return { ok: true as const };
  });

export const returnAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ asset_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("asset_assignments")
      .update({ returned_at: new Date().toISOString() })
      .eq("asset_id", data.asset_id)
      .is("returned_at", null);
    if (error) return { ok: false as const, error: error.message };
    await supabase.from("assets").update({ status: "available" }).eq("id", data.asset_id);
    return { ok: true as const };
  });

// ============================================================
// Employee Documents (workforce-wide listing)
// ============================================================

export interface EmployeeDocumentRow {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name: string;
  doc_type: string;
  title: string;
  file_url: string | null;
  signed_at: string | null;
  expires_at: string | null;
  uploaded_at: string;
  notes: string | null;
}

export const listEmployeeDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: EmployeeDocumentRow[] }> => {
    const { supabase } = context;
    const [{ data: docs }, { data: emps }] = await Promise.all([
      supabase
        .from("employee_documents")
        .select(
          "id, company_id, employee_id, doc_type, title, file_url, signed_at, expires_at, created_at, notes",
        )
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase.from("employees").select("id, full_name").limit(5000),
    ]);
    const empName = new Map<string, string>();
    for (const e of emps ?? []) empName.set(e.id, e.full_name);
    return {
      rows: (docs ?? []).map((d) => ({
        id: d.id,
        company_id: d.company_id,
        employee_id: d.employee_id,
        employee_name: empName.get(d.employee_id) ?? "—",
        doc_type: d.doc_type,
        title: d.title,
        file_url: d.file_url,
        signed_at: d.signed_at,
        expires_at: d.expires_at,
        uploaded_at: d.created_at as string,
        notes: d.notes,
      })),
    };
  });

const DocUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  doc_type: z.enum([
    "offer_letter",
    "nda",
    "id_proof",
    "contract",
    "policy",
    "other",
  ]),
  title: z.string().trim().min(1).max(160),
  file_url: z.string().trim().url().optional().or(z.literal("")),
  signed_at: z.string().optional().or(z.literal("")),
  expires_at: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const upsertEmployeeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DocUpsertSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const payload = {
      company_id: data.company_id,
      employee_id: data.employee_id,
      doc_type: data.doc_type,
      title: data.title,
      file_url: data.file_url || null,
      signed_at: data.signed_at || null,
      expires_at: data.expires_at || null,
      notes: data.notes || null,
      uploaded_by: userId,
    };
    const { error } = data.id
      ? await supabase.from("employee_documents").update(payload).eq("id", data.id)
      : await supabase.from("employee_documents").insert(payload);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteEmployeeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("employee_documents")
      .delete()
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Announcements
// ============================================================

export interface AnnouncementRow {
  id: string;
  company_id: string;
  title: string;
  body: string | null;
  audience: string;
  audience_id: string | null;
  pinned: boolean;
  published_at: string | null;
  created_at: string;
  read_count: number;
}

export const listAnnouncements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: AnnouncementRow[] }> => {
    const { supabase } = context;
    const [{ data: rows }, { data: reads }] = await Promise.all([
      supabase
        .from("announcements")
        .select("id, company_id, title, body, audience, audience_id, pinned, published_at, created_at")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("announcement_reads").select("announcement_id").limit(20000),
    ]);
    const counts = new Map<string, number>();
    for (const r of reads ?? [])
      counts.set(r.announcement_id, (counts.get(r.announcement_id) ?? 0) + 1);
    return {
      rows: (rows ?? []).map((a) => ({
        id: a.id,
        company_id: a.company_id,
        title: a.title,
        body: a.body,
        audience: a.audience,
        audience_id: a.audience_id,
        pinned: a.pinned,
        published_at: a.published_at,
        created_at: a.created_at as string,
        read_count: counts.get(a.id) ?? 0,
      })),
    };
  });

const AnnouncementSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().max(8000).optional().or(z.literal("")),
  audience: z.enum(["all", "department", "team", "role"]).default("all"),
  audience_id: z.string().uuid().optional().or(z.literal("")),
  pinned: z.boolean().default(false),
  publish_now: z.boolean().default(true),
});

export const upsertAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnnouncementSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const payload = {
      company_id: data.company_id,
      title: data.title,
      body: data.body || null,
      audience: data.audience,
      audience_id: data.audience_id || null,
      pinned: data.pinned,
      published_at: data.publish_now ? new Date().toISOString() : null,
      created_by: userId,
    };
    const { error } = data.id
      ? await supabase.from("announcements").update(payload).eq("id", data.id)
      : await supabase.from("announcements").insert(payload);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("announcements")
      .delete()
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
