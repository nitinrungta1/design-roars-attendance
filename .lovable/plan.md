## Goal

Add a programmatic SEO engine to Oqlio that auto-generates city, industry, and city×industry landing pages for the Punchly attendance product — reusing the architecture already shipped in the **Designroars Launchpad** project (`/$service/$city` engine) so we don't rebuild the plumbing.

What gets reused vs. built fresh is the key question — answered below.

---

## What we reuse from Designroars (copy with light edits)

From project `Design Roars Launchpad` (id `0080d27b…`):

- `src/lib/cities.ts` — 100+ Indian cities with state + slug + nearby logic (`getNearbyCities`, `CITY_BY_SLUG`). Copy as-is.
- `src/lib/services.ts` — `Service` type, `fillTemplate`, `fillFaqs`, `fillTestimonials`, `builtInFallbacks`, `serviceCityUrl`. Copy and rename templates for attendance.
- `src/lib/city-defaults.ts` — per-city localized snippets (intro lines, nearby areas, business context). Copy and re-tone for attendance/HR.
- `src/components/services/service-city-template.tsx` — hero + pillars + body + FAQs + testimonials + nearby links + LocalBusiness/FAQ JSON-LD. Copy and re-skin with Oqlio's brand primitives (`GlassCard`, `Section`, `Container`, `Eyebrow`, `GradientText`).
- `src/routes/$service.$city.tsx` — dynamic loader pattern, reserved-slug guard, DB override merge, head() with FAQ + LocalBusiness JSON-LD. Adapt URL pattern (see below).
- Admin CMS routes (`admin._authed.services.*`, `admin._authed.cities.*`) — port simplified versions into our `_authenticated/admin/cms/seo-pages` area.
- Sitemap generator pattern from their `sitemap[.]xml.tsx`.

## What's new (Oqlio-specific)

