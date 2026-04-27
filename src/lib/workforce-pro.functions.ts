import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// Workforce Dashboard
// ============================================================

export interface WorkforceDashboardData {
  kpis: {
    total_employees: number;
    present_today: number;
    late_today: number;
    on_leave_today: number;
    remote_today: number;
    shift_coverage_pct: number;
    pending_timesheets: number;
    overtime_hours: number;
    new_joiners_30d: number;
    attrition_alerts: number;
  };
  attendance_trend: Array<{ date: string; present: number; late: number; absent: number }>;
  department_headcount: Array<{ department: string; count: number }>;
  shift_utilization: Array<{ shift: string; assigned: number; capacity: number }>;
  overtime_series: Array<{ date: string; hours: number }>;
}

export const getWorkforceDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WorkforceDashboardData> => {
    const { supabase } = context;
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 13);
    const weekAgoStr = weekAgo.toISOString().slice(0, 10);
    const month30 = new Date();
    month30.setDate(month30.getDate() - 30);
    const month30Str = month30.toISOString().slice(0, 10);

    const [
      employees,
      attendanceWindow,
      attendanceToday,
      leaveToday,
      remoteToday,
      timesheetsPending,
      overtimeWindow,
      shifts,
      shiftAssignments,
      newJoiners,
    ] = await Promise.all([
      supabase
        .from("employees")
        .select("id, status, hire_date, exit_date, department_id, departments(name)")
        .limit(2000),
      supabase
        .from("attendance_logs")
        .select("log_date, status, is_late")
        .gte("log_date", weekAgoStr)
        .limit(5000),
      supabase
        .from("attendance_logs")
        .select("status, is_late")
        .eq("log_date", today)
        .limit(2000),
      supabase
        .from("leave_requests")
        .select("id")
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today)
        .limit(2000),
      supabase
        .from("remote_work_requests")
        .select("id")
        .eq("status", "approved")
        .lte("request_date", today)
        .or(`end_date.gte.${today},end_date.is.null`)
        .limit(2000),
      supabase
        .from("timesheets")
        .select("id")
        .eq("status", "submitted")
        .limit(2000),
      supabase
        .from("overtime_requests")
        .select("hours, request_date")
        .eq("status", "approved")
        .gte("request_date", weekAgoStr)
        .limit(2000),
      supabase.from("shifts").select("id, name").limit(200),
      supabase
        .from("shift_assignments")
        .select("shift_id, starts_on, ends_on")
        .lte("starts_on", today)
        .or(`ends_on.gte.${today},ends_on.is.null`)
        .limit(5000),
      supabase
        .from("employees")
        .select("id")
        .gte("hire_date", month30Str)
        .limit(2000),
    ]);

    const empRows = employees.data ?? [];
    const todayRows = attendanceToday.data ?? [];
    const winRows = attendanceWindow.data ?? [];

    // attendance trend (14d)
    const trendMap = new Map<string, { present: number; late: number; absent: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, { present: 0, late: 0, absent: 0 });
    }
    for (const r of winRows) {
      const slot = trendMap.get(r.log_date as string);
      if (!slot) continue;
      if (r.status === "absent") slot.absent++;
      else if (r.is_late) slot.late++;
      else if (r.status === "present" || r.status === "half_day") slot.present++;
    }
    const attendance_trend = Array.from(trendMap.entries()).map(([date, v]) => ({
      date,
      ...v,
    }));

    // department headcount
    const deptMap = new Map<string, number>();
    for (const e of empRows) {
      if (e.status !== "active") continue;
      const dept = (e.departments as { name: string } | null)?.name ?? "Unassigned";
      deptMap.set(dept, (deptMap.get(dept) ?? 0) + 1);
    }
    const department_headcount = Array.from(deptMap.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // shift utilization (capacity tracked at company level — assigned only for v1)
    const utilMap = new Map<string, { name: string; assigned: number }>();
    for (const s of shifts.data ?? []) {
      utilMap.set(s.id, { name: s.name, assigned: 0 });
    }
    for (const a of shiftAssignments.data ?? []) {
      const slot = utilMap.get(a.shift_id as string);
      if (slot) slot.assigned++;
    }
    const shift_utilization = Array.from(utilMap.values()).map((s) => ({
      shift: s.name,
      assigned: s.assigned,
      capacity: 0,
    }));

    // overtime series
    const otMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      otMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const o of overtimeWindow.data ?? []) {
      const key = o.request_date as string;
      otMap.set(key, (otMap.get(key) ?? 0) + Number(o.hours ?? 0));
    }
    const overtime_series = Array.from(otMap.entries()).map(([date, hours]) => ({
      date,
      hours: Number(hours.toFixed(1)),
    }));

    const totalEmp = empRows.filter((e) => e.status === "active").length;
    const presentToday = todayRows.filter(
      (r) => r.status === "present" || r.status === "half_day",
    ).length;
    const lateToday = todayRows.filter((r) => r.is_late).length;
    const onLeaveToday = leaveToday.data?.length ?? 0;
    const remoteCount = remoteToday.data?.length ?? 0;
    const totalAssigned = shiftAssignments.data?.length ?? 0;
    // Coverage = active assignments / active employees (proxy until per-shift capacity is added)
    const coverage = totalEmp > 0
      ? Math.min(100, Math.round((totalAssigned / totalEmp) * 100))
      : 0;
    const otHoursWeek = (overtimeWindow.data ?? []).reduce(
      (s, o) => s + Number(o.hours ?? 0),
      0,
    );
    const attritionAlerts = empRows.filter(
      (e) => e.exit_date && new Date(e.exit_date as string).getTime() > Date.now(),
    ).length;

    return {
      kpis: {
        total_employees: totalEmp,
        present_today: presentToday,
        late_today: lateToday,
        on_leave_today: onLeaveToday,
        remote_today: remoteCount,
        shift_coverage_pct: coverage,
        pending_timesheets: timesheetsPending.data?.length ?? 0,
        overtime_hours: Number(otHoursWeek.toFixed(1)),
        new_joiners_30d: newJoiners.data?.length ?? 0,
        attrition_alerts: attritionAlerts,
      },
      attendance_trend,
      department_headcount,
      shift_utilization,
      overtime_series,
    };
  });

