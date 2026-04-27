# Batch 6 — Access Control & System Governance

Turn the **Access Control** and **System** sidebar groups into a complete enterprise-grade RBAC + governance layer. Reuses every existing table (`user_roles`, `company_members`, `audit_logs`, `feature_flags`) — nothing is deleted or renamed.

---

## 1. Database — new migration

### New tables
| Table | Purpose |
|---|---|
| `teams` | Named team groupings inside a company (e.g. "Engineering", "Sales") |
| `team_members` | `team_id` ↔ `user_id` join, with `is_lead` flag |
| `permissions` | Catalog of ~40 atomic permissions (`workforce.attendance.read`, `billing.invoices.write`, …) seeded once |
| `role_permissions` | Which `app_role` grants which `permission_key` (toggleable matrix) |
| `platform_settings` | Single-row key/value store for global config (brand name, support email, default plan, currency, timezone, feature toggles) |
| `backup_snapshots` | Metadata for manual export jobs (table count, row count, size, requested_by, status, download_url) |

### Helpers
- `public.has_permission(_user_id uuid, _key text) returns boolean` — joins `user_roles` → `role_permissions` → `permissions`.
- `public.log_audit(_action text, _entity text, _entity_id uuid, _meta jsonb)` — security-definer insert into `audit_logs` capturing `user_id`, `ip`, `user_agent` from `auth.jwt()` claims.

### RLS
- `teams` / `team_members`: read = `is_member_of(company_id)`; write = `is_admin(auth.uid())` or team lead.
- `permissions`: read = any authenticated; write = `super_admin` only.
- `role_permissions`: read = `is_admin`; write = `super_admin`.
- `platform_settings`: read = `is_admin`; write = `super_admin`.
- `backup_snapshots`: read + write = `super_admin`.
- `audit_logs`: already restricted; add `super_admin can read all`, `admin can read company-scoped`.

### Seed
- ~40 permissions across 11 modules (dashboard, customers, workforce, billing, leads, cms, support, analytics, access, integrations, system) × CRUD verbs.
- Default `role_permissions` mapping: super_admin = all, admin = all except `system.*.write`, finance = billing.*, support = support.* + customers.read, sales = leads.* + customers.* + crm.*, hr = workforce.*, developer = integrations.* + system.audit-logs.read, viewer = *.read only.

---

## 2. Server functions — `src/lib/access.functions.ts` & `src/lib/system.functions.ts`

**access.functions.ts**
- `listPlatformUsers()` — joins `auth.users` view + `profiles` + `user_roles` + primary `company_members`. Returns email, name, roles[], company, last_sign_in.
- `assignRole({ userId, role })` / `revokeRole({ userId, role })` — super_admin only; writes audit log.
- `listRolesWithCounts()` — every `app_role` + member count + permission count.
- `listPermissionMatrix()` — returns `{ permissions[], roles[], grants: { [role]: Set<permKey> } }` for the grid.
- `togglePermission({ role, permissionKey, granted })` — super_admin only; audit-logged.
- `listTeams()` / `createTeam` / `addTeamMember` / `removeTeamMember` / `setTeamLead`.

**system.functions.ts**
- `getPlatformSettings()` / `updatePlatformSettings(patch)` — super_admin only.
- `listAuditLogs({ q, action, entity, userId, from, to, limit })` — paginated, filterable.
- `listBackups()` / `requestBackup()` — inserts a `backup_snapshots` row in `pending` state (actual export worker is out of scope; the row is the audit/UX surface).
- `listFeatureFlags()` / `toggleFeatureFlag` — wraps existing `feature_flags` table.

All write functions call the new `log_audit()` helper.

---

## 3. Live admin routes (replace 8 placeholders)

### `_authenticated.admin.access.users.tsx`
- KPI strip: total users, active 7d, super-admins, suspended.
- Searchable `DataTable`: avatar, name, email, roles (chips), primary company, last sign-in, status.
- Row drawer: assign/revoke role select, view audit trail (last 20 actions by this user), copy user-id button, send password-reset link (calls `lovable.auth.resetPasswordForEmail`).