1. **Industry dimension** — Designroars only does service×city. We need service×city, service×industry, and service×industry×city. Adds an `industries` table + `IndustryPage` overrides table parallel to `city_pages`.
2. **URL patterns** matching user spec (not Designroars' `/$service/$city`):
   - `/best-{service}-in-{city}` → e.g. `/best-attendance-management-software-in-delhi`
   - `/{service}-for-{industry}` → e.g. `/attendance-software-for-restaurants`
   - `/best-{service}-for-{industry}-in-{city}` → e.g. `/best-attendance-management-software-for-restaurants-in-delhi`
   Implemented as **three splat routes** that parse the slug pattern, because TanStack file routing can't natively express `for-X-in-Y` segments.
3. **Attendance-flavored content blocks**: industry pain points (restaurants → shift staff/late-night, construction → site/geo, schools → timetable sync), feature pillars (GPS, geofence, shift scheduling, timesheets, payroll, overtime), localized "why Oqlio in {city}" copy.

---

## Database (Lovable Cloud migration)

New tables under `public`:

- `seo_services` — slug, name, noun, tagline, default_*_tpl fields, default_faqs (jsonb), default_testimonials (jsonb), status. Seeded with: attendance-management-software, employee-management-software, gps-attendance-software, employee-tracking-software, time-tracking-software, biometric-attendance-software.
- `seo_industries` — slug, name, noun, hero_blurb, pain_points (jsonb), use_cases (jsonb), default_faqs (jsonb), status. Seeded with: restaurants, retail-stores, schools, hospitals, construction-companies, logistics-companies, hotels, manufacturing, it-services, bpos.
- `seo_city_pages` — (service_id, city_slug) overrides: meta_title, meta_description, h1, hero_intro, cta_text, body_html, faqs jsonb, testimonials jsonb, nearby_slugs text[], status.
- `seo_industry_pages` — (service_id, industry_slug) overrides: same shape minus nearby.
- `seo_industry_city_pages` — (service_id, industry_slug, city_slug) overrides.

RLS: public read of `status='published'`; admin write gated by existing `requirePermission("admin.cms.manage")` (super_admin already passes). No PII; safe to publicly read.

Cities stay in `src/lib/cities.ts` (static, no admin churn needed — same as Designroars).

---

## Routes (`src/routes/`)

Three new dynamic page routes plus the admin CMS:

```text
src/routes/
  best-$service-in-$city.tsx              // "/best-attendance-management-software-in-delhi"
  $service-for-$industry.tsx              // "/attendance-software-for-restaurants"
  best-$service-for-$industry-in-$city.tsx // composite
  _authenticated/admin/cms/seo.services.tsx
  _authenticated/admin/cms/seo.services.$slug.tsx
  _authenticated/admin/cms/seo.industries.tsx
  _authenticated/admin/cms/seo.industries.$slug.tsx
  _authenticated/admin/cms/seo.city-pages.tsx
  _authenticated/admin/cms/seo.industry-pages.tsx
```

TanStack note: TanStack file routing uses literal segments with `$param` inside one segment. `best-$service-in-$city.tsx` parses fine because `-in-` is a literal separator between two params in the same path. We'll add a `notFound()` guard in the loader for unknown service/industry slugs to avoid swallowing real top-level routes — and add the new slug prefixes (`best-…`, `attendance-software-for-…`) to a reserved list so the existing static marketing routes (`/attendance-management-system`, etc.) keep winning.

Each route's loader:
1. Parse params → look up service / industry / city.
2. Query the matching overrides table (`seo_*_pages`) for published row.
3. Merge: override → template-filled defaults → built-in fallbacks (same merge order as Designroars).
4. Return DTO with `metaTitle`, `metaDescription`, `h1`, `heroIntro`, `ctaText`, `bodyHtml`, `faqs`, `testimonials`, `nearby`, plus structured-data inputs.

Each route's `head()` emits per-page title, description, canonical, og:*, Twitter, plus JSON-LD: `SoftwareApplication` (Punchly), `LocalBusiness` (city pages only), `FAQPage`, `BreadcrumbList`.

---

## Shared template component

`src/components/marketing/seo-landing-template.tsx` — one reusable Awwwards-style template wired with brand tokens. Sections:

1. Hero (eyebrow, gradient H1, sub, dual CTA → `/demo`)
2. "Why {city|industry} teams need this" — localized copy
3. Feature pillars (6 cards using existing `GlassCard` + lucide icons)
4. Industry pain-points (rendered when industry present)
5. Why Oqlio in {city|industry} (testimonials carousel reusing existing testimonial component)
6. FAQ accordion (reuses pattern from `FeaturePage`)
7. Internal-link cluster (nearby cities + sibling industries — auto-generated)
8. Final CTA banner (existing `CtaBanner`)

Reuses existing brand primitives: `Container`, `Section`, `Eyebrow`, `GradientText`, `GlassCard`, `Button`, `CtaBanner` so the look stays on-brand and we add zero new design tokens.

---

## Admin CMS

Under `/admin/cms/seo/*` (gated by existing `requirePermission`):

- **Services**: list, edit templates (meta title/desc tpl, H1 tpl, hero intro tpl, CTA tpl), edit default FAQs/testimonials, toggle status. Inline preview of `{city}`/`{industry}` interpolation.
- **Industries**: list, edit name/noun/hero blurb/pain points/use cases/default FAQs, toggle status.
- **City pages** & **Industry pages** & **Industry-city pages**: searchable table of all (service × city|industry) combinations with status badge. Per-row drawer to edit overrides (meta_title, meta_description, h1, hero_intro, cta_text, body_html, faqs, testimonials, nearby_slugs) and publish/unpublish. Bulk publish/unpublish.

Server functions in `src/lib/seo-pages.functions.ts` (`createServerFn` + `requirePermission("admin.cms.manage")`): list/get/upsert/toggle for each entity.

---

## Sitemap automation

Update `src/routes/sitemap-pages[.]xml.tsx`:

- Keep the existing static marketing routes.
- Add a `getServiceCityIndex()` server helper that returns the cross product of `seo_services` × `CITIES` × (industries optional) for rows where the *override* is published **and** for rows where no override exists but the service is published (defaults are valid pages). Cap at a reasonable per-sitemap size; if total > 5,000 split into `sitemap-seo.xml` chunks and reference from the existing `sitemap.xml` index.
- Per-row `<loc>` uses the URL builder helpers (`bestServiceInCityUrl`, `serviceForIndustryUrl`, `bestServiceForIndustryInCityUrl`).

---

## Content quality guardrails (avoid thin/duplicate pages)

In `src/lib/seo-content.ts` we generate per-page deterministic variation from `(service, industry?, city?)` so two pages never share identical body copy:

- Intro paragraph is composed from a small pool of openers × city-specific opener × industry-specific opener (Designroars uses this pattern in `city-defaults.ts`).
- Pain-points list pulled from the industry row.
- Stats line uses `city.state` and a stable hash to pick from a curated list ("Used by 120+ {city} teams" etc., flagged as illustrative until real data exists — we can swap for live counts later).
- FAQs interpolate `{city}`, `{state}`, `{industry}` via existing `fillFaqs`.

---

## Out of scope for this build

- Backfilling real testimonials per city (use service-level defaults).
- Realtime visitor counts.
- Bulk content generation via AI — admins can add it later; engine supports it via overrides.
- Migrating the static `/attendance-management-system`, `/biometric-attendance-software`, etc. routes into the new engine. They keep their hand-written content.

---

## Implementation order (one batch each)

1. Migration: create the 5 `seo_*` tables + RLS + seed services and industries.
2. Copy & adapt `cities.ts`, `services.ts`, `city-defaults.ts` from Designroars; add `industries.ts` + URL builders + content helper.
3. Build `SeoLandingTemplate` and the three dynamic route files with full `head()` + JSON-LD.
4. Build the admin CMS (services / industries / overrides editors) + server functions.
5. Wire sitemap (`sitemap-seo.xml` chunked if needed) and add to `sitemap.xml` index.
6. Smoke test 3 sample URLs and verify SEO findings.

---

## Open questions before I build

1. **Geography**: Designroars ships ~100 Indian cities. Confirm Oqlio targets India-only (or do you want US/UK cities too in v1)?
2. **Industries v1 list** — is the seed list above good, or do you want a different set (e.g. add healthcare, education-K12 vs colleges separately)?
3. **Static routes priority**: should `/attendance-management-system` etc. keep beating the engine for `/best-attendance-management-software-in-delhi` style URLs? My plan keeps them separate (different slugs) so there's no conflict — confirm that's fine.