// ============================================================
// Directory
// ============================================================

export interface DirectoryRow {
  id: string;
  company_id: string;
  employee_code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department_id: string | null;
  department_name: string | null;
  designation_name: string | null;
  manager_id: string | null;
  manager_name: string | null;
  location_name: string | null;
  employment_type: string;
  status: string;
  hire_date: string | null;
}

export const listDirectory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    return z
      .object({
        search: z.string().optional(),
        department_id: z.string().uuid().optional(),
        status: z.string().optional(),
      })
      .optional()
      .parse(input ?? {});
  })
  .handler(async ({ context, data }): Promise<{ rows: DirectoryRow[] }> => {
    const { supabase } = context;
    let q = supabase
      .from("employees")
      .select(
        "id, company_id, employee_code, full_name, email, phone, employment_type, hire_date, status, department_id, manager_id, departments(name), designations(name), work_locations:default_location_id(name)",
      )
      .order("full_name", { ascending: true })
      .limit(1000);
    if (data?.search) {
      q = q.or(
        `full_name.ilike.%${data.search}%,employee_code.ilike.%${data.search}%,email.ilike.%${data.search}%`,
      );
    }
    if (data?.department_id) q = q.eq("department_id", data.department_id);
    if (data?.status) q = q.eq("status", data.status);

    const { data: rows, error } = await q;
    if (error) {
      console.error("listDirectory", error);
      return { rows: [] };
    }

    // Resolve manager names in a second pass
    const managerIds = Array.from(
      new Set((rows ?? []).map((r) => r.manager_id).filter(Boolean) as string[]),
    );
    const mgrNames = new Map<string, string>();
    if (managerIds.length > 0) {
      const { data: mgrs } = await supabase
        .from("employees")
        .select("id, full_name")
        .in("id", managerIds);
      for (const m of mgrs ?? []) mgrNames.set(m.id, m.full_name);
    }

    return {
      rows: (rows ?? []).map((r) => ({
        id: r.id,
        company_id: r.company_id,
        employee_code: r.employee_code,
        full_name: r.full_name,
        email: r.email,
        phone: r.phone,
        department_id: r.department_id,
        department_name: (r.departments as { name: string } | null)?.name ?? null,
        designation_name: (r.designations as { name: string } | null)?.name ?? null,
        manager_id: r.manager_id,
        manager_name: r.manager_id ? mgrNames.get(r.manager_id) ?? null : null,
        location_name: (r.work_locations as { name: string } | null)?.name ?? null,
        employment_type: r.employment_type,
        status: r.status,
        hire_date: r.hire_date,
      })),
    };
  });

