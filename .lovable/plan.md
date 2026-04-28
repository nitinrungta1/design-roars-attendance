## Problem

Visiting `help.oqlio.com` currently shows the Oqlio marketing home page instead of the Help Centre. The "Help" links in the header and footer correctly point to `https://help.oqlio.com`, but because the destination subdomain is broken, clicking them appears to do nothing useful (lands back on the same marketing home).

Root cause is in `src/routes/__root.tsx`. The host-based redirect is wrapped in `typeof window !== "undefined"`, so it only runs in the browser. By that point the server has already shipped the marketing index HTML for `/`, and the redirect inside `beforeLoad` doesn't take effect on the initial SSR render. Result: `help.oqlio.com/` keeps serving the marketing home.

## Fix

Move the host-based routing so it runs on the server (during SSR) using the request's `Host` header, not just on the client after hydration.

### 1. `src/routes/__root.tsx` — server-aware help subdomain handling

Replace the current `beforeLoad` with logic that:
- Uses `getRequestHeaders()` from `@tanstack/react-start/server` (or the equivalent `getHeaders`) on the server to read the `host` header.
- Falls back to `window.location.host` on the client.
- If the host is `help.oqlio.com` (or any `help.*` subdomain) AND the path is `/` (or empty), throw `redirect({ to: "/help", replace: true })`.
- Also handle the inverse cleanup: if a Help URL like `/help` is accessed on `help.oqlio.com`, leave it alone (the redirect to `/help` already covers initial visits, and direct navigation to `/help/$slug` works as-is).

This means a request to `https://help.oqlio.com/` is redirected server-side (HTTP 302) to `https://help.oqlio.com/help`, and from there the existing Help routes render correctly.

### 2. Verify Help links in header/footer

`src/components/brand/marketing-header.tsx` and `src/components/brand/marketing-footer.tsx` already render external links via `<a href>` when `external: true`. No changes needed there — they will start working as soon as the destination subdomain serves the Help Centre.

### 3. Verify CopyGuard doesn't block link clicks

`src/components/copy-guard.tsx` only blocks `contextmenu`, `selectstart`, `dragstart`, and a few keyboard shortcuts. Plain left-click on an `<a href>` is unaffected. No change needed.

## Verification

After the change:
1. `https://help.oqlio.com/` → 302 → `https://help.oqlio.com/help` → renders the Help Centre.
2. Click "Help" in the marketing header → opens the Help Centre.
3. Click "Help Center" in the marketing footer → opens the Help Centre.
4. `https://oqlio.com/help` → still renders the Help Centre on the apex domain (unchanged behaviour, used for crawlers and direct deep links).

## Out of scope

- No DNS or domain configuration changes — `help.oqlio.com` is already connected as a custom domain pointing at the same project, which is correct.
- No changes to Help Centre content, search, or layout.
