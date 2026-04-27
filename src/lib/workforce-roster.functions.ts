import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// Roster planner — schedules + entries with conflict detection
// ============================================================

export interface ScheduleSummaryRow {
  id: string;
  company_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  published_at: string | null;
  entries_count: number;
}

export const listSchedules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: ScheduleSummaryRow[] }> => {
    const { supabase } = context;
    const [{ data: scheds }, { data: entries }] = await Promise.all([
      supabase
        .from("schedules")
        .select("id, company_id, name, start_date, end_date, status, published_at")
        .order("start_date", { ascending: false })
        .limit(200),
      supabase.from("schedule_entries").select("schedule_id").limit(20000),
    ]);
    const counts = new Map<string, number>();
    for (const e of entries ?? [])
      counts.set(e.schedule_id, (counts.get(e.schedule_id) ?? 0) + 1);
    return {
      rows: (scheds ?? []).map((s) => ({
        id: s.id,
        company_id: s.company_id,
        name: s.name,
        start_date: s.start_date,
        end_date: s.end_date,
        status: s.status,
        published_at: s.published_at,
        entries_count: counts.get(s.id) ?? 0,
      })),
    };
  });

export const upsertSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        company_id: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
        start_date: z.string(),
        end_date: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.id) {
      const { error } = await supabase
        .from("schedules")
        .update({
          name: data.name,
          start_date: data.start_date,
          end_date: data.end_date,
        })
        .eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await supabase
      .from("schedules")
      .insert({
        company_id: data.company_id,
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        created_by: userId,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !row) return { ok: false as const, error: error?.message ?? "Failed" };
    return { ok: true as const, id: row.id };
  });

export const publishSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("schedules")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    await supabase.from("schedule_entries").delete().eq("schedule_id", data.id);
    const { error } = await supabase.from("schedules").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export interface RosterEntry {
  id: string;
  schedule_id: string;
  employee_id: string;
  employee_name: string;
  shift_id: string | null;
  shift_name: string | null;
  shift_color: string | null;
  work_date: string;
  is_off: boolean;
  notes: string | null;
}

export interface RosterShiftLite {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string | null;
  is_night_shift: boolean;
}

export interface RosterEmployeeLite {
  id: string;
  full_name: string;
  employee_code: string;
  department_name: string | null;
}

export interface RosterPlannerData {
  schedule: {
    id: string;
    company_id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
    published_at: string | null;
  };
  days: string[];
  employees: RosterEmployeeLite[];
  shifts: RosterShiftLite[];
  entries: RosterEntry[];
}

export const getRosterPlanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ schedule_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }): Promise<RosterPlannerData | null> => {
    const { supabase } = context;
    const { data: sched } = await supabase
      .from("schedules")
      .select("id, company_id, name, start_date, end_date, status, published_at")
      .eq("id", data.schedule_id)
      .maybeSingle();
    if (!sched) return null;

    const [{ data: emps }, { data: shifts }, { data: ents }] = await Promise.all([
      supabase
        .from("employees")
        .select("id, full_name, employee_code, department_id, departments(name)")
        .eq("company_id", sched.company_id)
        .eq("status", "active")
        .order("full_name", { ascending: true })
        .limit(500),
      supabase
        .from("shifts")
        .select("id, name, start_time, end_time, color, is_night_shift")
        .eq("company_id", sched.company_id)
        .order("start_time", { ascending: true })
        .limit(100),
      supabase
        .from("schedule_entries")
        .select("id, schedule_id, employee_id, shift_id, work_date, is_off, notes")
        .eq("schedule_id", data.schedule_id)
        .limit(20000),
    ]);

    const empNameMap = new Map<string, string>();
    for (const e of emps ?? []) empNameMap.set(e.id, e.full_name);
    const shiftMap = new Map<string, { name: string; color: string | null }>();
    for (const s of shifts ?? []) shiftMap.set(s.id, { name: s.name, color: s.color });

    // build day axis
    const days: string[] = [];
    const start = new Date(sched.start_date);
    const end = new Date(sched.end_date);
    for (
      let d = new Date(start);
      d.getTime() <= end.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      days.push(d.toISOString().slice(0, 10));
    }

    return {
      schedule: sched,
      days,
      employees: (emps ?? []).map((e) => ({
        id: e.id,
        full_name: e.full_name,
        employee_code: e.employee_code,
        department_name: (e.departments as { name: string } | null)?.name ?? null,
      })),
      shifts: (shifts ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        start_time: s.start_time,
        end_time: s.end_time,
        color: s.color,
        is_night_shift: s.is_night_shift,
      })),
      entries: (ents ?? []).map((e) => ({
        id: e.id,
        schedule_id: e.schedule_id,
        employee_id: e.employee_id,
        employee_name: (e.employees as { full_name: string } | null)?.full_name ?? "—",
        shift_id: e.shift_id,
        shift_name: (e.shifts as { name: string; color: string } | null)?.name ?? null,
        shift_color: (e.shifts as { name: string; color: string } | null)?.color ?? null,
        work_date: e.work_date,
        is_off: e.is_off,
        notes: e.notes,
      })),
    };
  });

