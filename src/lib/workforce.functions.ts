import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// Shared types & helpers
// ============================================================

export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "intern",
  "consultant",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "half_day",
  "on_leave",
  "holiday",
  "weekly_off",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_SOURCES = [
  "mobile",
  "web",
  "biometric",
  "kiosk",
  "manual",
  "geofence",
] as const;
export type AttendanceSource = (typeof ATTENDANCE_SOURCES)[number];

export const TIMESHEET_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "locked",
] as const;
export type TimesheetStatus = (typeof TIMESHEET_STATUSES)[number];

export const LEAVE_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;
export type LeaveRequestStatus = (typeof LEAVE_REQUEST_STATUSES)[number];

export const OVERTIME_STATUSES = ["pending", "approved", "rejected"] as const;
export type OvertimeStatus = (typeof OVERTIME_STATUSES)[number];

// ============================================================
// Employees
// ============================================================

export interface EmployeeRow {
  id: string;
  company_id: string;
  company_name: string;
  employee_code: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department_name: string | null;
  designation_name: string | null;
  employment_type: EmploymentType;
  hire_date: string | null;
  status: string;
  created_at: string;
}

export const listEmployees = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ employees: EmployeeRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("employees")
      .select(
        "id, company_id, employee_code, full_name, email, phone, employment_type, hire_date, status, created_at, companies(name), departments(name), designations(name)",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listEmployees", error);
      return { employees: [] };
    }
    return {
      employees: (data ?? []).map((e) => {
        const co = e.companies as { name: string } | null;
        const dept = e.departments as { name: string } | null;
        const desig = e.designations as { name: string } | null;
        return {
          id: e.id,
          company_id: e.company_id,
          company_name: co?.name ?? "—",
          employee_code: e.employee_code,
          full_name: e.full_name,
          email: e.email,
          phone: e.phone,
          department_name: dept?.name ?? null,
          designation_name: desig?.name ?? null,
          employment_type: e.employment_type as EmploymentType,
          hire_date: (e.hire_date as string | null) ?? null,
          status: e.status,
          created_at: e.created_at as string,
        };
      }),
    };
  });

const CreateEmployeeSchema = z.object({
  company_id: z.string().uuid(),
  employee_code: z.string().trim().min(1).max(40),
  full_name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  employment_type: z.enum(EMPLOYMENT_TYPES).default("full_time"),
  hire_date: z.string().optional().or(z.literal("")),
  department_id: z.string().uuid().optional().or(z.literal("")),
  designation_id: z.string().uuid().optional().or(z.literal("")),
});

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateEmployeeSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("employees").insert({
      company_id: data.company_id,
      employee_code: data.employee_code,
      full_name: data.full_name,
      email: data.email || null,
      phone: data.phone || null,
      employment_type: data.employment_type,
      hire_date: data.hire_date || null,
      department_id: data.department_id || null,
      designation_id: data.designation_id || null,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const UpdateEmployeeStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "on_leave", "terminated", "suspended"]),
});

export const updateEmployeeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateEmployeeStatusSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("employees")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Attendance
// ============================================================

export interface AttendanceRow {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  company_name: string;
  log_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  source: AttendanceSource;
  status: AttendanceStatus;
  worked_minutes: number;
  is_late: boolean;
  is_early_leave: boolean;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
}

export const listAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const Schema = z.object({ days: z.number().int().min(1).max(90).default(7) }).optional();
    return Schema.parse(input ?? {});
  })
  .handler(async ({ context, data }): Promise<{ logs: AttendanceRow[] }> => {
    const { supabase } = context;
    const days = data?.days ?? 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    const { data: rows, error } = await supabase
      .from("attendance_logs")
      .select(
        "id, employee_id, log_date, check_in_at, check_out_at, source, status, worked_minutes, is_late, is_early_leave, latitude, longitude, notes, employees(full_name, employee_code, companies(name))",
      )
      .gte("log_date", sinceStr)
      .order("log_date", { ascending: false })
      .order("check_in_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listAttendance", error);
      return { logs: [] };
    }
    return {
      logs: (rows ?? []).map((r) => {
        const emp = r.employees as
          | { full_name: string; employee_code: string; companies: { name: string } | null }
          | null;
        return {
          id: r.id,
          employee_id: r.employee_id,
          employee_name: emp?.full_name ?? "—",
          employee_code: emp?.employee_code ?? "—",
          company_name: emp?.companies?.name ?? "—",
          log_date: r.log_date,
          check_in_at: (r.check_in_at as string | null) ?? null,
          check_out_at: (r.check_out_at as string | null) ?? null,
          source: r.source as AttendanceSource,
          status: r.status as AttendanceStatus,
          worked_minutes: r.worked_minutes,
          is_late: r.is_late,
          is_early_leave: r.is_early_leave,
          latitude: (r.latitude as number | null) ?? null,
          longitude: (r.longitude as number | null) ?? null,
          notes: r.notes,
        };
      }),
    };
  });

const UpdateAttendanceStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(ATTENDANCE_STATUSES),
});

export const updateAttendanceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateAttendanceStatusSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("attendance_logs")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Shifts
// ============================================================

export interface ShiftRow {
  id: string;
  company_id: string;
  company_name: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  weekly_off: number[];
  is_night_shift: boolean;
  color: string;
}

export const listShifts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ shifts: ShiftRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("shifts")
      .select(
        "id, company_id, name, start_time, end_time, break_minutes, weekly_off, is_night_shift, color, companies(name)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("listShifts", error);
      return { shifts: [] };
    }
    return {
      shifts: (data ?? []).map((s) => {
        const co = s.companies as { name: string } | null;
        return {
          id: s.id,
          company_id: s.company_id,
          company_name: co?.name ?? "—",
          name: s.name,
          start_time: s.start_time,
          end_time: s.end_time,
          break_minutes: s.break_minutes,
          weekly_off: (s.weekly_off as number[]) ?? [],
          is_night_shift: s.is_night_shift,
          color: s.color ?? "#6366f1",
        };
      }),
    };
  });

const CreateShiftSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM"),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM"),
  break_minutes: z.number().int().min(0).max(480).default(0),
  is_night_shift: z.boolean().default(false),
});

export const createShift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateShiftSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("shifts").insert({
      company_id: data.company_id,
      name: data.name,
      start_time: data.start_time,
      end_time: data.end_time,
      break_minutes: data.break_minutes,
      is_night_shift: data.is_night_shift,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Timesheets
// ============================================================

export interface TimesheetRow {
  id: string;
  employee_id: string;
  employee_name: string;
  company_name: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  billable_hours: number;
  status: TimesheetStatus;
  submitted_at: string | null;
  approved_at: string | null;
}

export const listTimesheets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ timesheets: TimesheetRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("timesheets")
      .select(
        "id, employee_id, period_start, period_end, total_hours, billable_hours, status, submitted_at, approved_at, employees(full_name, companies(name))",
      )
      .order("period_start", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listTimesheets", error);
      return { timesheets: [] };
    }
    return {
      timesheets: (data ?? []).map((t) => {
        const emp = t.employees as
          | { full_name: string; companies: { name: string } | null }
          | null;
        return {
          id: t.id,
          employee_id: t.employee_id,
          employee_name: emp?.full_name ?? "—",
          company_name: emp?.companies?.name ?? "—",
          period_start: t.period_start,
          period_end: t.period_end,
          total_hours: Number(t.total_hours),
          billable_hours: Number(t.billable_hours),
          status: t.status as TimesheetStatus,
          submitted_at: (t.submitted_at as string | null) ?? null,
          approved_at: (t.approved_at as string | null) ?? null,
        };
      }),
    };
  });

const UpdateTimesheetStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(TIMESHEET_STATUSES),
});

export const updateTimesheetStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateTimesheetStatusSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const patch: { status: TimesheetStatus; approved_at?: string; submitted_at?: string } = {
      status: data.status,
    };
    if (data.status === "approved") patch.approved_at = new Date().toISOString();
    if (data.status === "submitted") patch.submitted_at = new Date().toISOString();
    const { error } = await supabase.from("timesheets").update(patch).eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Overtime
// ============================================================

export interface OvertimeRow {
  id: string;
  employee_id: string;
  employee_name: string;
  company_name: string;
  request_date: string;
  hours: number;
  reason: string | null;
  status: OvertimeStatus;
  created_at: string;
}

