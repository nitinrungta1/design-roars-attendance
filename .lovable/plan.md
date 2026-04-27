# Fix "Something went wrong" on /admin (SaaS Overview)

## What's happening

The screen you saw is the router's **`DefaultErrorComponent`** in `src/router.tsx`. It renders whenever a route component throws during render (or a server function rejects in a way the page doesn't handle).

The current console logs only show harmless Grammarly hydration warnings — the actual stack trace was swallowed because:

1. `DefaultErrorComponent` only shows `error.message` in **dev mode**, never the stack.
2. `SaasOverview` calls `getSaasOverview` and `.catch(() => setData(null))` silently, so server-side errors are hidden.
3. No `errorComponent` / `notFoundComponent` is defined on `_authenticated/admin/` or `_authenticated/admin/index`, so any throw bubbles to the router default.

I inspected the page (`src/routes/_authenticated.admin.index.tsx`), the server function (`src/lib/admin-overview.functions.ts`), and the DB — all 4 tables it reads (`companies`, `leads`, `demo_requests`, `audit_logs`) exist, and the recent `plans` migration didn't touch them. So the most likely cause is one of:

- A transient server-function failure (e.g. cold start / auth middleware) that the page now treats as fatal somewhere downstream.
- A rendering issue when `data` is non-null but a nested field is the wrong shape (e.g. `recentLeads` / `recentAudit` items missing a field).
- An auth-context race (e.g. `profile?.full_name?.split` on a non-string).

## Fix plan

### 1. Surface the real error (so we stop guessing)

- `src/router.tsx` — `DefaultErrorComponent`: also show `error.stack` (truncated) in dev, and `console.error(error)` so it always lands in console logs.
- `src/routes/_authenticated.admin.index.tsx`: replace the silent `.catch(() => setData(null))` with `.catch((err) => { console.error("getSaasOverview failed", err); setError(err); })` and render an inline error banner instead of throwing.

### 2. Add proper boundaries to the admin tree

Per project rules (every route with data loading needs both), add to:

- `src/routes/_authenticated.admin.tsx` — `errorComponent` + `notFoundComponent`.
- `src/routes/_authenticated.admin.index.tsx` — `errorComponent` + `notFoundComponent`.

These render inside `AdminShell` so the user keeps the sidebar / header instead of a full-page wipe.

### 3. Harden `SaasOverview` render path

- Guard `profile?.full_name?.split(" ")[0]` against non-string values.
- Defensive defaults for `data.signupTrend`, `data.recentLeads`, `data.recentAudit` (already coalesced, but tighten typings on the recharts `dataKey`).
- Wrap the recharts `AreaChart` in an `ErrorBoundary` style fallback (recharts can throw on first SSR pass with an empty array on certain Node versions).

### 4. Harden the server function

In `src/lib/admin-overview.functions.ts`:

- Wrap each of the 6 parallel queries in a per-query `try/catch` so one failure (e.g. a missing column or RLS deny) doesn't reject the whole `Promise.all` and 500 the endpoint.
- Log structured errors (`console.error("[saas-overview] companies", err)`) so they show up in server function logs.
- Always return a complete `OverviewPayload` shape with `null` counts on partial failure.

### 5. Verify and ship

After patching, refresh `/admin`. If the error is gone → done. If it returns, the new logs will name the exact culprit (server function name, query, or React component) and we can apply a targeted fix.

## Technical notes

- Files to edit: `src/router.tsx`, `src/routes/_authenticated.admin.tsx`, `src/routes/_authenticated.admin.index.tsx`, `src/lib/admin-overview.functions.ts`.
- No DB migration needed — all referenced tables/columns exist.
- No new dependencies.
- No changes to auth / RLS.

Approve and I'll implement.