### `_authenticated.admin.access.roles.tsx`
- Cards grid: one card per `app_role` showing description, member count, granted-permission count, "Edit permissions →" link to `/admin/access/permissions?role=…`.
- Inline rename of human-readable label (stored in `platform_settings.role_labels`).

### `_authenticated.admin.access.permissions.tsx` ⭐ flagship
- **Permission matrix grid**: rows = permissions grouped by module (collapsible), columns = roles. Each cell is a `<Switch>` reflecting `role_permissions`.
- Optimistic toggle → `togglePermission` server fn → toast.
- Top filter: search permissions, filter by module, "show only differences vs default".
- Read-only for non super-admin (switches disabled with tooltip).

### `_authenticated.admin.access.teams.tsx`
- Team list with avatars stack (first 5 members), member count, lead badge.
- "Create team" dialog (name, color, description).
- Click row → drawer: add/remove members from a `Combobox` of company users, promote to lead.

### `_authenticated.admin.system.settings.tsx`
- Tabbed shell: **General** (brand name, support email, default plan, default currency, default timezone), **Branding** (logo URL, primary color preview), **Feature Flags** (list with switches), **Email** (from-name shown; deep-link to integrations/email).
- One save button per tab → `updatePlatformSettings`.

### `_authenticated.admin.system.audit-logs.tsx` ⭐
- Filter bar: search query, action select, entity select, actor combobox, date-range picker (last 24h / 7d / 30d / custom).
- Virtualised `DataTable`: timestamp, actor (avatar+email), action chip (color by verb: create=green, update=amber, delete=red, login=blue), entity, entity-id (truncated), IP, expandable JSON `meta`.
- Export current filter to CSV button.

### `_authenticated.admin.system.security.tsx`
- Sections (read-only telemetry + toggles in `platform_settings.security`):
  - **2FA enforcement**: switch (per role).
  - **Session policy**: idle timeout minutes (input), max concurrent sessions.
  - **IP allowlist**: textarea of CIDRs.
  - **Password policy**: min length, require symbol/number, HIBP check toggle.
  - **OAuth providers**: status row for Google (live from Lovable Cloud config).
- Bottom card: "Recent security events" — pulls audit_logs filtered to action ∈ (login, logout, password_reset, role_assigned, role_revoked).

### `_authenticated.admin.system.backups.tsx`
- "Request backup" button → inserts `backup_snapshots` row, optimistic add to list.
- Table: requested_at, requested_by, status badge (pending/running/ready/failed), tables, rows, size, download button (disabled until ready).
- Banner explaining backups capture all `public.*` tables as JSON; runtime worker is a follow-up batch.

---

## 4. Wire audit logging into existing modules

Add `log_audit()` calls (no UI changes needed) to the write paths shipped in batches 2–5 so the new audit-logs page has real data immediately:

- `customers.functions.ts`: `setCompanyPlan`, `suspendCompany`, `createContact`.
- `billing.functions.ts`: `upsertPlan`, `patchSubscription`, `markInvoicePaid`, `createCoupon`.
- `workforce.functions.ts`: `updateLeaveStatus`, `createShift`, `lockTimesheet`.
- `support.functions.ts`: `patchTicket`, `upsertKbArticle`.
- `integrations.functions.ts`: `toggleIntegration`, `createApiKey`, `revokeApiKey`.
- `crm.functions.ts`: `updateLeadStatus`.

---

## 5. Auth context extension

`src/lib/auth.tsx`: extend the auth context with `permissions: Set<string>` (loaded once on sign-in via a new `getMyPermissions` server fn). Add `hasPermission(key: string): boolean` helper. Sidebar `nav-config.ts` gains an optional `permission?: string` field used by `filterNavForUser` to hide items the user can't access (graceful — `platform` flag still works as fallback).

---

## 6. Out of scope (future batches)

- Actual backup export worker (writes to storage bucket).
- Live IP-allowlist enforcement at the edge (only stored + displayed here).
- 2FA enrollment flow UI (toggle is stored; enrollment ships with auth-hardening batch).
- Session list / revoke (needs Supabase admin API edge function).

---

**On approval I'll execute the migration, ship `access.functions.ts` + `system.functions.ts`, replace all 8 stubs with live modules, and retrofit audit-log writes across the existing server functions.**