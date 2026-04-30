# Stop guessing — seed real data and audit against it

## Why the current approach is burning credits

Every recent bug ("settings won't save", "users page crashes", "punchly card dead") has been fixed in isolation based on a single error message. That means:

- We never see the *next* error until you click the next button.
- Server functions silently use the wrong client (regular vs `supabaseAdmin`) and we only learn when an end-user action fails.
- There is no known-good test account, so we can't reproduce anything ourselves.

The fix is to create a real seed (user + company + Punchly rows), then walk every platform surface against it in **one** pass and patch everything found.

---

## Step 1 — Create a seed (one migration + one script)

Create a known test account so we (and you) can log in and reproduce every flow:

- **Auth user**: `test@oqlio.com` / `TestPass123!` — created via `supabaseAdmin.auth.admin.createUser` with `email_confirm: true`.
- **Role**: insert `super_admin` row in `user_roles` for that user (so we can hit every admin page).
- **Company**: ensure one row in `companies` with `is_default = true` named "Oqlio Test Co".
- **Platform settings**: ensure the singleton row in `platform_settings` exists (so the Settings save path has a row to update).
- **Punchly data**: 1 department, 1 designation, 2 employees, 1 shift, a few attendance rows for the last 7 days, 1 leave request, 1 holiday — just enough that every Punchly tab renders something instead of an empty state that hides errors.

Delivered as:
- One SQL migration for the company / settings / punchly rows (idempotent — `on conflict do nothing`).
- One server function `seedTestAccount()` (admin-only, idempotent) that creates the auth user + role and is callable once from a temporary `/admin/_seed` button or directly via `invoke-server-function`.

## Step 2 — Audit pass against the seed

With the seed in place, log in as `test@oqlio.com` and walk every platform surface in one go using `invoke-server-function` + `server-function-logs` + `browser--navigate_to_sandbox`. For each route, record: renders / 404 / 500 / wrong layout.

Routes to verify:

```text
/login                              → form renders, login works
/                                   → redirects to /home
/home                               → app launcher, all 3 cards
  ├─ click Punchly                  → /punchly → /admin/workforce
  ├─ click Users                    → /admin/users (PlatformShell, not Punchly sidebar)
  └─ click Settings                 → /admin/settings (PlatformShell, save works)
/admin                              → Punchly admin shell + workforce
/admin/workforce/*                  → every tab loads with seed data
/admin/users                        → list shows test user, no 500
/admin/settings                     → load + save returns ok:true
```

For every server function touched by these pages, confirm it uses the right client:
- User-scoped reads → `requireSupabaseAuth` middleware
- Admin reads of `auth.users` / cross-tenant data → `supabaseAdmin`
- Writes to singleton `platform_settings` → `supabaseAdmin`

## Step 3 — Fix everything found in one batch

Group all discovered bugs and fix in a single edit pass instead of one-per-message. Likely categories based on history:

- Server functions still using regular `supabase` for admin reads → swap to `supabaseAdmin`.
- Routes still wrapped in the wrong layout → rename to `_authenticated.admin_.*` (escape hatch) or move under `_authenticated.admin.*` (Punchly shell), depending on intent.
- Missing `errorComponent` on routes that can throw → add one that prints `error.message` so future failures are visible immediately.

## Step 4 — Leave the seed in place

Keep `test@oqlio.com` as a permanent fixture so future bugs can be reproduced in seconds without re-seeding.

---

## Technical notes

- The `seedTestAccount` server function will live at `src/lib/dev-seed.functions.ts` and be gated behind `process.env.NODE_ENV !== "production"` **plus** a check that the caller is already a super_admin — safe to ship.
- The migration only inserts into `companies`, `platform_settings`, and Punchly tables (`departments`, `designations`, `employees`, `shifts`, `attendance`, `leave_requests`, `holidays`). No schema changes, no RLS changes.
- After the audit, we'll publish a single summary listing every route checked, its status, and the fix applied — so you can see exactly what your credits bought.

---

## What I need from you

Just approve this plan. I'll then:
1. Run the migration (you'll get one approval prompt).
2. Run `seedTestAccount` once.
3. Do the full audit + fixes in one go and report back with the route-by-route table.

No more one-bug-at-a-time loops.