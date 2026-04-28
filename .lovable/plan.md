
# Holiday Management — Full Build Plan

Replaces the existing minimal `Holidays` page with a complete, country-aware Holiday Management system. Existing modules stay intact; we extend the schema (no destructive changes) and rebuild the UI.

---

## 1. Database Schema (migration)

Keep existing `public.holidays` table (rename usage as "company holiday instances"). Add the following:

**`countries`** — master list of supported countries
- `code` (text, PK, ISO-2, e.g. "IN", "US", "AE")
- `name`, `flag_emoji`, `weekend_days` (int[] — 0=Sun…6=Sat), `default_timezone`

**`holiday_templates`** — prebuilt national/regional holidays per country/year
- `id`, `country_code` (FK), `year` (int), `name`, `holiday_date` (date), `region` (nullable, e.g. state), `type` (enum), `is_recurring` (bool), `source` (text)

**`holiday_types`** — enum: `national`, `regional`, `religious`, `optional`, `company`, `half_day`

**Extend `public.holidays`** (additive only — no data loss):
- `country_code` (text, nullable), `type` (holiday_type, default `company`), `is_paid` (bool, default true), `is_recurring` (bool, default false), `template_id` (uuid nullable, links to source template), `description` (text nullable), `year` (int generated from `holiday_date`)

**`company_holiday_settings`** — per-company config
- `company_id` (PK FK), `country_code`, `weekend_days` (int[]), `auto_import_enabled` (bool), `last_synced_year` (int)

**RLS:** templates & countries readable to all authenticated users; `holidays` and `company_holiday_settings` gated by company membership + `workforce.holidays.write` permission for mutations. `super_admin` bypass.

**Seed data:** Insert ~30 countries (IN, US, GB, AE, CA, AU, SG, DE, FR, SA, ZA, JP, CN, BR, MX, IT, ES, NL, NZ, IE, MY, ID, PH, TH, VN, EG, NG, KE, AR, CH) with weekend rules. Seed `holiday_templates` for years 2025–2027 for the major markets (curated list — ~15 holidays/country/year).

---

## 2. Server Functions (`src/lib/holidays.functions.ts`)

All gated by `requirePermission` middleware where appropriate.

- `listCountries()` — public to authenticated users
- `listHolidayTemplates({ country_code, year })` — preview prebuilt list
- `listCompanyHolidays({ company_id?, year?, type? })` — main list
- `getCompanyHolidaySettings({ company_id })`
- `updateCompanyHolidaySettings({ company_id, country_code, weekend_days, auto_import_enabled })`
- `importHolidayTemplate({ company_id, country_code, year, mode: 'replace' | 'merge' | 'skip_duplicates' })` — bulk insert from templates with conflict resolution
- `createHoliday(...)` / `updateHoliday(...)` / `deleteHoliday(...)` — extended fields (type, is_paid, description, is_recurring)
- `duplicateHolidayToYears({ holiday_id, target_years[] })`
- `bulkImportHolidaysFromCSV({ company_id, rows })` — CSV/Excel import
- `exportHolidays({ company_id, year, format: 'csv'|'pdf' })` — returns CSV string / triggers PDF generation
- `isHolidayOnDate({ company_id, date })` — used by Attendance/Leave/Shift modules
- `getLongWeekends({ company_id, year })` — bridge holiday detection
- `getUpcomingHolidays({ company_id, days })` — for notifications

---

## 3. UI — Holiday Management Module

**Route:** `/admin/workforce/holidays` (replace existing page) with sub-tabs.

### Page layout
- **Header:** company selector (super-admin sees all; admins see own), year selector (2024–2028), country selector with flag
- **Tabs:**
  1. **Calendar View** — month grid + year overview, color-coded by type (red=national, blue=company, orange=optional, purple=half-day, green=religious)
  2. **List View** — `DataTable` with columns: Date | Name | Country | Type | Paid | Recurring | Status | Actions
  3. **Templates** — browse prebuilt holidays for any country/year, preview, then "Import to company" button (modal asks Replace / Merge / Skip)
  4. **Settings** — set company default country, weekend days (Mon–Sun checkboxes with presets: "Sat-Sun", "Fri-Sat", "Fri only"), auto-import toggle
  5. **Long Weekends** — auto-computed list of upcoming long weekends + bridge-day suggestions

