# Punchly Admin Command Center — Phased Build Plan

The scope you described is a complete B2B SaaS operating system (Zoho/Odoo/Shopify-Admin scale). Shipping it in a single message would produce shallow, buggy modules. I'll deliver it in **10 sequential batches**, each independently usable and reviewable. Existing work is **preserved and extended** — nothing is deleted.

---

## What already exists (will be extended, not replaced)

- **Brand**: Oqlio (company) / Punchly (product), SEO + sitemap + robots
- **Marketing site**: 25+ routes (home, features, pricing, 10 SEO landing pages, legal, contact, demo, careers, about, blog, help)
- **Lead capture**: `leads`, `demo_requests`, `subscribers` tables with public-insert RLS
- **Auth**: email/password + Google OAuth, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth-callback`
- **RBAC foundation**: `app_role` enum (`super_admin`, `admin`, `hr`, `manager`, `employee`), `user_roles`, `profiles`, `companies` tables, `has_role()`/`is_admin()`/`is_attendance_admin()`/`is_super_admin()`/`needs_bootstrap()` security-definer functions, auto-profile + first-user-as-super-admin trigger
- **Admin shell skeleton**: `/admin` route, sidebar with 7 nav items, dashboard stub

---

## Batch 1 — Multi-tenant foundation + Admin shell v2 (THIS BATCH)

**Database migration:**
- Add `company_id` to `profiles`, `user_roles`, `leads`, `demo_requests` (nullable for bootstrap, with index)
- New tables: `company_members` (user↔company↔role-in-company), `audit_logs` (actor_id, company_id, action, entity_type, entity_id, diff jsonb, ip, user_agent, created_at), `notifications` (user_id, type, title, body, link, read_at), `feature_flags` (company_id, key, enabled)
- New enum `app_role` values: `sales`, `support`, `finance`, `developer`, `viewer` (added to existing enum)
- RLS: tenant-scoped policies via new `current_company_id()` security-definer + `is_member_of(_company)` helpers
- Seed: default Oqlio internal company for super-admin operations

**Admin shell v2:**
- New `src/components/admin/admin-shell.tsx` with collapsible sidebar (Dashboard, Customers, Workforce, Sales & Billing, Website CMS, Leads/CRM, Support, Analytics, Access Control, Integrations, System) with nested sub-nav
- Topbar: global search (cmd+k), company switcher (super-admin sees all tenants), notifications bell, theme toggle, profile menu
- Breadcrumbs, page-header primitive, empty-state primitive, data-table primitive (sortable, filterable, paginated, exportable)
- Replace existing simple sidebar; old `/admin` dashboard becomes the new SaaS Overview
- Route reorganization: `_authenticated.admin.*` → nested folders for each module group

**SaaS Overview dashboard:**
- KPI cards (Customers, Active Companies, MRR/ARR placeholders, New Trials, Trial→Paid %, Churn, Employees Managed, Daily Check-ins, Open Tickets, Pending Invoices) — wired to live counts where data exists, "—" with tooltip elsewhere
- Charts via recharts: Revenue growth, Signup trend, Churn trend, Geo growth, Usage heatmap (skeleton states until data lands)
- Recent activity feed from `audit_logs`

**Acceptance:** new shell renders, super-admin sees company switcher, all 11 sidebar groups visible with stub pages, dashboard KPIs show real auth/lead counts.

---

## Batch 2 — Customers / Companies / CRM-style account management
- `/admin/customers/companies` — list + detail + create/edit/suspend/impersonate (impersonation via signed JWT swap, audit-logged)
- `/admin/customers/accounts` — owner contacts per company
- `/admin/customers/contacts` — all human contacts (CRM-lite)
- `/admin/customers/plans` — assigned plan view per company
- `/admin/customers/usage` — per-company usage report (employees, check-ins, storage)
- New tables: `account_contacts`, `company_usage_daily` (rollup)
- Bulk CSV import for companies

## Batch 3 — Workforce product modules (the actual attendance OS)
- `/admin/workforce/employees` — records, bulk import, departments, designations
- `/admin/workforce/attendance` — live logs, geo punches, device punches, exceptions, manual correction (audit-logged)
- `/admin/workforce/timesheets` — submitted/locked/billable views
- `/admin/workforce/shifts` — templates, rotations, assignments
- `/admin/workforce/overtime` — rules engine + approvals queue
- `/admin/workforce/leave` — balances, requests, policies, holiday calendar
- New tables: `employees`, `departments`, `designations`, `attendance_logs`, `attendance_exceptions`, `timesheets`, `timesheet_entries`, `shifts`, `shift_assignments`, `overtime_rules`, `overtime_requests`, `leave_types`, `leave_balances`, `leave_requests`, `holidays`
- All tenant-scoped via `company_id` + RLS

## Batch 4 — Leads / CRM pipeline + Support desk
- `/admin/leads` — pipeline board (Lead → Demo Booked → Trial Started → Negotiation → Won → Lost), assignment to sales reps, activity timeline
- Extends existing `leads` + `demo_requests` (no data loss)
- `/admin/support/tickets` — ticket list, statuses (Open/Pending/Resolved/Escalated), SLA timers, assignments, internal notes, canned replies
- `/admin/support/kb` — knowledge base CMS (markdown)
- `/admin/support/sla` — SLA policy editor
- New tables: `lead_pipeline_stages`, `lead_activities`, `tickets`, `ticket_messages`, `ticket_sla_policies`, `kb_articles`, `kb_categories`, `canned_replies`

## Batch 5 — Sales & Billing (Stripe + Razorpay-ready architecture)
- `/admin/billing/plans` — plan catalog (Free/Starter/Growth/Business/Enterprise) editor
- `/admin/billing/subscriptions` — per-company subs, upgrade/downgrade/cancel/pause, prorated
- `/admin/billing/invoices` — list, PDF, GST/VAT, retry failed
- `/admin/billing/payments` — payment log, refunds
- `/admin/billing/taxes` — tax rules (GST, VAT, country-based)
- `/admin/billing/coupons` — coupon engine
- New tables: `plans`, `plan_features`, `subscriptions`, `invoices`, `invoice_items`, `payments`, `tax_rules`, `coupons`, `coupon_redemptions`
- Provider abstraction layer; Stripe wired first via Lovable's built-in payments after eligibility check (separate approval). Razorpay/PayPal scaffolded (BYOK) for India market

## Batch 6 — Website CMS (control public site from admin)
- `/admin/cms/pages` — landing-page builder (block editor) with publish/draft/schedule
- `/admin/cms/blogs` — post editor (markdown + cover, SEO, OG image)
- `/admin/cms/seo` — global SEO config, redirects, sitemap manager
- `/admin/cms/careers` — job postings (linked to `/careers` route)
- `/admin/cms/forms` — form-builder + submissions inbox (extends `leads` + `demo_requests`)
- `/admin/cms/media` — media library (Lovable Cloud Storage bucket)
- New tables: `cms_pages`, `cms_blocks`, `blog_posts`, `blog_categories`, `cms_redirects`, `careers_jobs`, `cms_forms`, `cms_form_submissions`, `media_assets`
- Public site routes start reading from CMS where applicable (`/blog`, `/careers` first)

## Batch 7 — Analytics (product + marketing)
- `/admin/analytics/product` — DAU/WAU/MAU, feature usage, drop-off funnels, login frequency
- `/admin/analytics/churn` — cohort retention, churn reasons
- `/admin/analytics/acquisition` — source-wise signups, campaign ROI
- `/admin/analytics/retention` — cohorts
- `/admin/analytics/funnels` — conversion funnel builder
- New tables: `analytics_events` (append-only), `analytics_daily_rollups`, `cohorts`
- Lightweight in-house event tracker server fn `/api/public/track` (signed); pg_cron rollup job

## Batch 8 — Advanced Access Control + Audit Logs + Notifications
- `/admin/access/users` (real, replacing stub) — user list, invite, assign roles per company
- `/admin/access/roles` — role editor with per-module/per-action matrix (View/Create/Edit/Delete/Approve/Export)
- `/admin/access/permissions` — granular permission grid
- `/admin/access/teams` — group users into teams
- `/admin/system/audit-logs` — searchable, filterable, exportable
- Notifications center (in-app bell + email triggers via Lovable Email after domain setup)
- New tables: `permissions`, `role_permissions`, `teams`, `team_members`, `user_invites`

## Batch 9 — Integrations + Automations + Exports
- `/admin/integrations/email` (Lovable Email, Resend BYOK)
- `/admin/integrations/sms` (Twilio BYOK)
- `/admin/integrations/whatsapp` (WhatsApp Cloud API BYOK)
- `/admin/integrations/payments` (Stripe/Razorpay/PayPal toggles)
- `/admin/integrations/apis` — public API key issuance (for mobile apps)
- `/admin/integrations/webhooks` — outbound webhook subscriptions
- Automations: trial expiry, invoice reminders, low-usage alerts, renewal reminders, welcome onboarding, churn-risk alerts, attendance anomalies — pg_cron jobs hitting `/api/public/automations/*` server routes
- Universal export utility (CSV/Excel/PDF) wired into every data table
- New tables: `api_keys`, `webhook_subscriptions`, `webhook_deliveries`, `automation_runs`

## Batch 10 — System / Security / White-label / Mobile API
- `/admin/system/settings` — global config
- `/admin/system/security` — 2FA enforcement (TOTP), session list/revoke, IP allowlists, password HIBP toggle
- `/admin/system/backups` — manual snapshot trigger + download (DB dump via server fn)
- White-label scaffolding: per-company custom branding (logo, colors, custom domain field) — UI only this batch, DNS wiring later
- Mobile API surface under `/api/public/v1/*` — auth (JWT), attendance check-in, approvals, notifications — versioned, rate-limited, documented
- GDPR: data-export-on-request + delete-account flows
- Final QA pass + admin onboarding tour

---

## Rules I'll enforce across all batches

1. **No deletion** — all current routes, tables, and components remain. Existing `leads`/`demo_requests`/`subscribers` extend, not replace.
2. **Tenant-safe by default** — every new table has `company_id` + RLS using `is_member_of(company_id)` security-definer (no recursion).
3. **Audit everything** — billing changes, role changes, impersonation, exports, deletes all write to `audit_logs` via DB triggers.
4. **Server-only secrets** — service-role key never touches client; admin mutations go through `createServerFn` with `requireSupabaseAuth` + role checks.
5. **Real data or "—"** — KPIs show real numbers where data exists, em-dash with tooltip otherwise. No fake demo numbers.
6. **Design system** — keeps Oqlio dark theme, gradient brand, glass surfaces, semantic tokens. New `admin-shell` primitives become the foundation.

---

## What I need from you to start Batch 1

Just **"approve"** and I'll ship Batch 1 (multi-tenant DB foundation + new admin shell + SaaS Overview dashboard). Each subsequent batch ships only after you approve the previous one — that way you can course-correct between batches instead of after a 10,000-line dump.
