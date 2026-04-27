## Goal

Port the **first-party traffic analytics system** from the "Design Roars Launchpad" project into your Oqlio/Punchly app. After this you'll be able to see — for every visitor on oqlio.com:

- Where they came from (UTM source/medium/campaign, gclid/fbclid, referrer, direct)
- What page they landed on, device/browser/OS, city/country
- Pageviews, scroll depth, time on page, clicks (WhatsApp/phone/email/outbound/CTA), form opens & submits
- Sessions, returning vs new visitors
- Conversion funnel → leads, with attribution carried through

All data is stored in **your own Lovable Cloud database** (no third-party trackers required), with optional Meta Pixel / GA4 / GTM / Clarity bolt-ons.

## What gets built

### 1. Database (4 new tables)

| Table | Purpose |
|---|---|
| `analytics_visitors` | One row per visitor_id (localStorage UUID). First-touch attribution, total sessions, total leads, first/last seen. |
| `analytics_sessions` | One row per session (30-min cookie). Landing URL, referrer, device, browser, OS, city, country, page count, last-touch JSON. |
| `analytics_events` | Every page_view, scroll_depth, click, form event. visitor_id + session_id + props JSON. |
| `analytics_settings` | Singleton row: optional Meta Pixel ID, GA4 ID, GTM ID, Clarity ID, consent toggle, retention days. |

RLS: public **insert** allowed via service-role API (the `/api/public/track` route uses the server key); **read** restricted to admin/reviewer roles via existing `has_role()`.

### 2. Client tracking SDK — `src/lib/tracking.ts`

Lightweight (~5KB), no deps. Captures on every page:
- Stable `visitor_id` in localStorage (1y), `session_id` cookie (30-min sliding)
- First-touch (saved forever) + last-touch (refreshed each visit): UTMs, gclid/fbclid/msclkid, referrer, landing URL, device, placement (reels/feed/search/etc.), creative type
- Auto-fired events: `session_start`, `page_view`, `scroll_depth` (25/50/75/100%), `time_on_page`, `whatsapp_click`, `phone_click`, `email_click`, `download_click`, `outbound_click`, `form_open`, `form_submit`
- Manual `track(name, props)` for custom events
- Batched + flushed via `fetch keepalive` / `sendBeacon` to `/api/public/track`

### 3. Server ingest — `src/routes/api.public.track.tsx`

POST endpoint. Validates with Zod, upserts visitor + session, bulk-inserts events. Uses service role key, never exposed to browser.

### 4. `TrackingProvider` mounted in `__root.tsx`

- Starts auto-tracking on mount
- Fires `page_view` on every TanStack route change
- Optionally loads Meta Pixel / GA4 / GTM / Clarity scripts when their IDs are set in `analytics_settings`
- Respects cookie-consent toggle

### 5. Lead attribution wiring

When a lead is created (your existing `/admin/leads` flow), we'll stamp `utm_source / utm_medium / utm_campaign / utm_content / placement / creative_type / landing_url / device / referrer / gclid / fbclid` from the visitor's last-touch onto the `leads` row, so every lead is tied back to its origin.

### 6. Admin UI — replaces the empty Analytics section

Layout route `_authenticated.admin.analytics.tsx` with sub-tabs:

| Tab | Route | What it shows |
|---|---|---|
| **Dashboard** | `/admin/analytics` | KPIs (visitors, sessions, leads, conversion %, top source, best campaign, WA/phone clicks), daily traffic+leads line chart, leads-by-source bar, leads-by-placement pie, creative-type pie, device split, funnel, top landing pages, top cities, smart insights |
| **Traffic** | `/admin/analytics/traffic` | Visitor/session trends, new vs returning, bounce-ish, page-depth distribution |
| **Attribution** | `/admin/analytics/attribution` | First-touch vs last-touch breakdown, UTM source/medium/campaign matrix |
| **Campaigns** | `/admin/analytics/campaigns` | Per-campaign sessions/leads/CR%, sortable table |
| **Funnel** | `/admin/analytics/funnel` | Visitors → Sessions → Engaged → Leads with drop-off % |
| **Tracking Settings** | `/admin/analytics/settings` | Inputs for Meta Pixel ID, GA4 ID, GTM ID, Clarity ID; cookie-consent toggle; retention days |

The existing empty `analytics.acquisition / churn / funnels / product / retention` files will be deleted (they're placeholders) and replaced with the above.

### 7. Filters: date range (7/30/90 days, custom), source filter, device filter — applied across all tabs.

## Brand adaptation

- All references to `dr_*` cookies/keys renamed to `oq_*` (oq_vid, oq_sid, oq_first_touch, oq_consent)
- Email template subject "Design Roars analytics report" → "Punchly (Oqlio) analytics report" — but the email reports feature is **out of scope** for this turn (can be added later)
- Colors use your existing semantic tokens (indigo→blue gradient, oklch), not Design Roars' orange/purple

## Out of scope (can be follow-ups)

- Scheduled email reports (`api.public.analytics.send-report`) and aggregated daily snapshots
- Google Search Console / Google Ads / Meta CAPI server-side conversion forwarding
- CSV exports tab (the source project has it; we can add later)

## Technical notes (for the curious)

- `/api/public/track` is unauthenticated by design (browsers post directly). Validation + Zod limits + best-effort error swallowing prevent abuse.
- `visitor_id` is a random UUID; no PII collected. IP is not stored.
- Service role key is only used inside the server route, never bundled to the client.
- Works without consent banner by default; flip `cookie_consent_required=true` in settings to gate pixel loading on consent.

## Files to create / change

**Create**
- `supabase/migrations/<ts>_analytics_tables.sql` — 4 tables + RLS
- `src/lib/tracking.ts` — client SDK
- `src/lib/attribution.ts` — server sanitizer
- `src/lib/analytics.functions.ts` — server functions powering admin dashboards
- `src/components/tracking-provider.tsx`
- `src/routes/api.public.track.tsx`
- `src/routes/_authenticated.admin.analytics.tsx` (layout)
- `src/routes/_authenticated.admin.analytics.index.tsx` (dashboard)
- `src/routes/_authenticated.admin.analytics.traffic.tsx`
- `src/routes/_authenticated.admin.analytics.attribution.tsx`
- `src/routes/_authenticated.admin.analytics.campaigns.tsx`
- `src/routes/_authenticated.admin.analytics.funnel.tsx`
- `src/routes/_authenticated.admin.analytics.settings.tsx`

**Edit**
- `src/routes/__root.tsx` — mount `<TrackingProvider settings={...} />`
- `src/components/admin/nav-config.ts` — add Analytics group with 6 sub-items
- `src/lib/leads.functions.ts` — stamp attribution onto new leads (if `leads` table has the columns; migration adds them if missing)

**Delete (placeholders being replaced)**
- `_authenticated.admin.analytics.acquisition.tsx`
- `_authenticated.admin.analytics.churn.tsx`
- `_authenticated.admin.analytics.funnels.tsx`
- `_authenticated.admin.analytics.product.tsx`
- `_authenticated.admin.analytics.retention.tsx`

Approve and I'll implement everything in one batch.