import { createFileRoute } from "@tanstack/react-router";

const routes = [
  "", "/features", "/pricing", "/industries", "/mobile-app", "/about", "/contact", "/demo",
  "/help", "/blog", "/careers", "/privacy", "/terms", "/security", "/gdpr", "/refund-policy",
  "/attendance-management-system", "/time-tracking-software", "/employee-timesheet-software",
  "/gps-attendance-app", "/biometric-attendance-software", "/shift-management-software",
  "/overtime-management-system", "/employee-check-in-app", "/payroll-attendance-integration",
  "/attendance-app-india",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const today = new Date().toISOString().slice(0, 10);
        const urls = routes.map((p) => `  <url>\n    <loc>${origin}${p || "/"}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
