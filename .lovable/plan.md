# Workforce Pro Mega-Upgrade — Phased Plan

## Audit: what already exists ✅
- **Tables**: `employees`, `departments`, `designations`, `teams`, `team_members`, `shifts`, `shift_assignments`, `attendance_logs`, `timesheets`, `overtime_requests`, `leave_requests`, `leave_types`, `leave_balances`, `holidays`, `work_locations`, `audit_logs`, full RBAC stack
- **Routes (7)**: `workforce/{employees, attendance, timesheets, shifts, overtime, leave, holidays}`
- `src/lib/workforce.functions.ts` — 663 lines covering employees + most existing tables
- `timesheets` enum already supports `locked`

## Audit: what's missing ❌
- 10+ tables (rules, schedules/rosters, assets, documents, announcements, productivity, swap/correction/remote requests)
- 10+ routes (dashboard, directory profile + org chart, departments, designations, teams, rules, schedules, productivity, assets, documents, announcements, approvals, reports)
- Timesheet lock enforcement at DB layer
- CSV/XLSX export server functions
- Sidebar reorganization

## Sequencing — 3 batches, you approve each one

You confirmed: **phased**, **replace existing Workforce nav**, **form-based rules**, **CSV + XLSX only (no PDF)**.

Nothing is removed. All current routes/tables are preserved.

---

## 🟦 BATCH W1 — Foundation, Dashboard, Directory, Rules
*Largest batch. Sets up DB + nav + flagship pages.*

### W1.1 Database migration
New tables (all with RLS following existing `is_attendance_admin + is_member_of(company_id)` pattern):
- `attendance_rules` — `id, company_id, name, is_default, grace_minutes, late_after_minutes, half_day_after_minutes, auto_absent_no_checkin, auto_checkout_after_shift, allowed_break_minutes, excess_break_alert, unpaid_break_after_minutes, ot_after_minutes, weekend_ot_multiplier, holiday_ot_multiplier, night_shift_handling, geo_radius_meters, allowed_ips text[], paid_hours_logic, deduction_logic, half_day_calc, extra jsonb, created_at, updated_at`
- `schedules` — roster headers: `id, company_id, name, start_date, end_date, status (draft|published|archived), created_by, published_at`
- `schedule_entries` — `id, schedule_id, employee_id, work_date, shift_id, location_id, notes, is_off`
- `shift_swap_requests` — `id, company_id, requester_employee_id, target_employee_id, schedule_entry_id, reason, status, approved_by, approved_at`
- `attendance_correction_requests` — `id, company_id, employee_id, log_date, requested_check_in_at, requested_check_out_at, reason, status, approved_by`
- `remote_work_requests` — `id, company_id, employee_id, request_date, end_date, reason, status, approved_by`
- `productivity_logs` — `id, company_id, employee_id, log_date, productive_minutes, idle_minutes, tasks_completed, source, metadata jsonb`
- `assets` — `id, company_id, name, kind (laptop|phone|sim|id_card|accessory|other), serial_number, status (available|assigned|retired|lost), purchased_at, value, notes`
- `asset_assignments` — `id, asset_id, employee_id, assigned_at, returned_at, condition_on_return, assigned_by`
- `employee_documents` — `id, company_id, employee_id, doc_type (offer_letter|nda|id_proof|contract|policy|other), title, file_url, expires_at, uploaded_by, signed_at`
- `announcements` — `id, company_id, title, body, audience (all|department|team|role), audience_id, pinned, published_at, created_by`
- `announcement_reads` — `id, announcement_id, user_id, read_at` unique(announcement_id,user_id)

Plus DB trigger: when a `timesheets` row transitions `submitted → submitted` again or any non-admin tries to update a row whose status ∈ (`submitted`,`approved`,`locked`), block via `before update` trigger that checks `is_attendance_admin(auth.uid())`.

### W1.2 Sidebar (`src/components/admin/nav-config.ts`)
Replace the current `workforce` group with the full ordered list from your spec (14 items):
Dashboard, Directory, Departments, Designations, Teams, Rules, Automation, Shifts & Schedules, Timesheets, Overtime, Productivity, Assets, Documents, Announcements. Plus a sub-link **Approvals** under support. Existing routes (employees → Directory, attendance → Automation, etc.) are remapped, no orphans.

### W1.3 New routes (form-based, no drag-drop in v1)
- `_authenticated.admin.workforce.index.tsx` — **Workforce Dashboard** with 10 KPI cards + 5 charts (Recharts) wired to live counts
- `_authenticated.admin.workforce.directory.tsx` — searchable directory with filters (dept/team/office/manager/status), avatar grid + table toggle, click row → drawer with profile (contact, manager, joining date, skills, docs, attendance summary, timesheet summary, assigned assets, notes). Includes simple **org chart** view (recursive tree built from `manager_id`).
- `_authenticated.admin.workforce.departments.tsx` — CRUD list
- `_authenticated.admin.workforce.designations.tsx` — CRUD list with level
- `_authenticated.admin.workforce.teams.tsx` — workforce-scoped team management (separate from access/teams)
- `_authenticated.admin.workforce.rules.tsx` — categorized form (Time / Break / Overtime / Shift / Geo / Payroll) writing to `attendance_rules`. Default rule per company.
- `_authenticated.admin.workforce.automation.tsx` — surfaces the existing `attendance_logs` view + automation health (auto-absent count today, auto-checkout count, late count) and links to rules.

