import { createFileRoute } from "@tanstack/react-router";

const HOST = "https://oqlio.com/help";

export const Route = createFileRoute("/sitemap-help.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("kb_articles")
          .select("slug, updated_at")
          .eq("status", "published")
          .limit(5000);
        const today = new Date().toISOString().slice(0, 10);
        const urls = [
          `  <url><loc>${HOST}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq></url>`,
          ...((data ?? []) as Array<{ slug: string; updated_at: string }>).map(
            (a) =>
              `  <url><loc>${HOST}/${a.slug}</loc><lastmod>${a.updated_at.slice(0, 10)}</lastmod><changefreq>weekly</changefreq></url>`,
          ),
        ].join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
