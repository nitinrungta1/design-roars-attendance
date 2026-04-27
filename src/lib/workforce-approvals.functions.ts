import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// Unified approvals inbox
// ============================================================

export type ApprovalKind =
  | "timesheet"
  | "shift_swap"
  | "attendance_correction"
  | "remote_work"
  | "overtime"
  | "leave";

export interface ApprovalItem {
  id: string;
  kind: ApprovalKind;
  employee_id: string;
  employee_name: string;
  submitted_at: string;
  summary: string;
  reason: string | null;
  status: string;
  meta: Record<string, string | number | null>;
}

export interface ApprovalsInboxData {
  counts: Record<ApprovalKind, number>;
  items: ApprovalItem[];
}

const FilterSchema = z
  .object({
    kind: z
      .enum([
        "timesheet",
        "shift_swap",
        "attendance_correction",
        "remote_work",
        "overtime",
        "leave",
      ])
      .optional(),
  })
  .optional();

export const getApprovalsInbox = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => FilterSchema.parse(input ?? {}))
  .handler(async ({ context, data }): Promise<ApprovalsInboxData> => {
    const { supabase } = context;

    const [ts, swaps, corr, remote, ot, leave, emps] = await Promise.all([
      supabase
        .from("timesheets")
        .select(
          "id, employee_id, period_start, period_end, total_hours, billable_hours, status, submitted_at, notes",
        )
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(200),
      supabase
        .from("shift_swap_requests")
        .select(
          "id, requester_employee_id, target_employee_id, schedule_entry_id, status, reason, created_at",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("attendance_correction_requests")
        .select(
          "id, employee_id, log_date, requested_check_in_at, requested_check_out_at, status, reason, created_at",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("remote_work_requests")
        .select(
          "id, employee_id, request_date, end_date, status, reason, created_at",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("overtime_requests")
        .select(
          "id, employee_id, request_date, hours, status, reason, created_at",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("leave_requests")
        .select(
          "id, employee_id, start_date, end_date, days, status, reason, created_at, leave_types(name)",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("employees").select("id, full_name, employee_code").limit(5000),
    ]);

    const empName = new Map<string, string>();
    for (const e of emps.data ?? []) empName.set(e.id, e.full_name);

    const items: ApprovalItem[] = [];

    for (const t of ts.data ?? []) {
      items.push({
        id: t.id,
        kind: "timesheet",
        employee_id: t.employee_id,
        employee_name: empName.get(t.employee_id) ?? "—",
        submitted_at: t.submitted_at ?? new Date().toISOString(),
        summary: `${t.period_start} → ${t.period_end} · ${Number(t.total_hours).toFixed(1)}h`,
        reason: t.notes,
        status: t.status,
        meta: {
          period_start: t.period_start,
          period_end: t.period_end,
          total_hours: Number(t.total_hours),
          billable_hours: Number(t.billable_hours),
        },
      });
    }
    for (const s of swaps.data ?? []) {
      items.push({
        id: s.id,
        kind: "shift_swap",
        employee_id: s.requester_employee_id,
        employee_name: empName.get(s.requester_employee_id) ?? "—",
        submitted_at: s.created_at,
        summary: `Swap with ${s.target_employee_id ? empName.get(s.target_employee_id) ?? "another employee" : "open"}`,
        reason: s.reason,
        status: s.status,
        meta: { schedule_entry_id: s.schedule_entry_id ?? null },
      });
    }
    for (const c of corr.data ?? []) {
      items.push({
        id: c.id,
        kind: "attendance_correction",
        employee_id: c.employee_id,
        employee_name: empName.get(c.employee_id) ?? "—",
        submitted_at: c.created_at,
        summary: `Correction for ${c.log_date}`,
        reason: c.reason,
        status: c.status,
        meta: {
          log_date: c.log_date,
          requested_check_in: c.requested_check_in_at,
          requested_check_out: c.requested_check_out_at,
        },
      });
    }
    for (const r of remote.data ?? []) {
      items.push({
        id: r.id,
        kind: "remote_work",
        employee_id: r.employee_id,
        employee_name: empName.get(r.employee_id) ?? "—",
        submitted_at: r.created_at,
        summary: `Remote ${r.request_date}${r.end_date ? ` → ${r.end_date}` : ""}`,
        reason: r.reason,
        status: r.status,
        meta: { request_date: r.request_date, end_date: r.end_date },
      });
    }
    for (const o of ot.data ?? []) {
      items.push({
        id: o.id,
        kind: "overtime",
        employee_id: o.employee_id,
        employee_name: empName.get(o.employee_id) ?? "—",
        submitted_at: o.created_at,
        summary: `${Number(o.hours).toFixed(1)}h on ${o.request_date}`,
        reason: o.reason,
        status: o.status,
        meta: { request_date: o.request_date, hours: Number(o.hours) },
      });
    }
    for (const l of leave.data ?? []) {
      const lt = (l.leave_types as { name: string } | null)?.name ?? "Leave";
      items.push({
        id: l.id,
        kind: "leave",
        employee_id: l.employee_id,
        employee_name: empName.get(l.employee_id) ?? "—",
        submitted_at: l.created_at,
        summary: `${lt} · ${l.start_date} → ${l.end_date} (${Number(l.days).toFixed(1)}d)`,
        reason: l.reason,
        status: l.status,
        meta: {
          start_date: l.start_date,
          end_date: l.end_date,
          days: Number(l.days),
          leave_type: lt,
        },
      });
    }

    items.sort(
      (a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
    );

    const counts: Record<ApprovalKind, number> = {
      timesheet: ts.data?.length ?? 0,
      shift_swap: swaps.data?.length ?? 0,
      attendance_correction: corr.data?.length ?? 0,
      remote_work: remote.data?.length ?? 0,
      overtime: ot.data?.length ?? 0,
      leave: leave.data?.length ?? 0,
    };

    const filtered = data?.kind ? items.filter((i) => i.kind === data.kind) : items;
    return { counts, items: filtered };
  });

const DecisionSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum([
    "timesheet",
    "shift_swap",
    "attendance_correction",
    "remote_work",
    "overtime",
    "leave",
  ]),
  decision: z.enum(["approve", "reject"]),
});

export const decideApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DecisionSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const now = new Date().toISOString();
    const approving = data.decision === "approve";

    const tableMap: Record<ApprovalKind, string> = {
      timesheet: "timesheets",
      shift_swap: "shift_swap_requests",
      attendance_correction: "attendance_correction_requests",
      remote_work: "remote_work_requests",
      overtime: "overtime_requests",
      leave: "leave_requests",
    };
    const statusValue =
      data.kind === "timesheet"
        ? approving
          ? "approved"
          : "rejected"
        : approving
          ? "approved"
          : "rejected";

    const payload: Record<string, string | null> = {
      status: statusValue,
      approved_at: approving ? now : null,
      approved_by: approving ? userId : null,
    };

    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        update: (p: Record<string, string | null>) => {
          eq: (k: string, v: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    })
      .from(tableMap[data.kind])
      .update(payload)
      .eq("id", data.id);

    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
