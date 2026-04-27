# Next: Public CMS pages + Batch 7 (Support) + Batch 8 (Settings & Integrations)

This batch finishes the public-facing CMS wiring you deferred earlier, then completes the two remaining admin batches end-to-end (DB + admin UI + minimal public touchpoints).

## Part A — Wire public CMS pages (was deferred)

Replace the 54-line stubs with database-driven public pages.

- **`src/routes/blog.tsx`** — index of published posts: cover, title, excerpt, category, date, author. Loader calls `listPublicBlogPosts()`. Filter chips by category, search box, paginated.
- **`src/routes/blog.$slug.tsx`** *(new)* — single post page. Loader calls `getPublicBlogPost(slug)`. Renders body, cover, author, tags, share buttons. `head()` pulls `seo_title`/`seo_description`/`cover_url` for og tags. `notFoundComponent` for missing/unpublished.
- **`src/routes/careers.tsx`** — index of published `job_postings` grouped by department; shows employment type + location chips. Loader calls `listPublicJobs()`.
- **`src/routes/careers.$slug.tsx`** *(new)* — single job page with apply CTA (posts to `form_submissions` with `form_id = null` and a `kind: "job_application"` payload). Loader calls `getPublicJob(slug)`.
- **`src/routes/$pageSlug.tsx`** *(new, low-priority catch)* — renders any published `cms_pages` row by slug for static marketing pages. Skipped if it conflicts with existing routes — TanStack file routing puts named routes first.
- Brand: blog/careers use **Oqlio** title format (company pages, no Punchly eyebrow), per memory.

## Part B — Batch 7: Support (full)

### Database (one migration)

Tables (all RLS: support staff + admins read/write; customers read/insert only their own):

- `support_tickets` — `id`, `company_id` (nullable for public), `subject`, `body`, `status` enum (`open`, `pending`, `solved`, `closed`), `priority` enum (`low`, `normal`, `high`, `urgent`), `channel` enum (`email`, `chat`, `web`, `api`), `assignee_id`, `requester_email`, `requester_name`, `tags text[]`, `first_response_at`, `resolved_at`, `sla_due_at`, timestamps.
- `support_ticket_messages` — `ticket_id`, `author_id` (nullable for customer), `author_email`, `body`, `is_internal` boolean (private notes), `attachments jsonb`, timestamps.
- `support_macros` — canned responses: `name`, `body`, `tags`, `created_by`.
- `support_sla_policies` — `name`, `priority`, `first_response_minutes`, `resolution_minutes`, `business_hours jsonb`, `is_default`.
- `kb_articles` — `slug`, `title`, `body`, `category`, `status` (draft/published), `seo_title/description`, `view_count`, `helpful_count`, `published_at`.
- `kb_categories` — `slug`, `name`, `position`.
- DB function `assign_sla(ticket)` trigger that stamps `sla_due_at` from the matching policy on insert.

### Server functions (`src/lib/support.functions.ts`)

CRUD + bulk actions for tickets (assign, change status/priority, add tag, bulk close), message thread (post reply, post internal note), macro insert, KB CRUD. All mutations write `audit_logs` via `log_audit`.

### Admin UI (replace placeholders)

- `_authenticated.admin.support.tickets.tsx` — list with filters (status, priority, assignee, channel, tag, date), bulk-action bar (assign, status, delete), row click opens a Sheet with full conversation thread + reply box + macros + internal-note toggle + side panel (requester, company, SLA countdown, tags).
- `_authenticated.admin.support.chat.tsx` — live inbox view of `channel='chat'` tickets, realtime via `supabase.channel('support_tickets')`.
- `_authenticated.admin.support.kb.tsx` — KB articles + categories editor (Sheet pattern, status toggle, SEO fields).
- `_authenticated.admin.support.sla.tsx` — SLA policies CRUD with priority matrix preview.

### Public touchpoints

- `src/routes/contact.tsx` (existing) — submit creates a `support_tickets` row directly (channel=`web`) instead of just `form_submissions`.
- `src/routes/help.tsx` *(new)* + `src/routes/help.$slug.tsx` — public KB browser (search, category sidebar, single-article page with helpful/not-helpful counters incrementing `kb_articles.helpful_count`).

## Part C — Batch 8: Settings & Integrations (full)

### Database

- `app_settings` — singleton row keyed `id=1`: `site_name`, `support_email`, `default_locale`, `default_timezone`, `currency`, `branding jsonb` (logo_url, accent), `feature_flags jsonb`. Public read for branding fields only via a SECURITY DEFINER `get_public_settings()`; admin write for full row.
- `webhooks` — `name`, `url`, `secret`, `event_types text[]`, `is_active`, `last_delivery_at`, `failure_count`.
- `webhook_deliveries` — `webhook_id`, `event_type`, `payload jsonb`, `status_code`, `response_body`, `attempts`, `delivered_at`. Admin-only.
- Extend existing `integrations` table usage; add provider catalog rows for: payments (Stripe/Razorpay), email (Resend/SendGrid), SMS (Twilio/MSG91), WhatsApp (Twilio/Meta Cloud API), GA4/Meta (already in `analytics_settings`).
- Use existing `api_keys` table.

### Server functions (`src/lib/settings.functions.ts`, `src/lib/integrations.functions.ts`)

- Get/update `app_settings`.
- CRUD webhooks; **test-fire** endpoint that signs payload (HMAC-SHA256 with the webhook `secret`) and POSTs a `ping` event, recording the result in `webhook_deliveries`.
- Connect/disconnect each integration provider; mask secrets on read (only return last 4 chars).
- Generate API key (returns plaintext **once**; stores `key_hash` only).

### Public webhook receiver (security-first)

- `src/routes/api.public.webhooks.$.tsx` — outbound dispatcher endpoint (cron-callable) that flushes pending deliveries with retries + exponential backoff. Verifies caller via header secret.
- Reusable `dispatchWebhook(eventType, payload)` helper called from existing audit/lead/ticket mutations.

### Admin UI (replace placeholders)

- `_authenticated.admin.system.settings.tsx` — branding, locale, currency, support email, feature flags toggle grid (reads/writes `feature_flags` table).
- `_authenticated.admin.integrations.payments.tsx`, `.email.tsx`, `.sms.tsx`, `.whatsapp.tsx` — connect cards: each shows status pill, "Connect" opens a Sheet with provider-specific fields, masked secrets, "Test connection" button.
- `_authenticated.admin.integrations.webhooks.tsx` — webhook list + create Sheet (event picker, URL, secret), delivery log table per row, "Send test" button.
- `_authenticated.admin.integrations.apis.tsx` — API keys: create (one-time reveal modal), revoke, last-used column, scope chips.

## Order of execution

1. Public CMS pages (Part A) — small, no migration needed.
2. Batch 7 migration → server fns → admin UI → public KB/contact wiring.
3. Batch 8 migration → server fns → admin UI → webhook dispatcher.

Each part ends with a quick smoke test (build passes, key admin Sheet opens, public list loads). Skipping further questions — this matches the established pattern from Batches 1–6.