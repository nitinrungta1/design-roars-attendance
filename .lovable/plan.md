# Option B: Fix dashboard crash + make permissions actually enforce

## 1. Dashboard crash (small, safe)

`src/routes/_authenticated.admin.index.tsx` reads `data?.recentLeads.length` and `data?.recentAudit.length` — `?.` only protects `data`, not the arrays. When the server payload returns the empty fallback, `.length` throws "Cannot read properties of undefined".

**Fix:** change all four occurrences to `data?.recentLeads?.length ?? 0` / `data?.recentAudit?.length ?? 0` and the two `data!.recentLeads.map(...)` / `data!.recentAudit.map(...)` to `(data?.recentLeads ?? []).map(...)`.

## 2. Make the Permission Matrix actually enforce access

Today the matrix UI writes to `role_permissions` but **nothing reads it** — pages and server functions are gated by role flags only. After this change, toggling a permission immediately controls who can see and use that area.

### 2a. Server-side enforcement (new helper + applied per function)

New file `src/lib/permissions.server.ts` (or appended to `auth-middleware.ts`): a `requirePermission(key)` factory that wraps `requireSupabaseAuth` and additionally calls `supabase.rpc("has_permission", { _user_id: userId, _key: key })`. If false → throw `Response(403, "Permission denied: <key>")`.

Apply `requirePermission(...)` to the following groups (same key as in the matrix):

| Module | Functions | Required key |
|---|---|---|
| Access | `listPlatformUsers`, `createPlatformUser`, `assignRole`, `revokeRole`, `listRolesWithCounts`, `listPermissionMatrix`, `togglePermission`, `listTeams`, `createTeam`, `deleteTeam`, `addTeamMember`, `removeTeamMember`, `listCompaniesLite`, `setUserAccess` | `access.users.read` for reads, `access.users.write` for writes, `access.roles.write` for matrix toggle, `access.teams.write` for teams |
| Billing | every `*.functions.ts` write fn | `billing.<area>.write` (read fns: `billing.<area>.read`) |
| CMS | pages/blogs/seo/forms/media writes | `cms.<area>.write` |
| Customers | companies/contacts/usage | `customers.<area>.read|write` |
| Leads / CRM | reads/writes | `leads.read|write` |
| Support | tickets/kb/chat | `support.tickets.*` / `support.kb.write` |
| Workforce admin functions | matching `workforce.*` keys |
| Integrations | reads/writes | `integrations.read|write` (`.webhooks.write`, `.apikeys.write`) |
| System | settings/audit/backups/security | `system.*.read|write` |
| Analytics | reads | `analytics.read` |

`super_admin` always passes (the SQL `has_permission` doesn't include super_admin bypass — I'll either add a super_admin shortcut in `requirePermission` JS-side, or grant all keys to super_admin in DB; I'll do the JS shortcut so the matrix stays accurate).

Personal/self-service reads (e.g. `getMyPermissions`, things scoped only to `auth.uid()`) stay on plain `requireSupabaseAuth`.

### 2b. Client-side enforcement (route guards + nav)

- **`src/components/admin/nav-config.ts`**: add `permission?: string` to `NavItem`. Set the right key on every item (e.g. `/admin/access/users` → `access.users.read`, `/admin/billing/invoices` → `billing.invoices.read`, etc.). Drop the `platform` flag in favor of permission-based filtering.
- **`filterNavForUser`**: change signature to `(opts: { hasPermission: (k: string) => boolean; isSuperAdmin: boolean })`. Items with no `permission` are visible to anyone authenticated. Items with a `permission` are visible only if `hasPermission(key)` (super_admin always passes — already true in `useAuth`).
- **`src/components/admin/admin-shell.tsx`**: pass `hasPermission` and `isSuperAdmin` instead of `isAdmin/isSuperAdmin`.
- **Per-route guard**: add a small `useRequirePermission(key)` hook that, when the user lacks the permission, renders a "Permission required" empty state instead of the page body. Apply to each admin route (one-line: `const blocked = useRequirePermission("billing.plans.read"); if (blocked) return blocked;` at the top of the page component). This protects against direct URL access — the server function already returns 403 too, so the page can't actually load data without permission.

### 2c. Live cache refresh

After `togglePermission` succeeds in `_authenticated.admin.access.permissions.tsx`, also call `auth.refresh()` so if the admin toggled their own role's permissions, nav/route gates update without a reload.

## Files touched

- `src/routes/_authenticated.admin.index.tsx` — crash fix
- `src/lib/permissions.server.ts` — new `requirePermission(key)` middleware factory
- `src/lib/access.functions.ts` — apply `requirePermission` to all admin fns
- `src/lib/billing.functions.ts`, `cms.functions.ts`, `customers.functions.ts`, `leads.functions.ts`, `support.functions.ts`, `kb-admin.functions.ts`, `integrations.functions.ts`, `system.functions.ts`, `workforce*.functions.ts`, `analytics-queries.ts`, `admin-overview.functions.ts` — apply `requirePermission` per function
- `src/components/admin/nav-config.ts` — add `permission` to each item, change `filterNavForUser` signature
- `src/components/admin/admin-shell.tsx` — pass `hasPermission`/`isSuperAdmin`
- New: `src/hooks/use-require-permission.tsx` — render-blocking gate for admin pages
- All `src/routes/_authenticated.admin.*.tsx` route files — one-line permission gate at top of each component
- `src/routes/_authenticated.admin.access.permissions.tsx` — call `auth.refresh()` after toggle

## What you'll see after

- The red "SaaS Overview failed to load" banner is gone.
- The Permission Matrix is no longer decorative — toggling a permission immediately removes/adds the corresponding nav item, route, and server data for users in that role (super_admin always retains everything).
- Direct URL access to a page the user lacks permission for shows a "Permission required" panel instead of loading.
- Server functions return 403 if a non-permitted user calls them via API.
