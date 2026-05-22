import { createFileRoute } from "@tanstack/react-router";
import { CITIES } from "@/lib/seo/cities";
import { bestServiceForIndustryInCityUrl, bestServiceInCityUrl, serviceForIndustryUrl } from "@/lib/seo/urls";

const HOST = "https://oqlio.com";

export const Route = createFileRoute("/sitemap-seo.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const today = new Date().toISOString().slice(0, 10);
        const sb = supabaseAdmin as unknown as { from: (t: string) => any };
        const { data: services } = await sb.from("seo_services").select("slug").eq("status", "published");
        const { data: industries } = await sb.from("seo_industries").select("slug").eq("status", "published");
        const svc = (services ?? []) as { slug: string }[];
        const inds = (industries ?? []) as { slug: string }[];

        const urls: string[] = [];
        for (const s of svc) {
          for (const c of CITIES) urls.push(bestServiceInCityUrl(s.slug, c.slug));
          for (const i of inds) urls.push(serviceForIndustryUrl(s.slug, i.slug));
          // Cap industry×city combos to avoid sitemap bloat — top 20 cities only.
          for (const i of inds) for (const c of CITIES.slice(0, 20))
            urls.push(bestServiceForIndustryInCityUrl(s.slug, i.slug, c.slug));
        }
        const body = urls
          .map((p) => `  <url><loc>${HOST}${p}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq></url>`)
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
