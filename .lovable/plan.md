# Free trial → enrolling employees: answer + help article

## Direct answer to your question

When you sign up, your account becomes the **owner / super-admin** of a new workspace. From there you enrol employees from the admin console — there is no separate trial activation step (the free tier is the default until you upgrade in Billing). The exact path:

1. **Sign up** at `/signup` with work email + password (or Google). First account on a workspace is auto-promoted to super-admin and linked to your company.
2. Confirm your email from the inbox link, then land on `/admin`.
3. Go to **Workforce → Employees** (`/admin/workforce/employees`) and click **Add employee** to create a record (name, work email, employment type, department, designation, joining date).
4. (Optional) Set up structure first under **Workforce → Departments / Designations / Teams / Shifts** so new employees can be slotted in cleanly.
5. **Access → Users** (`/admin/access/users`) — assign each new person a role (`employee`, `manager`, `hr`, etc.). Roles control what they see in the app.
6. Share the login URL with employees; they sign in with the same email and start clocking in via web or the mobile app.
7. Bulk option: use **Workforce → Employees → Import CSV** for large rosters (or paste from a spreadsheet).
8. Track usage and upgrade anytime from **Billing → Plans** when the trial limits no longer fit.

## Plan

### 1. Seed the help article in the database
Insert one published row into `kb_articles` so it shows up immediately at `/help` and `/help/enrolling-employees-on-free-trial`. Done via a small migration so it's reproducible across environments.

- **slug**: `enrolling-employees-on-free-trial`
- **title**: "How do I enrol employees on the free trial?"
- **category**: `Getting started`
- **status**: `published`, `published_at = now()`
- **excerpt**: One-sentence summary of the 7-step flow.
- **body**: HTML version of the steps above, with anchor links to `/admin/workforce/employees`, `/admin/access/users`, `/admin/workforce/departments`, `/admin/billing/plans`. Includes a short "What's included in the free trial" note and a "Need help? Contact support" CTA at the bottom.
- **seo_title / seo_description**: Punchly-branded variants per the brand naming rule.
- Idempotent: `insert … on conflict (slug) do update set …` so re-running the migration just refreshes the content.

### 2. Make sure "Getting started" category exists
Same migration also `insert … on conflict do nothing` into `kb_categories` for `getting-started` / "Getting started" so the category filter on `/help` lights up.

### 3. No code/UI changes required
The existing `/help` index, `/help/$slug` detail route, search, and feedback widget already render any published article. Once the row exists, the article is live — nothing to wire.

### 4. Verification
After the migration runs:
- `/help` lists the new card under "Getting started".
- `/help/enrolling-employees-on-free-trial` renders with TOC, related articles, and feedback widget.
- KB search for "trial" / "enrol" / "employee" surfaces it (matches via the existing `kb_search_articles` RPC).

## Technical details

- **Migration file**: `supabase/migrations/<timestamp>_seed_help_enrolling_employees.sql`
- **Tables touched**: `kb_categories` (insert if missing), `kb_articles` (upsert by `slug`).
- **No RLS changes** — public read of published articles already works via `listPublicKbArticles` / `getPublicKbArticle` server functions.
- **Brand**: title/body uses "Punchly" for the product surface; SEO title follows `Punchly — {Page} | Oqlio` per memory rule.
- **Body format**: HTML (matches existing KB renderer in `src/routes/help.$slug.tsx`).
