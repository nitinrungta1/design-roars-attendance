## Global Holiday Allocation Engine

Enhances the existing Holiday Management module without removing it. Current `holidays`, `holiday_templates`, `countries`, `company_holiday_settings` tables stay as-is. We add a **policy layer** on top that resolves the correct holiday set per employee from 5 layered scopes.

---

### 1. Database (new migration)

New enum:
- `holiday_scope_level` = `global | country | region | office | employee`

New tables:

- **`holiday_policies`** — reusable named policies per company  
  `id, company_id, name, description, country_code, region, office_location_id?, weekend_days int[], floating_quota int default 0, is_default bool, created_at`

- **`holiday_policy_holidays`** — holidays attached to a policy (replaces ad-hoc per-company list at the policy layer; existing `holidays` rows continue to work as company-level)  
  `id, policy_id, name, holiday_date, type holiday_type, is_paid, is_optional, is_recurring, region, source_template_id?, year (generated)`

- **`employee_holiday_assignments`** — links employees / scopes to policies (bulk by office/dept/country, or individual)  
  `id, company_id, policy_id, scope_level holiday_scope_level, employee_id?, department_id?, location_id?, country_code?, region?, priority int default 100`

- **`employee_floating_holidays`** — used floating/optional holidays per employee  
  `id, employee_id, holiday_date, name, year, status (pending/approved/used), created_at`

- **`holiday_overrides`** — per-employee override (skip a holiday or add a custom one)  
  `id, employee_id, holiday_date, action (add|remove|move), original_date?, name?, reason, created_at`

Extend `employees`: add `country_code text`, `region text`, `city text`, `timezone text`, `holiday_policy_id uuid references holiday_policies` (all nullable, additive).

Extend `holidays` table: add `scope_level holiday_scope_level default 'global'`, `office_location_id uuid` (nullable) — keeps existing rows valid.

Resolver SQL function `get_employee_holidays(_employee_id uuid, _year int)` returns the merged set by:
1. Global company holidays (`holidays` where scope=global)
2. Country holidays (employee.country_code matches)
3. Region holidays (employee.region matches)
4. Office holidays (employee.default_location_id matches)
5. Policy holidays (via `employee_holiday_assignments`)
6. Apply `holiday_overrides` (remove/move/add)
7. De-dupe by `(holiday_date, name)`

RLS: company-scoped via `is_member_of(company_id)`; employees see only their own resolved set; admins manage via `workforce.holidays.write` permission.

New permission keys (granted to existing roles via `role_permissions`):
- `workforce.holidays.policies.read` / `.write`
- `workforce.holidays.assign` (bulk assignment)

Permission `workforce.holidays.read` already exists.

---

### 2. Server functions (`src/lib/holiday-engine.functions.ts` — new)

All wrapped with `requirePermission(...)` middleware.

- `listHolidayPolicies({ company_id })`
- `createHolidayPolicy(input)` / `updateHolidayPolicy` / `deleteHolidayPolicy`
- `clonePolicy({ policy_id, name })`
- `addPolicyHoliday({ policy_id, ... })` / `removePolicyHoliday`
- `importTemplateIntoPolicy({ policy_id, country_code, year, mode })` — reuses `holiday_templates`
- `assignPolicy({ policy_id, scope, employee_ids?|department_id?|location_id?|country_code? })` — bulk
- `unassignPolicy({ assignment_id })`
- `listEmployeeHolidays({ employee_id, year })` — calls SQL resolver, returns merged + colored
- `addEmployeeOverride({ employee_id, action, ... })`
- `claimFloatingHoliday({ employee_id, holiday_date, name })`
- `cloneYearForward({ company_id, from_year, to_year })` — auto rollover
- `holidayCoverageReport({ company_id, year })` — counts by country/office for dashboard

Existing `holidays.functions.ts` stays untouched (templates, settings, long-weekends, CSV import all reused).

---

### 3. UI

**Existing route** `_authenticated.admin.workforce.holidays.tsx` — keep all 5 tabs (List, Calendar, Templates, Long Weekends, Settings). Add **2 new tabs**:

- **Policies** — list of holiday policies for selected company; create/edit/clone; per-policy holiday list; "Import country template into this policy" action.
- **Assignments** — table of who-gets-what (by employee/department/office/country); bulk-assign dialog with scope picker; shows resolved counts per employee.

**New route** `_authenticated.admin.workforce.holidays.employee.$employeeId.tsx`:
- Personalized year calendar for one employee (color-coded: red=public, blue=company, orange=optional, purple=personal floating).
- Override actions: Skip / Move / Add custom.
- Floating quota tracker.

**Employee profile** (`_authenticated.admin.workforce.employees.tsx`): add Country/Region/City/Timezone/Policy fields to the edit form so the resolver has data to work with.

**Reports widget** in Holidays page header strip:
- Employees on holiday today / Upcoming global / Country breakdown / Office coverage.

PDF export of yearly calendar per office/country (server function returning HTML → user prints, no new deps).

---

### 4. Module integrations

- **Attendance** (`workforce.functions.ts` mark logic): when computing late/absent, call resolver; if date is a holiday for that employee, skip flags and tag the day `holiday`. Holiday work hours feed into existing overtime calc with `holiday_multiplier` setting.
- **Leave** (`_authenticated.admin.workforce.leave.tsx` + leave create flow): on date pick, fetch `listEmployeeHolidays` and warn "X is a holiday — leave not needed"; suggest bridge days when holiday is adjacent to weekend.
- **Roster/Shifts**: overlay holiday markers; conflict alert badge if a shift sits on an employee's holiday.
- **Payroll-ready hooks**: resolver output exposed via existing `isHolidayOnDate` (extend to accept `employee_id`).

---

### 5. Permissions & nav

Add new nav items under Workforce (gated):
- `Holidays → Policies` (`workforce.holidays.policies.read`)
- `Holidays → Assignments` (`workforce.holidays.assign`)

Both rendered inside the existing Holidays page tabs, plus optional sidebar shortcuts.

---

### 6. Out of scope (this iteration)

- Excel (.xlsx) parsing on import — CSV import already exists; .xlsx can be added later if requested.
- External holiday API sync (Calendarific etc.) — templates remain seeded.
- Mobile-specific layout polish beyond current responsive grid.

---

### Files

**Created**
- `supabase/migrations/<ts>_holiday_engine.sql`
- `src/lib/holiday-engine.functions.ts`
- `src/routes/_authenticated.admin.workforce.holidays.employee.$employeeId.tsx`
- `src/components/admin/holidays/policy-form-dialog.tsx`
- `src/components/admin/holidays/assignment-dialog.tsx`
- `src/components/admin/holidays/policies-tab.tsx`
- `src/components/admin/holidays/assignments-tab.tsx`

**Edited**
- `src/routes/_authenticated.admin.workforce.holidays.tsx` (add 2 tabs + reports strip)
- `src/routes/_authenticated.admin.workforce.employees.tsx` (location/policy fields in edit form)
- `src/routes/_authenticated.admin.workforce.leave.tsx` (holiday warning on date pick)
- `src/routes/_authenticated.admin.workforce.attendance.tsx` (holiday badge in rows)
- `src/routes/_authenticated.admin.workforce.roster.tsx` (holiday overlay)
- `src/lib/holidays.functions.ts` (extend `isHolidayOnDate` to accept `employee_id`)
- `src/lib/workforce.functions.ts` (skip late/absent on holidays)
- `src/components/admin/nav-config.ts` (new sub-items)
