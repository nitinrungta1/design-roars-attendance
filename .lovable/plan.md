## Vision

Transform this project into a world-class Attendance & Workforce Management SaaS — premium brand, conversion-focused marketing site, enterprise-grade product, and an installable mobile PWA. We will **port and upgrade** the attendance backend from "Design Roars Launchpad" (not copy-paste) and reorganize it into a clean SaaS architecture.

## Brand & Design System

- **Name placeholder**: *Punchly* (we'll rename once you pick a final brand)
- **Positioning**: Smart, modern, scalable attendance for SMEs → enterprises, remote teams, retail, factories, schools, hospitals
- **Color system**: Indigo primary, electric blue accent, deep slate dark mode, white/cream light mode (HSL tokens in `styles.css`)
- **Type**: Geist / Inter (display + body), tabular numerals for time data
- **Style**: Premium SaaS — generous whitespace, soft shadows, subtle glassmorphism, micro-animations, no clutter
- **Tone**: Confident, simple, benefit-first
- *Inspired by category leaders but 100% original — no copied design or copy*

---

## Phase 1 — Foundation, Brand & Marketing Site (this turn)

### 1. Brand foundation
- New design tokens in `styles.css` (semantic HSL colors, dark mode, radius, shadows, gradients)
- Logo mark + wordmark (SVG)
- Reusable primitives: `Section`, `Container`, `GradientText`, `GlassCard`, `Marquee`, `StatCounter`, `MotionReveal`
- Sticky marketing header (nav + Login + Start Free Trial CTA), footer with sitemap, mobile sticky bottom CTA
- Cookie consent + theme toggle

### 2. Homepage `/`
- Hero: headline, sub, dual CTA (Start Free Trial / Book Demo), product mockup with subtle motion
- Trust bar (logo marquee + uptime/security badges)
- Key benefits grid (one-tap, GPS, kiosk, payroll-ready, timesheets, shifts, reports, mobile)
- Animated product showcase (tabs: Web app / Mobile / Kiosk)
- Industry strip (SMB, Enterprise, Retail, Factory, Remote, Schools, Hospitals)
- Testimonials (text + video placeholder)
- Pricing teaser (4 tiers)
- Final CTA band

### 3. Core marketing routes
- `/features` — overview hub
- `/pricing` — Free / Starter / Growth / Business / Enterprise + comparison table + FAQ
- `/industries` — overview + per-industry sub-pages later
- `/mobile-app` — mobile showcase + install PWA prompt
- `/about`, `/contact` (with form → leads table), `/demo` (Calendly-style booking placeholder)
- `/help`, `/blog`, `/careers` (shells, populated in Phase 4)
- Legal: `/privacy`, `/terms`, `/security`, `/gdpr`, `/refund-policy`

### 4. SEO architecture (technical + landing pages)
Per-route head() with unique title/description/og:title/og:description/og:image, JSON-LD (Organization, SoftwareApplication, FAQPage, BreadcrumbList), `sitemap.xml`, `robots.txt`, RSS for blog, canonicals, internal linking.

**SEO ranking pages (each one a real route, not anchors):**
- `/attendance-management-system`
- `/time-tracking-software`
- `/employee-timesheet-software`
- `/gps-attendance-app`
- `/biometric-attendance-software`
- `/shift-management-software`
- `/overtime-management-system`
- `/employee-check-in-app`
- `/payroll-attendance-integration`
- `/attendance-app-india`

**Programmatic SEO scaffolding** (templates ready, content generated later):
- `/attendance-software/$city` and `/gps-attendance/$city` dynamic routes

### 5. Lead gen
- Contact form, demo booking form, newsletter subscribe → `leads`, `subscribers`, `demo_requests` tables
- Sticky mobile CTA, optional exit-intent modal
- Basic analytics events (signup_clicked, demo_booked, pricing_viewed)

---

## Phase 2 — Auth, Roles & Admin Shell (foundation for the product)

- Lovable Cloud email/password + Google sign-in
- `/login`, `/signup`, `/reset-password`, `/verify`
- `profiles` table + auto-create trigger on signup
- `app_role` enum (`super_admin`, `admin`, `hr`, `manager`, `reviewer`, `employee`) + `user_roles` table + `has_role()` security definer
- Permissions per module (view/edit/approve/export/admin) — Amazon Seller Central style matrix
- `_authenticated` and `_authenticated/_admin` route guards
- Admin shell: sidebar nav, breadcrumbs, command palette, notifications, user menu
- `companies` (multi-tenant ready) + `employees` table with FK to `auth.users`

---

## Phase 3 — Port & Upgrade Attendance Backend (the core product)

Port from "Design Roars Launchpad" with fresh, cleaner schema and migrations in **this** project's Lovable Cloud DB. Re-implement, don't blind-copy.

### Database (migrations)
- `employees`, `teams`, `departments`, `managers`
- `attendance_logs`, `attendance_corrections`, `attendance_audit`
- `attendance_devices`, `attendance_geo_zones`, `attendance_holidays`, `attendance_policies`
- `shifts`, `shift_assignments`, `shift_rotations`
- `timesheets`, `timesheet_entries`, `projects`, `clients`
- `overtime_rules`, `overtime_records`
- `leave_types`, `leave_requests`, `leave_balances`
- `approvals`, `notifications`, `announcements`
- Full RLS using `has_role()` + `is_attendance_admin()` + `is_attendance_manager_of()` security-definer functions (no recursion)

### Admin product routes (`/admin/*`)
Overview, Live Status, Daily Log, Timesheets (list + calendar + detail), Projects & Clients, Employees, Shifts, Approvals, Reports, Devices, Geo Zones, Holidays, Policies, Leave, Announcements, Permissions, Integrations, Settings.

### Server functions / public APIs
Check-in/out, breaks, overtime, kiosk, set-PIN, QR scan, geo-fenced punch, IP restriction, auto-shift-detection — all `createServerFn` + `/api/public/attendance/*` routes with signature/auth verification.

### Reports & exports
Daily attendance, late comers, absentees, overtime, productivity, timesheet gaps. Export CSV / Excel / PDF.

---

## Phase 4 — Employee & Manager Experience + Mobile PWA

- Employee portal: `/me/attendance`, `/me/timesheets`, `/me/leave`, `/me/payslips` (placeholder)
- Manager portal: team dashboard, approvals inbox, alerts, reports
- **Kiosk mode**: `/kiosk` tablet UI with PIN/QR/face-ready check-in
- **PWA**: installable on iOS/Android, offline-first check-in queue, push notifications, app icons + splash, GPS check-in
- *Note: Native iOS/Android apps (App Store/Play) aren't supported in Lovable's web stack — the PWA is the mobile delivery. A Capacitor/React Native shell can be built outside Lovable later if you need true native.*

---

## Phase 5 — Content, Help Center, Blog, Polish

- Blog engine (already partially exists in source) with topics: tracking attendance, best apps, overtime guide, hybrid policy, payroll mistakes
- Help Center: knowledge base, FAQs, onboarding videos
- Status / Uptime page
- Performance pass: lazy loading, image optimization, prefetching, Core Web Vitals tuning
- Final SEO pass: schema validation, internal linking audit, canonical sweep

---

## Phase 6 — Monetization & Integrations

- Stripe (Lovable Payments) — Free / Starter / Growth / Business / Enterprise plans + trial + billing portal
- Subscription gating per module
- Payroll integration stubs (Razorpay Payroll, Zoho Payroll, generic CSV)
- Slack / WhatsApp / Email notification integrations
- Webhooks + public API for enterprise

---

## What we'll do *right now* if you approve

**Phase 1 in full**: brand, design system, homepage, all marketing routes, all 10 SEO landing pages, programmatic-SEO scaffolding, contact/demo forms with Lovable Cloud DB, sitemap/robots/JSON-LD, dark mode, sticky CTAs.

Phases 2–6 each ship as a separate approved batch so you see real progress and can steer.

## Out of scope / clarifications
- True native iOS/Android binaries → PWA delivered; native shell is a separate, non-Lovable project
- Face recognition → UI + "ready" state in Phase 4; ML model integration is a Phase 6+ add-on (third-party API like AWS Rekognition)
- White-label / multi-region → architected for it (multi-tenant `companies` table from Phase 2), full tenant theming in a later phase
- Final brand name/logo → using *Punchly* placeholder; tell me your preferred name anytime and we'll swap globally
