# Fix SEO override save error

## Problem
The admin override editor saves fields like `ctaText`, `metaTitle`, `metaDescription`, `heroIntro`, but the DB columns are `cta_text`, `meta_title`, `meta_description`, `hero_intro`. Postgres rejects the upsert: *"Could not find the 'ctaText' column of 'seo_industry_city_pages'"*. The same mismatch silently makes resolved page reads ignore the override values.

## Fix

### 1. `src/lib/seo-admin.functions.ts`
In `upsertSeoOverride.handler`, translate the validated input to snake_case before the upsert:
- `metaTitle` → `meta_title`
- `metaDescription` → `meta_description`
- `heroIntro` → `hero_intro`
- `ctaText` → `cta_text`
- (`h1`, `body_html`, `faqs`, `testimonials`, `nearby_slugs`, `service_id`, `industry_slug`, `city_slug`, `status`, `id` already match)

In `listSeoOverrides.handler`, map rows back to the `OverrideRow` camelCase shape so the admin UI reads the saved values correctly.

### 2. `src/lib/seo/resolve.ts`
In all three resolvers (`resolveServiceCity`, `resolveServiceIndustry`, `resolveServiceIndustryCity`), the `ov` overlay currently reads `ov?.metaTitle`, `ov?.metaDescription`, `ov?.heroIntro`, `ov?.ctaText` from raw DB rows — those are undefined. Read snake_case: `ov?.meta_title`, `ov?.meta_description`, `ov?.hero_intro`, `ov?.cta_text` (keep `h1` and `body_html` as-is).

## Out of scope
- Renaming DB columns (would break existing data + types).
- Other admin CRUD (services/industries already use snake_case end-to-end).

## Verification
- Open `/admin/cms/seo/overrides`, save an industry-city override with all fields filled → no toast error, row reappears with values.
- Visit the matching `/best-{service}-for-{industry}-in-{city}` URL → overridden title/meta/CTA render instead of fallbacks.