### W1.4 Server functions (`src/lib/workforce.functions.ts` + new files)
- `getWorkforceDashboard()` — single RPC returning all KPI numbers + chart series
- `listDirectory({ filters, search })`, `getEmployeeProfile(id)` — joins attendance/timesheet summaries, assets, docs
- `listDepartments/upsertDepartment/deleteDepartment`, same for designations & teams (workforce variant)
- `getAttendanceRules(companyId)`, `upsertAttendanceRules(payload)`
- All write paths call `log_audit()`

---

## 🟩 BATCH W2 — Schedules, Timesheet Lock, Approvals
*Roster planner + the lock-on-submit semantics + unified approval inbox.*

### W2.1 Routes
- `_authenticated.admin.workforce.schedules.tsx` — calendar grid (employees × days) for the active schedule. Cell click → assign shift dropdown. Bulk-assign by department modal. Publish toggle. Conflict + understaffed badges (computed client-side from `shifts.capacity_required`). Holiday-aware (gray out `holidays`).
- `_authenticated.admin.workforce.schedules.$id.tsx` — single schedule detail
- `_authenticated.admin.support.approvals.tsx` — unified approvals inbox (timesheets, swaps, corrections, remote, overtime, leave) with tab filters and approve/reject actions

### W2.2 Timesheet lock workflow
- Update `_authenticated.admin.workforce.timesheets.tsx`: status badges, "Submit", "Approve", "Reject", "Unlock" buttons gated by role + permission `timesheets.manage`
- Server fns: `submitTimesheet`, `approveTimesheet`, `rejectTimesheet`, `unlockTimesheet` — all enforce role checks and call `log_audit`. DB trigger from W1 backstops policy.

### W2.3 Server functions
- `listSchedules`, `createSchedule`, `publishSchedule`, `assignShiftEntry`, `bulkAssignByDept`, `swapEntries`
- `listPendingApprovals(scope)` — unions all pending requests for a manager/admin
- `approveRequest(kind, id)` / `rejectRequest(kind, id, reason)`

---

## 🟨 BATCH W3 — Productivity, Assets, Documents, Announcements, Reports
*Closing modules + exports.*

### W3.1 Routes
- `_authenticated.admin.workforce.productivity.tsx` — per-employee productive vs idle hrs (table + bar chart), department efficiency, capacity planning view (total shift hrs vs logged hrs)
- `_authenticated.admin.workforce.assets.tsx` — assets list + assign/return drawer + history
- `_authenticated.admin.workforce.documents.tsx` — per-employee doc library with upload-URL field (storage bucket NOT created yet — uses URL strings; storage upgrade is a future batch flagged in plan)
- `_authenticated.admin.workforce.announcements.tsx` — announcement composer + audience picker + read-receipt counts
- `_authenticated.admin.workforce.reports.tsx` — reports center with 6 canned reports (Attendance Summary, Shift Adherence, Department Productivity, Timesheet Utilization, Overtime Cost, Headcount Trends), filters (date range, dept, team), buttons "Export CSV" and "Export XLSX"

### W3.2 Export server functions
Add `bun add xlsx` (Worker-compatible build).
- `exportReport({ kind, filters, format })` — generates CSV string in-memory or builds workbook with SheetJS, returns base64 + filename. Client triggers download via `data:` URL — no /tmp filesystem use, fully Worker-safe.

### W3.3 Permission keys (seeded)
`workforce.dashboard.read`, `directory.read`, `directory.export`, `rules.manage`, `schedules.read|manage|publish`, `timesheets.manage|export`, `assets.manage`, `documents.manage`, `announcements.manage`, `approvals.manage`, `reports.export`. Granted to: super_admin (all), admin (all), hr (most), manager (read+approve scope), employee (read self).

---

## What stays out of scope (explicit)
- True drag-drop policy canvas (you chose form-based)
- PDF exports (you chose CSV+XLSX only)
- Mobile native app — backend is "mobile-app-ready" because the same server fns + RLS are reused; building a native shell is a separate project
- Jira/Asana/ClickUp project integrations (productivity tracks logged hours only in v1)
- File upload to bucket for `employee_documents` — uses URL strings now; storage bucket + signed-URL flow flagged as Batch W4 if you want it later
- Shift-assignment realtime subscription (polling is fine in v1)

## Risk & rollout
- Each batch ends with: (a) `bun run typecheck`-equivalent build, (b) my own QA pass on the new routes via preview navigation, (c) audit log verification.
- All migrations are additive — no destructive changes to existing tables.
- RLS uses existing helper functions (`is_attendance_admin`, `is_member_of`) so no recursion risk.

## Approval gate
Approve this plan and I'll start **Batch W1** immediately. After W1 ships I'll prompt you before starting W2, then again before W3.