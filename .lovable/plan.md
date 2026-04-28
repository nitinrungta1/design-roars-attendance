## Enhance Settings → Premium Company Setup

Upgrade the existing **Admin → System → Settings** page (`/admin/system/settings`) into a polished, tabbed enterprise configuration experience. Nothing existing is removed — fields, save logic, audit logging, and platform_settings table remain. We add tabs, validation, logo upload with AI color extraction, visual color picker, live brand preview, and richer localization.

### 1. Database changes (one migration)

**`platform_settings` table additions** (all nullable / safe defaults — no breaking changes):
- `secondary_color text`
- `accent_color text`
- `date_format text default 'DD/MM/YYYY'`
- `time_format text default '24h'`
- `number_format text default 'en-IN'`
- `week_start smallint default 1` (0=Sun, 1=Mon)

**Company name uniqueness** (already partly enforced via `companies.slug` unique). Add:
- Case-insensitive unique index: `create unique index companies_name_ci_idx on public.companies (lower(trim(name)))`
- Trigger `companies_normalize_name` to trim whitespace before insert/update.

**Storage bucket** `brand-assets` (public read, authenticated write, 1 MB limit enforced in RLS via `metadata->>'size'` check + client-side guard). Path convention: `platform/logo-{timestamp}.{ext}`.

### 2. Server functions (`src/lib/system.functions.ts`)

Extend `updatePlatformSettings` zod schema with the six new fields. Add two new server functions:

- **`checkCompanyNameAvailable({ name, excludeId? })`** — case-insensitive lookup against `companies.name`, returns `{ available: boolean }`. Used for live validation while typing (debounced).
- **`extractLogoColors({ logoUrl })`** — calls Lovable AI Gateway (`google/gemini-2.5-flash` with vision) using a tool-calling schema that returns `{ primary, secondary, accent }` as hex strings. Fallback: if AI fails, returns nulls and the UI keeps the current palette.

Both protected by `requireSupabaseAuth` + admin check.

### 3. Settings page redesign (`src/routes/_authenticated.admin.system.settings.tsx`)

Convert the current two-card grid into a **tabbed layout** using existing `@/components/ui/tabs`:

```text
[Company Profile] [Branding] [Localization] [Preferences] [Security]
```

Sticky save bar at bottom-right with **Unsaved changes** badge + dirty-state guard (block route navigation via `useBlocker`).

**Company Profile tab**
- Brand name field with debounced async uniqueness check (300 ms). States: idle / checking spinner / green check / red error "This company name is already in use. Please choose another."
- Auto-trim onBlur. Live slug preview (read-only).
- Product name, support email (existing).

**Branding tab**
- New `<LogoUploader>` component (`src/components/admin/logo-uploader.tsx`):
  - Dashed drop-zone with "Upload Company Logo" button.
  - Accepts `image/png, image/jpeg, image/jpg, image/svg+xml, image/webp`.
  - Client validates: ≤ 1 MB, MIME whitelist. Shows toast on failure.
  - Auto-compress raster images >500 KB via canvas to ≤ 1 MB before upload (skip SVG).
  - Live 96×96 preview on transparent checker background; Replace + Remove buttons.
  - On successful upload → calls `extractLogoColors` and prefills the three color fields with a "Use AI suggestion" pill (user can dismiss).
- New `<BrandColorField>` component using a popover + `react-colorful` (lightweight, ~3 KB; add via `bun add react-colorful`).
  - Preset swatches (12 brand-friendly tones) + recent colors.
  - Advanced disclosure reveals raw HEX input.
  - Three fields: Primary / Secondary / Accent + automatic Text Contrast preview (black/white badge picked via WCAG luminance).
- `<BrandPreview>` panel (right column on lg+, below on mobile) renders live mock of: header, sidebar item, primary button, secondary button, card, mini bar chart — all driven by current color state via inline CSS variables.

**Localization tab**
- Default Currency: searchable command-style dropdown using `CURRENCY_LIST` from `@/lib/currency` showing `flag · CODE · symbol · name`. Recent/favorites pinned to top via localStorage.
- Default Timezone: searchable dropdown sourced from `Intl.supportedValuesOf('timeZone')`. "Auto-detect" button uses `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- Date format select (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, D MMM YYYY) with live sample.
- Time format toggle (12h / 24h).
- Number format select (en-IN lakh, en-US, de-DE, fr-FR) with live sample.
- Week start select (Sun/Mon/Sat).

**Preferences tab**
- Default plan code (existing) + role labels editor (existing JSON pretty form).

**Security tab** — existing fields kept (already on the page logic in `system.functions.ts`).

### 4. Brand variable propagation

When saving, write the three colors into `platform_settings`. On app boot (in `__root.tsx` or existing theme provider), read them and inject as `--primary`, `--secondary`, `--accent` CSS custom properties on `:root` so dashboard, login, and reports immediately reflect the brand. Falls back to current tokens if null.

### 5. UX polish

- Inline success ticks on each field once saved.
- Sticky bottom action bar: "Discard" + "Save changes" with spinner.
- `beforeunload` + TanStack Router blocker when dirty.
- Mobile: tabs collapse into a horizontal scroll; preview panel moves below.
- Skeleton loader during initial fetch.

### 6. Files

**Create**
- `supabase/migrations/<ts>_settings_enhancements.sql` (columns, unique index, trigger, bucket + policies)
- `src/components/admin/logo-uploader.tsx`
- `src/components/admin/brand-color-field.tsx`
- `src/components/admin/brand-preview.tsx`
- `src/components/admin/timezone-select.tsx`
- `src/components/admin/currency-select.tsx` (reuses CURRENCY_LIST)

**Edit**
- `src/lib/system.functions.ts` — extend schema + 2 new fns
- `src/routes/_authenticated.admin.system.settings.tsx` — full tabbed rewrite (preserves all existing field bindings)
- `src/routes/__root.tsx` — inject brand color CSS vars from settings query (lightweight)
- `package.json` — add `react-colorful`

### Out of scope (flag for later)
- Per-tenant company branding (current `platform_settings` is a singleton; multi-tenant brand override would need a `company_branding` table).
- Mobile app theme push (noted as "future ready" in the request).