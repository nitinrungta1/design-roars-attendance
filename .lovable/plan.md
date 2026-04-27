# Help Centre / Knowledge Base — `help.oqlio.com`

## What already exists (reuse, don't rebuild)

- **DB tables**: `kb_articles` (slug, title, excerpt, body, category, category_id, status, seo_title, seo_description, view_count, helpful_count, unhelpful_count, position, published_at), `kb_categories`, `support_tickets`, `support_ticket_messages`, `support_sla_policies`, `support_macros`.
- **DB RPCs**: `kb_record_view`, `kb_record_vote`, `assign_ticket_sla` trigger.
- **Public routes**: `/help` (list + search + category filter) and `/help/$slug` (article + vote + SEO head) — already wired to `listPublicKbArticles`, `getPublicKbArticle`, `voteKbArticle`.
- **Public ticket submission**: `submitSupportTicket` + `TicketForm` on `/contact`.
- **Admin shell + nav**: `/admin/support/{tickets,chat,kb,sla}` exist; `kb` page is read-only list only.

## Gaps to close

### 1. Host on `help.oqlio.com` subdomain
The same TanStack app serves the subdomain. Add subdomain-aware routing so requests to `help.oqlio.com` land directly on the help center experience.

- New `src/lib/host.ts` helper: detect `help.` subdomain from request headers (server) and `window.location.hostname` (client).
- Update `src/routes/__root.tsx`: when host is `help.*`, rewrite `/` → `/help` via `<Navigate>` (client) and a server-side redirect in the root loader (SSR).
- Update `src/routes/help.tsx` and `/help/$slug` `seo()` calls to emit canonical URLs as `https://help.oqlio.com/...` (article slug becomes root path on the subdomain) when host is `help.*`.
- New `/sitemap-help.xml` route emitting only published KB articles + categories with `https://help.oqlio.com/<slug>` URLs. Add link from existing `/sitemap.xml`.
- Update `robots.txt` route to allow help subdomain crawling.
- **User action required**: connect `help.oqlio.com` CNAME in Project Settings → Domains (we'll surface a `<lov-add-domain>` action after build).

### 2. Premium public Help Centre UI upgrade
`/help` exists but is minimal. Upgrade to match Notion/Intercom polish:

- **Hero**: gradient background, large search with instant dropdown results (debounced client-side filter over loaded articles + server search for >50 results), keyboard nav (↑ ↓ ⏎), recent searches in localStorage.
- **Category grid** (above current chip list): 8 branded category cards with icons (Getting Started, Attendance, Workforce, Timesheets, Billing & Pricing, Admin Settings, Mobile App, Troubleshooting, Integrations), article counts, hover lift.
- **Popular articles** strip (top 6 by `view_count`).
- **Article page** additions:
  - Sidebar TOC auto-built from `<h2>/<h3>` in body
  - Reading time (words / 200)
  - "Last updated" date (already in data)
  - Related articles (same category, top 4 by views)
  - Feedback widget — keep yes/no, add optional comment textarea on "No" → stored in new `article_feedback` table
  - Breadcrumb: Home → Category → Article
  - JSON-LD Article + FAQ schema
- **Dark/light mode**: already in app; ensure help routes inherit toggle.

### 3. New tables
Migration adds:
```sql
-- Per-article free-text feedback (votes already in kb_articles counters)
create table public.kb_article_feedback (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references kb_articles(id) on delete cascade,
  slug text not null,
  helpful boolean not null,
  comment text,
  user_agent text,
  created_at timestamptz default now()
);

-- Search analytics
create table public.kb_search_logs (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  results_count int not null default 0,
  clicked_slug text,
  user_id uuid,
  created_at timestamptz default now()
);
create index on kb_search_logs (lower(query));
create index on kb_search_logs (created_at desc);

-- Article ↔ tag many-to-many
create table public.kb_article_tags (
  article_id uuid references kb_articles(id) on delete cascade,
  tag text not null,
  primary key (article_id, tag)
);
```
RLS: public insert allowed on `kb_article_feedback` and `kb_search_logs` (anti-spam via rate limit in handler); admin/staff-only select.

### 4. Admin CMS (replace stub `/admin/support/kb`)
Build a real CMS using existing `admin-shell` + `cms-shell` patterns:

- **`/admin/support/kb`** — articles list with filters (status, category, search), bulk publish/unpublish, reorder via drag (uses `position` column).
- **`/admin/support/kb/new`** and **`/admin/support/kb/$id`** — editor with:
  - Title, slug (auto from title), category select, tags (chip input → `kb_article_tags`), excerpt, body (rich text via existing `Textarea` + markdown preview tab; defer full WYSIWYG), SEO title/desc, status (draft/published), schedule publish (`published_at` future date), screenshot URL helper.
- **`/admin/support/kb/categories`** — CRUD on `kb_categories` with reorder.
- **`/admin/support/kb/feedback`** — table of `kb_article_feedback` joined with article title; sort by recent / negative.
- **`/admin/support/kb/analytics`** — dashboard:
  - Top 20 searches (count, avg results)
  - No-result searches (results_count = 0) — flag as "create article" opportunities
  - Top viewed articles (kb_articles.view_count)
  - Worst-rated (helpful_count / (helpful+unhelpful) ratio with min 5 votes)
  - Total tickets vs total article views (deflection ratio)
- New nav-config entries under Support → KB.

### 5. Server functions
New `src/lib/kb-admin.functions.ts` (auth-protected, requires staff role via existing `requireSupabaseAuth` + role check):
- `adminListKbArticles`, `adminGetKbArticle`, `upsertKbArticle`, `deleteKbArticle`, `reorderKbArticles`
- `listKbCategories`, `upsertKbCategory`, `deleteKbCategory`
- `listKbFeedback`, `getKbAnalytics`

Extend `src/lib/public-help.functions.ts`:
- `logKbSearch({ query, results_count, clicked_slug? })` — public, called from search box.
- `submitKbFeedback({ slug, helpful, comment? })` — public, inserts into `kb_article_feedback` AND calls existing `kb_record_vote` RPC.
- `listRelatedArticles({ slug })` — same category, top 4 by views.

### 6. Smart support deflection
Update `/contact` `TicketForm`:
- As user types in **subject** (debounced 300ms), call new `searchKbArticles({ q })` server fn.
- Show top-3 matching articles inline above submit button: "These help articles might solve your issue".
- If user clicks an article (opens new tab), don't block submission.
- Track which suggestions were shown vs clicked (extra column in `support_tickets.metadata.suggested_articles`).

### 7. Per-ticket "related docs" on resolution
When admin marks ticket `resolved` in `/admin/support/tickets`, after-action panel suggests linking 1-3 KB articles to send to requester. Stores in `support_tickets.metadata.related_articles`.

## Out of scope (called out as "future ready" in brief)
- AI chatbot trained on docs
- Multi-language i18n
- Versioned docs / release notes module
- In-app weekly insights email automation

These are noted as v2 — not built now.

## Technical details

- **Subdomain SSR**: read `request.headers.get("host")` in `__root.tsx` `loader`/`beforeLoad`; set route context `{ isHelpHost: true }`. When true and pathname is `/`, throw `redirect({ to: "/help" })`. Marketing header/footer hidden on help host (use existing `MarketingLayout` with a `compact` prop or a new `HelpLayout`).
- **Canonical URLs on help host**: `seo()` helper extended with optional `host` arg; defaults to `oqlio.com` but emits `help.oqlio.com` and rewrites `/help/foo` → `/foo` paths when on the subdomain. Both URLs serve identical content; canonical points to subdomain to avoid duplicate-content penalties.
- **Search**: server fn uses Postgres `ilike` over title + excerpt + body with `plainto_tsquery` fallback for typo-light matching. No external search service.
- **Rate limiting**: `kb_search_logs` insert capped to 30/min per IP via simple in-memory token bucket in the handler (best-effort; OK for analytics).
- **Roles**: reuse existing `app_role` enum. Writers/Managers/Admins map to existing `employee` (no write), `support` (new role — added to enum) and `admin`. Add `support` role + RLS policies on KB tables.
- **Migrations**: 1 new file — tables above + RLS + `support` role enum value + indexes + sitemap helper.
- **Files created** (~14):
  - `src/lib/host.ts`, `src/lib/kb-admin.functions.ts`
  - `src/components/help/help-layout.tsx`, `help-search.tsx`, `category-card.tsx`, `article-toc.tsx`, `feedback-widget.tsx`, `deflection-suggestions.tsx`
  - `src/routes/sitemap-help[.]xml.tsx`
  - `src/routes/_authenticated.admin.support.kb.new.tsx`, `_authenticated.admin.support.kb.$id.tsx`, `_authenticated.admin.support.kb.categories.tsx`, `_authenticated.admin.support.kb.feedback.tsx`, `_authenticated.admin.support.kb.analytics.tsx`
- **Files edited** (~8): `__root.tsx`, `seo.ts`, `help.tsx`, `help.$slug.tsx`, `public-help.functions.ts`, `contact.tsx` + `forms.tsx`, `nav-config.ts`, `_authenticated.admin.support.kb.tsx` (becomes the list with toolbar), `_authenticated.admin.support.tickets.tsx` (related-articles panel).

## Delivery order
1. Migration (new tables, role, RLS) + subdomain routing + sitemap.
2. Public UI upgrade (hero, categories, instant search, TOC, related, feedback v2).
3. Admin CMS (list → editor → categories → feedback → analytics).
4. Deflection on `/contact` + ticket resolution related-docs.

After build I'll surface a "Connect help.oqlio.com" action so you can add the subdomain in one click.