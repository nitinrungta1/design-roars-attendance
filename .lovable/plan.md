# Add help.oqlio.com to sitemaps & robots

Surface the Help Centre subdomain to crawlers so Google discovers articles fast and treats `help.oqlio.com` as a first-class property.

## Changes

### 1. `src/routes/sitemap[.]xml.tsx` (main sitemap)
- Append a reference to the help sitemap so crawlers find KB articles via the apex sitemap too.
- Switch response from a plain `<urlset>` to a sitemap **index** that lists:
  - `https://oqlio.com/sitemap-pages.xml` (current page list)
  - `https://help.oqlio.com/sitemap-help.xml` (already implemented)
- Keep the existing per-page URL list working by moving it to a new `sitemap-pages[.]xml.tsx` route (so we don't break what Google already indexed).

Result:
```
/sitemap.xml          → sitemap index (pages + help)
/sitemap-pages.xml    → marketing/product/legal pages (existing list)
/sitemap-help.xml     → KB articles (already exists, served from both hosts)
```

### 2. New `src/routes/sitemap-pages[.]xml.tsx`
- Holds the current 26-URL list verbatim from today's `sitemap.xml`.

### 3. `src/routes/robots[.]txt.tsx` (host-aware)
Detect host via `request.headers.get("host")` using the existing `isHelpHost` helper from `src/lib/host.ts`.

- **On `oqlio.com`** (default):
  ```
  User-agent: *
  Allow: /
  
  Sitemap: https://oqlio.com/sitemap.xml
  Sitemap: https://help.oqlio.com/sitemap-help.xml
  ```
- **On `help.oqlio.com`**:
  ```
  User-agent: *
  Allow: /
  Disallow: /admin
  Disallow: /login
  Disallow: /signup
  
  Sitemap: https://help.oqlio.com/sitemap-help.xml
  ```
  (Help host should not advertise app/auth routes even though the same app serves them.)

### 4. `src/routes/sitemap-help[.]xml.tsx` (tiny tweak)
- Also register the route so it's reachable from the apex (`oqlio.com/sitemap-help.xml`) — already a file route, so it works on both hosts automatically; no code change needed beyond confirming.

## Files
- **Edit:** `src/routes/sitemap[.]xml.tsx` (becomes index)
- **Edit:** `src/routes/robots[.]txt.tsx` (host-aware body)
- **Create:** `src/routes/sitemap-pages[.]xml.tsx` (page URL list)

No DB or migration changes. No UI changes.

## After deploy
- Submit `https://oqlio.com/sitemap.xml` and `https://help.oqlio.com/sitemap-help.xml` in Google Search Console once the subdomain is verified.
