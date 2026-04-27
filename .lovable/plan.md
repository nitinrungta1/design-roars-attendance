# Fix: SaaS Overview "Cannot read properties of undefined (reading 'customers')"

## Root cause

In `src/routes/_authenticated.admin.index.tsx` line 180, the KPI grid renders:

```tsx
value={data?.counts[spec.key] ?? null}
```

The optional chain stops at `data?.counts`. When `data` is `null` (initial render, error path, or any case where the server function returns an unexpected shape), `data?.counts` evaluates to `undefined`, and the trailing `[spec.key]` access throws **"Cannot read properties of undefined (reading 'customers')"**. The route's `errorComponent` then catches it and shows the red "SaaS Overview failed to load" panel — masking what was actually a render bug, not a data-fetch failure.

A second contributing issue: the server function `getSaasOverview` is called via `useServerFn` with `fn({ data: undefined as never })`. If the server-side handler ever throws before returning (e.g. auth middleware rejects, or a Supabase call rejects outside the `safe()` wrapper), the catch sets `data = null` and the page should fall back to skeletons / em-dashes — but the unsafe property access prevents that graceful fallback.

## Changes

### 1. `src/routes/_authenticated.admin.index.tsx` — make all `data` reads null-safe

- Line 180: `data?.counts[spec.key]` → `data?.counts?.[spec.key]`
- Audit the rest of the file for the same pattern and fix any similar accesses (`data?.signupTrend`, `data?.recentLeads`, `data?.recentAudit` already use safe `?? []` / `?? 0` patterns and are fine).
- Tighten the `Counts` typing usage so this can't regress: change `KpiCard` to accept `value: number | null | undefined` and always render the em-dash placeholder when not a finite number.

### 2. `src/lib/admin-overview.functions.ts` — guarantee the response shape

- Wrap the entire handler body in a top-level `try/catch` that, on any unexpected throw, returns a fully-populated `OverviewPayload` with all `counts` keys set to `null`, empty `signupTrend`, and empty arrays. This ensures the client always receives a well-formed object even if Supabase or the auth middleware misbehaves.
- Log the underlying error to the server console so we can still diagnose.

### 3. Verification

After the fix:
- With no data / errors: page renders skeletons → em-dashes, no red error banner.
- With data: KPIs and charts render normally.
- The route's `errorComponent` is reserved for genuine render-time errors, not data shape issues.

## Out of scope

No schema or auth changes. No new dependencies. Purely a defensive-rendering fix.