export interface EmployeeProfileData {
  employee: DirectoryRow;
  attendance_summary: { present: number; late: number; absent: number; on_leave: number };
  timesheet_summary: { total_hours: number; approved: number; pending: number };
  assets: Array<{ id: string; name: string; kind: string; assigned_at: string }>;
  documents: Array<{ id: string; doc_type: string; title: string; uploaded_at: string }>;
}

export const getEmployeeProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }): Promise<EmployeeProfileData | null> => {
    const { supabase } = context;
    const { data: emp } = await supabase
      .from("employees")
      .select(
        "id, company_id, employee_code, full_name, email, phone, employment_type, hire_date, status, department_id, manager_id, departments(name), designations(name), work_locations:default_location_id(name)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (!emp) return null;

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().slice(0, 10);

    const [att, ts, asn, docs, mgr] = await Promise.all([
      supabase
        .from("attendance_logs")
        .select("status, is_late")
        .eq("employee_id", data.id)
        .gte("log_date", monthAgoStr)
        .limit(500),
      supabase
        .from("timesheets")
        .select("total_hours, status")
        .eq("employee_id", data.id)
        .gte("period_start", monthAgoStr)
        .limit(500),
      supabase
        .from("asset_assignments")
        .select("id, assigned_at, returned_at, assets(name, kind)")
        .eq("employee_id", data.id)
        .is("returned_at", null)
        .limit(50),
      supabase
        .from("employee_documents")
        .select("id, doc_type, title, created_at")
        .eq("employee_id", data.id)
        .order("created_at", { ascending: false })
        .limit(50),
      emp.manager_id
        ? supabase.from("employees").select("full_name").eq("id", emp.manager_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const attRows = att.data ?? [];
    const tsRows = ts.data ?? [];

    return {
      employee: {
        id: emp.id,
        company_id: emp.company_id,
        employee_code: emp.employee_code,
        full_name: emp.full_name,
        email: emp.email,
        phone: emp.phone,
        department_id: emp.department_id,
        department_name: (emp.departments as { name: string } | null)?.name ?? null,
        designation_name: (emp.designations as { name: string } | null)?.name ?? null,
        manager_id: emp.manager_id,
        manager_name: (mgr.data as { full_name: string } | null)?.full_name ?? null,
        location_name: (emp.work_locations as { name: string } | null)?.name ?? null,
        employment_type: emp.employment_type,
        status: emp.status,
        hire_date: emp.hire_date,
      },
      attendance_summary: {
        present: attRows.filter((r) => r.status === "present").length,
        late: attRows.filter((r) => r.is_late).length,
        absent: attRows.filter((r) => r.status === "absent").length,
        on_leave: attRows.filter((r) => r.status === "on_leave").length,
      },
      timesheet_summary: {
        total_hours: Number(
          tsRows.reduce((s, t) => s + Number(t.total_hours ?? 0), 0).toFixed(1),
        ),
        approved: tsRows.filter((t) => t.status === "approved").length,
        pending: tsRows.filter((t) => t.status === "submitted").length,
      },
      assets: (asn.data ?? []).map((a) => ({
        id: a.id,
        name: (a.assets as { name: string; kind: string } | null)?.name ?? "—",
        kind: (a.assets as { name: string; kind: string } | null)?.kind ?? "other",
        assigned_at: a.assigned_at as string,
      })),
      documents: (docs.data ?? []).map((d) => ({
        id: d.id,
        doc_type: d.doc_type,
        title: d.title,
        uploaded_at: d.created_at as string,
      })),
    };
  });

// ============================================================
// Departments / Designations / Teams (workforce CRUD)
// ============================================================

export interface DepartmentRow {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  employee_count: number;
}

export const listDepartmentsFull = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: DepartmentRow[] }> => {
    const { supabase } = context;
    const [{ data: depts }, { data: emps }] = await Promise.all([
      supabase.from("departments").select("id, company_id, name, code").limit(500),
      supabase.from("employees").select("department_id").limit(5000),
    ]);
    const counts = new Map<string, number>();
    for (const e of emps ?? []) {
      if (e.department_id) counts.set(e.department_id, (counts.get(e.department_id) ?? 0) + 1);
    }
    return {
      rows: (depts ?? []).map((d) => ({
        id: d.id,
        company_id: d.company_id,
        name: d.name,
        code: d.code,
        employee_count: counts.get(d.id) ?? 0,
      })),
    };
  });

export const upsertDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        company_id: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
        code: z.string().trim().max(40).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const payload = {
      company_id: data.company_id,
      name: data.name,
      code: data.code || null,
    };
    const { error } = data.id
      ? await supabase.from("departments").update(payload).eq("id", data.id)
      : await supabase.from("departments").insert(payload);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteDepartment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("departments").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export interface DesignationRow {
  id: string;
  company_id: string;
  name: string;
  level: number | null;
  employee_count: number;
}

export const listDesignationsFull = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: DesignationRow[] }> => {
    const { supabase } = context;
    const [{ data: rows }, { data: emps }] = await Promise.all([
      supabase.from("designations").select("id, company_id, name, level").limit(500),
      supabase.from("employees").select("designation_id").limit(5000),
    ]);
    const counts = new Map<string, number>();
    for (const e of emps ?? []) {
      if (e.designation_id) counts.set(e.designation_id, (counts.get(e.designation_id) ?? 0) + 1);
    }
    return {
      rows: (rows ?? []).map((d) => ({
        id: d.id,
        company_id: d.company_id,
        name: d.name,
        level: d.level,
        employee_count: counts.get(d.id) ?? 0,
      })),
    };
  });