### Dialogs / actions
- Add/Edit holiday: name, date, type (select), country, region, paid checkbox, recurring checkbox, description
- Duplicate to years: multi-select 2025/2026/2027
- Import CSV: file upload with column-mapping preview
- Export: CSV / PDF (PDF uses `@react-pdf/renderer` or simple HTML→print)
- Country change wizard: when changing default country, modal with three options (Replace all / Merge / Keep custom only)

### Components
- `src/components/admin/holidays/holiday-calendar.tsx` — month-grid calendar with legend
- `src/components/admin/holidays/holiday-form-dialog.tsx`
- `src/components/admin/holidays/import-template-dialog.tsx`
- `src/components/admin/holidays/csv-import-dialog.tsx`
- `src/components/admin/holidays/country-select.tsx` — flag dropdown
- `src/components/admin/holidays/long-weekend-card.tsx`

---

## 4. Integration Hooks (lightweight, non-breaking)

- **Attendance** (`workforce.functions.ts` attendance queries): when computing late/absence for a date, call `isHolidayOnDate` and skip flags. Add a "Holiday" badge in attendance day cells.
- **Leave** (`workforce.leave.tsx`): when employee selects leave dates, fetch holidays in range and show inline warning "X of these days are holidays". Disable submit if all days are holidays.
- **Shifts/Roster** (`workforce.roster.tsx`): overlay holiday markers on roster cells; managers can still assign with a confirmation.
- **Payroll-ready flags**: holidays already carry `is_paid` and `type` — exposed via `isHolidayOnDate` for future payroll calc (no payroll UI changes this round; just data ready).

These integrations are read-only fetches added at the edges — no rewrites of existing logic.

---

## 5. Permissions

Add to `role_permissions` seed and the matrix UI:
- `workforce.holidays.read` — all employees (view calendar)
- `workforce.holidays.write` — admin/HR (CRUD, import)
- `workforce.holidays.manage_templates` — super_admin only (edit global templates)

Update `nav-config.ts` Holidays item to use `workforce.holidays.read` so employees see it too.

---

## 6. Notifications (basic, optional polish)

A daily server function `notifyUpcomingHolidays` that can be wired to pg_cron later. Not scheduled this round — just exposed as an admin-triggered "Send reminder" button for the next upcoming holiday.

---

## 7. Out of scope (this round)
- pg_cron scheduling for notifications (manual trigger only)
- Mobile native app surface (responsive web only)
- Real-time multi-region API sync (templates are seeded, not fetched live)
- Comp-off auto-grant logic (we surface holiday flags; payroll module will consume later)

---

## Files to create/edit

**Migrations**
- `supabase/migrations/<ts>_holidays_global_system.sql` — schema + country seed + 2025–2027 template seed for ~10 major countries + permissions

**Server**
- `src/lib/holidays.functions.ts` (new)
- `src/lib/workforce.functions.ts` (extend listHolidays/createHoliday for new columns)

**Routes / UI**
- `src/routes/_authenticated.admin.workforce.holidays.tsx` (rewrite — tabs shell)
- `src/components/admin/holidays/*` (6 new components above)

**Integrations**
- `src/routes/_authenticated.admin.workforce.attendance.tsx` (small holiday badge + skip-flag fetch)
- `src/routes/_authenticated.admin.workforce.leave.tsx` (date-range warning)
- `src/routes/_authenticated.admin.workforce.roster.tsx` (calendar overlay)

**Nav / perms**
- `src/components/admin/nav-config.ts` (permission key tweak)
- Permission seed in migration

---

Approve to proceed and I'll switch to build mode and execute.