export const listOvertime = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ overtime: OvertimeRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("overtime_requests")
      .select(
        "id, employee_id, request_date, hours, reason, status, created_at, employees(full_name, companies(name))",
      )
      .order("request_date", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listOvertime", error);
      return { overtime: [] };
    }
    return {
      overtime: (data ?? []).map((o) => {
        const emp = o.employees as
          | { full_name: string; companies: { name: string } | null }
          | null;
        return {
          id: o.id,
          employee_id: o.employee_id,
          employee_name: emp?.full_name ?? "—",
          company_name: emp?.companies?.name ?? "—",
          request_date: o.request_date,
          hours: Number(o.hours),
          reason: o.reason,
          status: o.status as OvertimeStatus,
          created_at: o.created_at as string,
        };
      }),
    };
  });

const UpdateOvertimeStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(OVERTIME_STATUSES),
});

export const updateOvertimeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateOvertimeStatusSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const patch: { status: OvertimeStatus; approved_at?: string } = { status: data.status };
    if (data.status === "approved") patch.approved_at = new Date().toISOString();
    const { error } = await supabase
      .from("overtime_requests")
      .update(patch)
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Leave
// ============================================================

export interface LeaveRequestRow {
  id: string;
  employee_id: string;
  employee_name: string;
  company_name: string;
  leave_type_name: string | null;
  leave_type_color: string | null;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: LeaveRequestStatus;
  created_at: string;
}

export const listLeaveRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ requests: LeaveRequestRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("leave_requests")
      .select(
        "id, employee_id, start_date, end_date, days, reason, status, created_at, employees(full_name, companies(name)), leave_types(name, color)",
      )
      .order("start_date", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listLeaveRequests", error);
      return { requests: [] };
    }
    return {
      requests: (data ?? []).map((l) => {
        const emp = l.employees as
          | { full_name: string; companies: { name: string } | null }
          | null;
        const lt = l.leave_types as { name: string; color: string } | null;
        return {
          id: l.id,
          employee_id: l.employee_id,
          employee_name: emp?.full_name ?? "—",
          company_name: emp?.companies?.name ?? "—",
          leave_type_name: lt?.name ?? null,
          leave_type_color: lt?.color ?? null,
          start_date: l.start_date,
          end_date: l.end_date,
          days: Number(l.days),
          reason: l.reason,
          status: l.status as LeaveRequestStatus,
          created_at: l.created_at as string,
        };
      }),
    };
  });

const UpdateLeaveStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(LEAVE_REQUEST_STATUSES),
});

export const updateLeaveStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateLeaveStatusSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const patch: { status: LeaveRequestStatus; approved_at?: string } = { status: data.status };
    if (data.status === "approved") patch.approved_at = new Date().toISOString();
    const { error } = await supabase.from("leave_requests").update(patch).eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Holidays
// ============================================================

export interface HolidayRow {
  id: string;
  company_id: string;
  company_name: string;
  name: string;
  holiday_date: string;
  region: string | null;
  is_optional: boolean;
}

export const listHolidays = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ holidays: HolidayRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("holidays")
      .select("id, company_id, name, holiday_date, region, is_optional, companies(name)")
      .order("holiday_date", { ascending: true })
      .limit(500);
    if (error) {
      console.error("listHolidays", error);
      return { holidays: [] };
    }
    return {
      holidays: (data ?? []).map((h) => {
        const co = h.companies as { name: string } | null;
        return {
          id: h.id,
          company_id: h.company_id,
          company_name: co?.name ?? "—",
          name: h.name,
          holiday_date: h.holiday_date,
          region: h.region,
          is_optional: h.is_optional,
        };
      }),
    };
  });

const CreateHolidaySchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  holiday_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  is_optional: z.boolean().default(false),
});

export const createHoliday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateHolidaySchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("holidays").insert({
      company_id: data.company_id,
      name: data.name,
      holiday_date: data.holiday_date,
      region: data.region || null,
      is_optional: data.is_optional,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteHoliday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("holidays").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ============================================================
// Companies (helper for selectors)
// ============================================================

export interface CompanyOption {
  id: string;
  name: string;
}

export const listCompanyOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ companies: CompanyOption[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("companies")
      .select("id, name")
      .order("name", { ascending: true })
      .limit(500);
    if (error) {
      console.error("listCompanyOptions", error);
      return { companies: [] };
    }
    return { companies: (data ?? []).map((c) => ({ id: c.id, name: c.name })) };
  });
