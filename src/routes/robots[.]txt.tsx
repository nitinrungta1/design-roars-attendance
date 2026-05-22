import { createFileRoute } from "@tanstack/react-router";
import { isHelpHost } from "@/lib/host";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const host = request.headers.get("host");
        const body = isHelpHost(host)
          ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\nDisallow: /signup\n\nSitemap: https://oqlio.com/sitemap-help.xml\n`
          : `User-agent: *\nAllow: /\n\nSitemap: https://oqlio.com/sitemap.xml\nSitemap: https://oqlio.com/sitemap-help.xml\nSitemap: https://oqlio.com/sitemap-seo.xml\n`;
        return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      },
    },
  },
});
