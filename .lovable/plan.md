I confirmed the live issue: `https://help.oqlio.com` is being redirected by hosting/domain configuration to `https://oqlio.com/` before the app code runs. That means the app-level fix in `__root.tsx` never gets a chance to route it to the Help Centre.

I’ll fix the user-facing problem by making the site stop depending on `help.oqlio.com` for navigation.

## Plan

1. Update all header and footer Help links
   - Change the marketing header Help link from `https://help.oqlio.com` to the working in-app route `/help`.
   - Change the footer Help Center link to `/help`.
   - This will make clicks work immediately on `oqlio.com` and `www.oqlio.com` after publishing.

2. Update Help Centre internal navigation
   - Review `HelpLayout`, `HelpSearch`, article pages, category links, and support/contact links.
   - Keep Help Centre links on `/help` and `/help/:slug` so they work reliably on the main domain.

3. Remove broken public references to `help.oqlio.com`
   - Update SEO canonical URLs for Help Centre pages from `https://help.oqlio.com/...` to `https://oqlio.com/help/...`.
   - Update Help sitemap and robots references so search engines are not sent to the broken subdomain.

4. Keep the existing route fallback harmless
   - Leave or simplify the existing host-detection redirect so it doesn’t break anything if the domain configuration is later changed.
   - The key fix is not relying on that redirect because the domain currently redirects before the app receives the request.

## Important note about `help.oqlio.com`

The actual subdomain itself is not failing because of the React app. It is redirecting at the domain/hosting layer to the primary domain. App code cannot override that redirect.

If you want `help.oqlio.com` to show the Help Centre directly, the domain setup needs to be changed outside the app routing, for example by using a separate Help Centre deployment/project for that subdomain or a DNS/proxy redirect from `help.oqlio.com` to `https://oqlio.com/help`.

After this app fix, the Help links in the header and footer will work by using `https://oqlio.com/help` instead of the currently broken subdomain.

<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>