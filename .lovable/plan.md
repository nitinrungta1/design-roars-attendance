# Brand model lock-in + rebrand pass + Phase 2 kickoff

## Decisions captured (saved as Core memory rules)

- **Oqlio** = company / website / legal entity. Owns the header logo, footer, About, Careers, Contact, legal pages.
- **Punchly** = the attendance product. Owns feature pages, pricing, dashboard, mobile app, admin shell, kiosk.
- **Canonical domain**: `https://oqlio.com` (apex, no www). All `og:url`, canonical `<link>`, sitemap entries, robots.txt sitemap pointer use this host.
- **Title format**: `Punchly — {Page} | Oqlio` for product pages. `Oqlio — {Page}` for company pages (About, Careers, Contact, legal).

## 1. Memory rules (so this never drifts)

Create:
- `mem://index.md` — Core section with the brand hierarchy + canonical domain rules.
- `mem://brand/naming.md` — full guidance: when to use Oqlio vs Punchly in copy, headers, meta titles, schema.org types, email From names.

## 2. Rebrand the existing surface

**Logo & header** (`src/components/brand/logo.tsx`, `marketing-header.tsx`)
- Wordmark renders **Oqlio** (with the gradient on the last two letters), not Punchly.
- Add a small "Punchly · Attendance OS" eyebrow next to the logo on product pages only (features, pricing, mobile-app, all SEO landing pages, demo).
- Company pages (about, careers, contact, legal) show only the Oqlio wordmark.

**SEO module** (`src/lib/seo.ts`)
- `SITE_NAME = "Oqlio"`, `PRODUCT_NAME = "Punchly"`, `SITE_URL = "https://oqlio.com"`.
- Add a `kind: "product" | "company"` field to `seo()` so it auto-formats titles:
  - product → `Punchly — {title} | Oqlio`
  - company → `{title} | Oqlio`
- `og:site_name` = `"Oqlio"` everywhere.
- Default OG image filename stays the same; just hosted under oqlio.com.

**Structured data**
- Root route: emit `Organization` JSON-LD for Oqlio (name, url, logo, sameAs).
- Product pages: emit `SoftwareApplication` JSON-LD with `name: "Punchly"`, `brand: { @type: Organization, name: "Oqlio" }`.
- Pricing page: `Offer` array tied to the Punchly SoftwareApplication.

**Sitemap & robots** (`src/routes/sitemap[.]xml.tsx`, `src/routes/robots[.]txt.tsx`)
- Switch host from `punchly.app` to `https://oqlio.com`.
- Robots: `Sitemap: https://oqlio.com/sitemap.xml`.

**Footer** (`src/components/brand/marketing-footer.tsx`)
- Copyright: `© {year} Oqlio. Punchly is a product of Oqlio.`
- Add small "Products" column listing Punchly (room to add more later — this is why you wanted the two-name model).

**Page-by-page copy sweep**
- Update every existing route file's `head()` so titles follow the new format. Files touched: `index.tsx`, `features.tsx`, `pricing.tsx`, `industries.tsx`, `mobile-app.tsx`, `demo.tsx`, `contact.tsx`, `about.tsx`, `careers.tsx`, `blog.tsx`, `help.tsx`, `privacy.tsx`, `terms.tsx`, `gdpr.tsx`, `security.tsx`, `refund-policy.tsx`, and the 10 SEO landing pages (`attendance-management-system`, `time-tracking-software`, `employee-timesheet-software`, `gps-attendance-app`, `biometric-attendance-software`, `shift-management-software`, `overtime-management-system`, `employee-check-in-app`, `payroll-attendance-integration`, `attendance-app-india`).
- About page rewritten as **Oqlio's** story (the company), with a "Our products" section featuring Punchly.
- Hero on `/` keeps Punchly as the headline product but adds "from Oqlio" eyebrow.

**Asset rename (logical, not file rename)**
- `logo-mark.png` keeps its filename but is treated as the Oqlio mark.
- Add a small Punchly product mark variant for use inside the (future) product UI / admin shell — generated as `src/assets/punchly-mark.png`.

## 3. Fix the current runtime error

`makeRoute(...) is not a function` is from a stale `routeTree.gen.ts`. The rebrand pass touches enough route files that the regeneration on next dev/build will clear it; if it persists I'll force a regen by touching a route file last.

## 4. Phase 2 (auth + admin shell) — now branded correctly from day one

Same plan you already approved, with these brand-aware tweaks:
- Auth screens (`/login`, `/forgot-password`, `/reset-password`, `/auth-callback`) live under the **Punchly** product surface — header shows "Punchly" wordmark, "by Oqlio" eyebrow.
- Admin shell at `/admin` is fully Punchly-branded (sidebar logo = Punchly mark, topbar title = "Punchly Admin").
- Email templates (sent later via the email scaffolding tool) use From name **"Punchly (Oqlio)"** and footer with Oqlio legal address.
- Database: `companies`, `profiles`, `user_roles`, `app_role` enum, `has_role()`/`is_attendance_admin()`/`needs_bootstrap()` security-definer functions, auto-profile trigger, first-user-as-super-admin bootstrap. (Unchanged from prior plan.)
- Google OAuth enabled via Lovable Cloud.
- Protected routing via `_authenticated.tsx` and `admin.tsx` layouts; user management at `/admin/access/users` and `/admin/access/roles`.

## Acceptance criteria

1. Header on `/` shows **Oqlio** wordmark; product pages show Oqlio wordmark + "Punchly · Attendance OS" eyebrow.
2. Browser tab on `/pricing` reads `Punchly — Pricing | Oqlio`. Browser tab on `/about` reads `About | Oqlio`.
3. View-source on `/` shows `og:site_name = Oqlio`, canonical `https://oqlio.com/`, an `Organization` JSON-LD for Oqlio, and a `SoftwareApplication` JSON-LD for Punchly.
4. `/sitemap.xml` and `/robots.txt` only contain `https://oqlio.com/...` URLs.
5. `makeRoute` runtime error is gone.
6. Sign up → first user becomes super_admin → lands on `/admin` (Punchly-branded shell). A second signup is a plain employee until promoted.