export const upsertDesignation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        company_id: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
        level: z.number().int().min(0).max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const payload = {
      company_id: data.company_id,
      name: data.name,
      level: data.level ?? 0,
    };
    const { error } = data.id
      ? await supabase.from("designations").update(payload).eq("id", data.id)
      : await supabase.from("designations").insert(payload);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteDesignation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("designations").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export interface WorkforceTeamRow {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  member_count: number;
  lead_name: string | null;
}

export const listWorkforceTeams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: WorkforceTeamRow[] }> => {
    const { supabase } = context;
    const { data: teams } = await supabase
      .from("teams")
      .select("id, company_id, name, description, lead_user_id")
      .limit(500);
    const { data: members } = await supabase.from("team_members").select("team_id").limit(5000);
    const leadIds = Array.from(
      new Set((teams ?? []).map((t) => t.lead_user_id).filter(Boolean) as string[]),
    );
    const leadNames = new Map<string, string>();
    if (leadIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", leadIds);
      for (const p of profiles ?? [])
        leadNames.set(p.id, (p.full_name as string | null) ?? "—");
    }
    const counts = new Map<string, number>();
    for (const m of members ?? []) counts.set(m.team_id, (counts.get(m.team_id) ?? 0) + 1);
    return {
      rows: (teams ?? []).map((t) => ({
        id: t.id,
        company_id: t.company_id,
        name: t.name,
        description: t.description,
        member_count: counts.get(t.id) ?? 0,
        lead_name: t.lead_user_id ? leadNames.get(t.lead_user_id) ?? null : null,
      })),
    };
  });

// ============================================================
// Attendance Rules
// ============================================================

