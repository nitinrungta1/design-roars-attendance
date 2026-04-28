# Fix Help Center / Knowledge Base admin issues

## What's broken

You reported two issues on `/admin/support/kb`:

1. **Articles list is empty** — even though the database has 30+ published articles.
2. **"New article" button does nothing** — clicking it doesn't open the editor (or the form silently fails to save).

## What I found

### Database & data
- 30+ published articles exist in `kb_articles` (verified directly).
- RLS allows admins/super_admins to read all rows, and the public to read `published` ones. So the `SELECT` itself is not the blocker for an authed admin.
- Both signed-in users (`muskan@…`, `nitin@…`) have the `super_admin` role, and `is_admin()` includes super_admin — so RLS reads + writes should succeed.

### Likely root causes (high confidence)
1. **Server function silently swallows errors.** `adminListKbArticles` does:
   ```ts
   if (error) { console.error(...); return { articles: [] }; }
   ```
   So any column / order mismatch returns an empty list with no UI feedback. This pattern is what makes the page look "blank" instead of showing the real cause. We need the error surfaced.

2. **"New article" CTA navigates to `/admin/support/kb/new`, but two things can break the user-visible flow:**
   - The link only renders when the user has the `support.kb.write` permission (nav gating). If the permission is missing on the role, the entire **Knowledge Base** entry disappears from the sidebar (and the New button's parent group is hidden), making the CTA "not work."
   - The new-article form posts via `useServerFn(upsertKbArticle)`. If the server throws (RLS/insert error), the toast shows, but if the server *route* itself isn't reachable (mis-cached client) the click looks dead. We'll add console logging + a hard navigation fallback.

3. **Permission key mismatch in the sidebar.** `nav-config.ts` gates the KB entry on `support.kb.write`, but there is no `support.kb.read` permission — only `support.kb.write`, `support.tickets.read`, `support.tickets.write` exist. If a role has read-only KB access, they can't see the link at all. The nav should gate on a *read* permission and we should add `support.kb.read`.

## Plan

### 1. Surface real errors in the KB admin server functions
- In `src/lib/kb-admin.functions.ts`:
  - Stop swallowing errors in `adminListKbArticles`, `adminGetKbArticle`, `listKbCategories`, `listKbFeedback`. Throw a `Response` with the Postgres error message so the UI shows what's wrong instead of an empty table.
  - Keep `console.error` for server logs.

### 2. Fix the KB list page to show errors and handle loading robustly
- In `src/routes/_authenticated.admin.support.kb.tsx`:
  - Use `useQuery`'s `error` state and render an inline error block (red banner) with the message + a Retry button.
  - Differentiate "loading" vs "no rows" vs "error" states properly.
  - Verify the columns selected match the DB schema (they do today, but lock it down).

### 3. Fix the "New article" CTA
- In `src/routes/_authenticated.admin.support.kb.tsx`:
  - Wrap the New article button in the `Link` correctly (already correct) — but also add an `onClick` log + use `useNavigate` as a programmatic fallback so a stale router state can't dead-click.
- In `src/routes/_authenticated.admin.support.kb.new.tsx`:
  - Surface server errors better: keep `toast.error(res.error)` but also `console.error` the raw response; add a visible inline error message under the form.
  - Auto-focus the title input.

### 4. Fix permission gating so the link actually shows
- Add a new permission `support.kb.read` (migration):
  - Insert into `permissions` table with description.
  - Grant it to roles that previously held `support.kb.write` (admin, support, etc.).
- In `src/components/admin/nav-config.ts`:
  - Change the `Knowledge Base` entry gate from `support.kb.write` → `support.kb.read` so read-only roles can open the page; the New button itself stays for `write`-level users.
- In `src/routes/_authenticated.admin.support.kb.tsx`:
  - Hide the **New article** button (and similar mutators) for users without `support.kb.write`, using the existing `useRequirePermission`/`hasPermission` helper pattern from access pages.

### 5. Confirm RLS still works for super_admin
- No RLS migration needed. Existing policies already allow super_admin via `is_admin()`. We only add a permission row (RBAC layer used by the UI), not an RLS change.

### 6. Quick sanity checks
- After deploy, the list will either:
  - Show the existing 30+ rows (expected), or
  - Show a clear red error banner with the Postgres reason — which we can fix in a follow-up turn.
- Clicking **New article** will navigate to `/admin/support/kb/new`. Saving a draft will either succeed and redirect, or display the exact error inline.

## Files I'll touch

- `src/lib/kb-admin.functions.ts` — error propagation
- `src/routes/_authenticated.admin.support.kb.tsx` — error/loading UX, CTA fallback, permission-gated New button
- `src/routes/_authenticated.admin.support.kb.new.tsx` — error visibility, autofocus
- `src/components/admin/nav-config.ts` — gate KB on `support.kb.read`
- New migration in `supabase/migrations/` — register `support.kb.read` permission and grant to existing roles

## Out of scope
- No DB schema changes to `kb_articles`.
- No changes to public help center routes (`/help/*`).
- No changes to KB categories / feedback / analytics pages beyond the shared error-surfacing in their list functions.

Approve this and I'll implement it in one pass.