const AssignSchema = z.object({
  schedule_id: z.string().uuid(),
  company_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  work_date: z.string(),
  shift_id: z.string().uuid().nullable(),
  is_off: z.boolean().default(false),
  notes: z.string().max(280).optional().nullable(),
});

export const assignRosterEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AssignSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;

    // Conflict detection: same employee + same date in any other schedule
    const { data: conflicts } = await supabase
      .from("schedule_entries")
      .select("id, schedule_id, schedules(name, status)")
      .eq("employee_id", data.employee_id)
      .eq("work_date", data.work_date)
      .neq("schedule_id", data.schedule_id)
      .limit(5);

    const blockingConflicts = (conflicts ?? []).filter(
      (c) =>
        (c.schedules as { status?: string } | null)?.status === "published",
    );

    // Upsert by composite (schedule_id, employee_id, work_date)
    const { data: existing } = await supabase
      .from("schedule_entries")
      .select("id")
      .eq("schedule_id", data.schedule_id)
      .eq("employee_id", data.employee_id)
      .eq("work_date", data.work_date)
      .maybeSingle();

    const payload = {
      schedule_id: data.schedule_id,
      company_id: data.company_id,
      employee_id: data.employee_id,
      work_date: data.work_date,
      shift_id: data.is_off ? null : data.shift_id,
      is_off: data.is_off,
      notes: data.notes ?? null,
    };

    const { error } = existing
      ? await supabase.from("schedule_entries").update(payload).eq("id", existing.id)
      : await supabase.from("schedule_entries").insert(payload);

    if (error) return { ok: false as const, error: error.message };
    return {
      ok: true as const,
      conflicts: blockingConflicts.length,
      conflict_schedules: blockingConflicts.map(
        (c) => (c.schedules as { name: string } | null)?.name ?? "",
      ),
    };
  });

export const clearRosterEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        schedule_id: z.string().uuid(),
        employee_id: z.string().uuid(),
        work_date: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("schedule_entries")
      .delete()
      .eq("schedule_id", data.schedule_id)
      .eq("employee_id", data.employee_id)
      .eq("work_date", data.work_date);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const bulkAssignWeekday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        schedule_id: z.string().uuid(),
        company_id: z.string().uuid(),
        employee_id: z.string().uuid(),
        shift_id: z.string().uuid(),
        days: z.array(z.string()).min(1).max(62),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const rows = data.days.map((d) => ({
      schedule_id: data.schedule_id,
      company_id: data.company_id,
      employee_id: data.employee_id,
      work_date: d,
      shift_id: data.shift_id,
      is_off: false,
    }));
    // delete then insert (simple atomic-ish replacement)
    await supabase
      .from("schedule_entries")
      .delete()
      .eq("schedule_id", data.schedule_id)
      .eq("employee_id", data.employee_id)
      .in("work_date", data.days);
    const { error } = await supabase.from("schedule_entries").insert(rows);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, inserted: rows.length };
  });