export interface AttendanceRulesRow {
  id: string;
  company_id: string;
  name: string;
  is_default: boolean;
  grace_minutes: number;
  late_after_minutes: number;
  half_day_after_minutes: number;
  auto_absent_no_checkin: boolean;
  auto_checkout_after_shift: boolean;
  early_exit_minutes: number;
  allowed_break_minutes: number;
  excess_break_alert: boolean;
  unpaid_break_after_minutes: number;
  ot_after_minutes: number;
  weekend_ot_multiplier: number;
  holiday_ot_multiplier: number;
  night_shift_handling: string;
  cross_midnight_allowed: boolean;
  rotation_automation: boolean;
  geo_radius_meters: number;
  allowed_ips: string[];
  paid_hours_logic: string;
  deduction_logic: string;
  half_day_calc: string;
}

export const listAttendanceRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rules: AttendanceRulesRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("attendance_rules")
      .select("*")
      .order("is_default", { ascending: false })
      .order("name", { ascending: true })
      .limit(200);
    if (error) {
      console.error("listAttendanceRules", error);
      return { rules: [] };
    }
    return { rules: (data ?? []) as AttendanceRulesRow[] };
  });

const RulesUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  is_default: z.boolean().default(false),
  grace_minutes: z.number().int().min(0).max(120),
  late_after_minutes: z.number().int().min(0).max(240),
  half_day_after_minutes: z.number().int().min(0).max(720),
  auto_absent_no_checkin: z.boolean(),
  auto_checkout_after_shift: z.boolean(),
  early_exit_minutes: z.number().int().min(0).max(240),
  allowed_break_minutes: z.number().int().min(0).max(480),
  excess_break_alert: z.boolean(),
  unpaid_break_after_minutes: z.number().int().min(0).max(480),
  ot_after_minutes: z.number().int().min(0).max(1440),
  weekend_ot_multiplier: z.number().min(1).max(5),
  holiday_ot_multiplier: z.number().min(1).max(5),
  night_shift_handling: z.enum(["split_at_midnight", "attribute_to_start", "attribute_to_end"]),
  cross_midnight_allowed: z.boolean(),
  rotation_automation: z.boolean(),
  geo_radius_meters: z.number().int().min(10).max(5000),
  allowed_ips: z.array(z.string()).default([]),
  paid_hours_logic: z.enum(["worked_minutes", "shift_hours", "first_to_last_punch"]),
  deduction_logic: z.enum(["half_day_threshold", "per_minute", "none"]),
  half_day_calc: z.enum(["less_than_240_minutes", "less_than_300_minutes", "custom"]),
});

export const upsertAttendanceRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RulesUpsertSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { id, ...rest } = data;
    if (data.is_default && data.company_id) {
      // Clear existing default in same company
      await supabase
        .from("attendance_rules")
        .update({ is_default: false })
        .eq("company_id", data.company_id)
        .eq("is_default", true);
    }
    const { error } = id
      ? await supabase.from("attendance_rules").update(rest).eq("id", id)
      : await supabase.from("attendance_rules").insert(rest);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteAttendanceRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("attendance_rules")
      .delete()
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Automation health summary
// ============================================================

export const getAutomationHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const today = new Date().toISOString().slice(0, 10);
    const [auto_absent, auto_checkout, late, geo, rules] = await Promise.all([
      supabase.from("attendance_logs").select("id", { count: "exact", head: true }).eq("status", "absent").eq("log_date", today),
      supabase.from("attendance_logs").select("id", { count: "exact", head: true }).eq("source", "kiosk").eq("log_date", today),
      supabase.from("attendance_logs").select("id", { count: "exact", head: true }).eq("is_late", true).eq("log_date", today),
      supabase.from("attendance_logs").select("id", { count: "exact", head: true }).eq("source", "geofence").eq("log_date", today),
      supabase.from("attendance_rules").select("id", { count: "exact", head: true }),
    ]);
    return {
      auto_absent: auto_absent.count ?? 0,
      auto_checkout: auto_checkout.count ?? 0,
      late: late.count ?? 0,
      geofence: geo.count ?? 0,
      rules_configured: rules.count ?? 0,
    };
  });
