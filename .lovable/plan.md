## Where things stand

The dynamic page routes for the programmatic SEO engine are already in place:

- `src/routes/best-{$slug}.tsx` handles `/best-{service}-in-{city}` and `/best-{service}-for-{industry}-in-{city}` by parsing the slug.
- `src/routes/$pageSlug.tsx` was extended so any single-segment URL containing `-for-` is first tried as `/{service}-for-{industry}` via `resolveServiceIndustry`, and falls back to the CMS page lookup otherwise.
- The resolvers, shared `SeoLandingTemplate`, content fallbacks, cities, and DB tables (`seo_services`, `seo_industries`, `seo_city_pages`, `seo_industry_pages`, `seo_industry_city_pages`) already exist and are seeded with 6 services and 10 industries.
- `sitemap-seo.xml` route exists but is **not** referenced from the sitemap index or robots, so Google can't discover the pages yet.
- There is no admin UI to edit services, industries, or per-page overrides — only a global `/_authenticated/admin/cms/seo` config page.

## What this plan ships

### 1. Make the engine discoverable

- Add `<sitemap><loc>https://oqlio.com/sitemap-seo.xml</loc></sitemap>` to `src/routes/sitemap[.]xml.tsx` so the new URLs are crawled.
- Add `Sitemap: https://oqlio.com/sitemap-seo.xml` to `src/routes/robots[.]txt.tsx`.

### 2. Harden the splat parsing

- In `best-{$slug}.tsx`, treat any unparseable slug as `notFound()` (already done) and let TanStack render the route's notFoundComponent.
- In `$pageSlug.tsx`, if the SEO resolve throws, fall through to CMS (already done) — verify the order so `/about`, `/pricing`, etc. (real top-level routes) are never reached by `$pageSlug` because they're statically defined and win route matching.
- Add a small reserved-prefix guard inside `best-{$slug}` so values like `best-practices` don't accidentally resolve.

### 3. Admin CMS for SEO content

Add four nested routes under the existing admin shell (gated by `requirePermission("admin.cms.manage")` which super_admin already has):

```text
src/routes/_authenticated.admin.cms.seo.services.tsx          // list + create
src/routes/_authenticated.admin.cms.seo.services.$slug.tsx    // edit one service: templates + default FAQs/testimonials
src/routes/_authenticated.admin.cms.seo.industries.tsx        // list + create
src/routes/_authenticated.admin.cms.seo.industries.$slug.tsx  // edit one industry: pain points, use cases, FAQs
src/routes/_authenticated.admin.cms.seo.overrides.tsx         // per-page overrides browser (city / industry / industry+city tabs)
```

Backing server functions in a new `src/lib/seo-admin.functions.ts`:

- `listSeoServices`, `upsertSeoService`, `deleteSeoService`
- `listSeoIndustries`, `upsertSeoIndustry`, `deleteSeoIndustry`
- `listSeoOverrides({ kind })`, `upsertSeoOverride({ kind, ... })`, `deleteSeoOverride`

All use `createServerFn` + `requirePermission` middleware and write through `supabase` (RLS already restricts to admins).

Update the existing `_authenticated.admin.cms.seo.tsx` page to add a tab strip or link block pointing to the four new sub-pages so admins can find them.

### 4. Smoke verification

After the migration types pick up the new tables, hit two URLs in the preview to confirm the engine end-to-end:

- `/best-attendance-management-software-in-delhi` → renders city page.
- `/attendance-management-software-for-restaurants` → renders industry page via `$pageSlug`.

If a resolver returns `notFound`, that means the seed for that `service_slug` / `industry_slug` is missing — surface a clear error in the loader rather than a blank page.

## Out of scope

- Backfilling real city/industry override copy (admin can do this through the new CMS).
- Migrating the legacy static routes (`/attendance-management-system`, etc.) into the engine — they keep winning over the splat as the spec asks.
- Bulk AI content generation for the seeded combinations.

## Open question

Should the admin CMS overrides editor be a single grid (filter by service + kind) or three separate tabs (city / industry / city+industry)? I'm proposing the latter because the column sets differ (city pages have `nearby_slugs`, others don't), but happy to do a single grid with conditional columns if you prefer fewer pages.
