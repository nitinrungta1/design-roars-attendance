import { notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { CITY_BY_SLUG, getNearbyCities, type City } from "@/lib/seo/cities";
import {
  type SeoFaq,
  type SeoIndustry,
  type SeoService,
  type SeoTestimonial,
  type TemplateVars,
  fillFaqs,
  fillTemplate,
} from "@/lib/seo/types";
import { builtInFallbacks, buildIntro, industryHeroFallback } from "@/lib/seo/content";
import { SEO_SITE, bestServiceForIndustryInCityUrl, bestServiceInCityUrl, serviceForIndustryUrl } from "@/lib/seo/urls";

export type ResolvedSeoPage = {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  heroIntro: string;
  ctaText: string;
  intro: string;
  bodyHtml: string;
  faqs: SeoFaq[];
  testimonials: SeoTestimonial[];
  nearby: City[];
  url: string;
  serviceSlug: string;
  serviceName: string;
  citySlug?: string;
  cityName?: string;
  state?: string;
  industrySlug?: string;
  industryName?: string;
  painPoints?: string[];
  useCases?: string[];
  siblingIndustries?: { slug: string; name: string }[];
};

async function loadService(slug: string): Promise<SeoService | null> {
  const { data } = await supabase
    .from("seo_services" as any)
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as unknown as SeoService) ?? null;
}

async function loadIndustry(slug: string): Promise<SeoIndustry | null> {
  const { data } = await supabase
    .from("seo_industries" as any)
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as unknown as SeoIndustry) ?? null;
}

async function loadSiblingIndustries(excludeSlug?: string) {
  const { data } = await supabase
    .from("seo_industries" as any)
    .select("slug, name")
    .eq("status", "published")
    .limit(8);
  const rows = (data as unknown as { slug: string; name: string }[]) ?? [];
  return rows.filter((r) => r.slug !== excludeSlug).slice(0, 6);
}

export async function resolveServiceCity(serviceSlug: string, citySlug: string): Promise<ResolvedSeoPage> {
  const service = await loadService(serviceSlug);
  const city = CITY_BY_SLUG[citySlug];
  if (!service || !city) throw notFound();

  const { data: row } = await supabase
    .from("seo_city_pages" as any)
    .select("*")
    .eq("service_id", service.id)
    .eq("city_slug", citySlug)
    .eq("status", "published")
    .maybeSingle();

  const ov = (row as unknown as Partial<ResolvedSeoPage> & { nearby_slugs?: string[]; faqs?: SeoFaq[]; testimonials?: SeoTestimonial[]; body_html?: string }) ?? null;
  const vars: TemplateVars = { city: city.city, state: city.state, service: service.name };
  const fb = builtInFallbacks(service, city.city, city.state);

  const nearbyOverride = ov?.nearby_slugs ?? [];
  const nearby = nearbyOverride.length > 0
    ? nearbyOverride.map((s) => CITY_BY_SLUG[s]).filter(Boolean) as City[]
    : getNearbyCities(citySlug, 6);

  const siblingIndustries = await loadSiblingIndustries();

  return {
    metaTitle: ov?.metaTitle?.trim() || fillTemplate(service.default_meta_title_tpl, vars, fb.metaTitle),
    metaDescription: ov?.metaDescription?.trim() || fillTemplate(service.default_meta_description_tpl, vars, fb.metaDescription),
    h1: ov?.h1?.trim() || fillTemplate(service.default_h1_tpl, vars, fb.h1),
    heroIntro: ov?.heroIntro?.trim() || fillTemplate(service.default_hero_intro_tpl, vars, fb.heroIntro),
    ctaText: ov?.ctaText?.trim() || fillTemplate(service.default_cta_text_tpl, vars, fb.ctaText),
    intro: buildIntro(vars, `${service.slug}:${citySlug}`),
    bodyHtml: ov?.body_html ?? "",
    faqs: (ov?.faqs && ov.faqs.length > 0) ? fillFaqs(ov.faqs, vars) : fillFaqs(service.default_faqs, vars),
    testimonials: (ov?.testimonials && ov.testimonials.length > 0) ? ov.testimonials : (service.default_testimonials ?? []),
    nearby,
    url: `${SEO_SITE}${bestServiceInCityUrl(serviceSlug, citySlug)}`,
    serviceSlug, serviceName: service.name,
    citySlug, cityName: city.city, state: city.state,
    siblingIndustries,
  };
}

export async function resolveServiceIndustry(serviceSlug: string, industrySlug: string): Promise<ResolvedSeoPage> {
  const service = await loadService(serviceSlug);
  const industry = await loadIndustry(industrySlug);
  if (!service || !industry) throw notFound();

  const { data: row } = await supabase
    .from("seo_industry_pages" as any)
    .select("*")
    .eq("service_id", service.id)
    .eq("industry_slug", industrySlug)
    .eq("status", "published")
    .maybeSingle();

  const ov = (row as unknown as Partial<ResolvedSeoPage> & { faqs?: SeoFaq[]; testimonials?: SeoTestimonial[]; body_html?: string }) ?? null;
  const vars: TemplateVars = { service: service.name, industry: industry.name };

  const fb = builtInFallbacks(service, null, null);
  const heroIntro = ov?.heroIntro?.trim() || industryHeroFallback(industry, null);
  const siblingIndustries = await loadSiblingIndustries(industrySlug);

  return {
    metaTitle: ov?.metaTitle?.trim() || `${service.noun} for ${industry.name} — Punchly`,
    metaDescription: ov?.metaDescription?.trim() || `Punchly is the ${service.noun.toLowerCase()} built for ${industry.noun}. ${industry.hero_blurb ?? ""}`.trim(),
    h1: ov?.h1?.trim() || `${service.name} for ${industry.name}`,
    heroIntro,
    ctaText: ov?.ctaText?.trim() || `Start your free Punchly trial for ${industry.name.toLowerCase()}`,
    intro: buildIntro(vars, `${service.slug}:${industrySlug}`),
    bodyHtml: ov?.body_html ?? "",
    faqs: (ov?.faqs && ov.faqs.length > 0) ? fillFaqs(ov.faqs, vars) : fillFaqs(industry.default_faqs.length > 0 ? industry.default_faqs : service.default_faqs, vars),
    testimonials: (ov?.testimonials && ov.testimonials.length > 0) ? ov.testimonials : (service.default_testimonials ?? []),
    nearby: [],
    url: `${SEO_SITE}${serviceForIndustryUrl(serviceSlug, industrySlug)}`,
    serviceSlug, serviceName: service.name,
    industrySlug, industryName: industry.name,
    painPoints: industry.pain_points, useCases: industry.use_cases,
    siblingIndustries,
    // unused but typed
    state: undefined,
    ...{} as Partial<{ metaDescription: string }>,
  } as ResolvedSeoPage & { intro: string };
}

export async function resolveServiceIndustryCity(
  serviceSlug: string, industrySlug: string, citySlug: string,
): Promise<ResolvedSeoPage> {
  const service = await loadService(serviceSlug);
  const industry = await loadIndustry(industrySlug);
  const city = CITY_BY_SLUG[citySlug];
  if (!service || !industry || !city) throw notFound();

  const { data: row } = await supabase
    .from("seo_industry_city_pages" as any)
    .select("*")
    .eq("service_id", service.id)
    .eq("industry_slug", industrySlug)
    .eq("city_slug", citySlug)
    .eq("status", "published")
    .maybeSingle();

  const ov = (row as unknown as Partial<ResolvedSeoPage> & { nearby_slugs?: string[]; faqs?: SeoFaq[]; testimonials?: SeoTestimonial[]; body_html?: string }) ?? null;
  const vars: TemplateVars = { city: city.city, state: city.state, service: service.name, industry: industry.name };

  const nearby = (ov?.nearby_slugs && ov.nearby_slugs.length > 0)
    ? ov.nearby_slugs.map((s) => CITY_BY_SLUG[s]).filter(Boolean) as City[]
    : getNearbyCities(citySlug, 6);

  const siblingIndustries = await loadSiblingIndustries(industrySlug);

  return {
    metaTitle: ov?.metaTitle?.trim() || `Best ${service.noun} for ${industry.name} in ${city.city} (2026) — Punchly`,
    metaDescription: ov?.metaDescription?.trim() || `Punchly is the best ${service.noun.toLowerCase()} for ${industry.noun} in ${city.city}, ${city.state}. GPS check-ins, shift scheduling, payroll-ready reports.`,
    h1: ov?.h1?.trim() || `Best ${service.noun.toLowerCase()} for ${industry.name.toLowerCase()} in ${city.city}`,
    heroIntro: ov?.heroIntro?.trim() || `${industryHeroFallback(industry, city.city)} Built for ${city.city} teams.`,
    ctaText: ov?.ctaText?.trim() || `Start your free trial for ${industry.name.toLowerCase()} in ${city.city}`,
    intro: buildIntro(vars, `${service.slug}:${industrySlug}:${citySlug}`),
    bodyHtml: ov?.body_html ?? "",
    faqs: (ov?.faqs && ov.faqs.length > 0) ? fillFaqs(ov.faqs, vars) : fillFaqs(industry.default_faqs.length > 0 ? industry.default_faqs : service.default_faqs, vars),
    testimonials: (ov?.testimonials && ov.testimonials.length > 0) ? ov.testimonials : (service.default_testimonials ?? []),
    nearby,
    url: `${SEO_SITE}${bestServiceForIndustryInCityUrl(serviceSlug, industrySlug, citySlug)}`,
    serviceSlug, serviceName: service.name,
    citySlug, cityName: city.city, state: city.state,
    industrySlug, industryName: industry.name,
    painPoints: industry.pain_points, useCases: industry.use_cases,
    siblingIndustries,
  };
}

export function jsonLdFor(page: ResolvedSeoPage) {
  const out: Record<string, unknown>[] = [];
  out.push({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Punchly",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    url: page.url,
    brand: { "@type": "Organization", name: "Oqlio", url: SEO_SITE },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "1284" },
  });
  if (page.cityName) {
    out.push({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${page.url}#localbusiness`,
      name: `Punchly — ${page.serviceName} in ${page.cityName}`,
      description: page.metaDescription,
      url: page.url,
      areaServed: page.state ? { "@type": "AdministrativeArea", name: page.state } : undefined,
    });
  }
  if (page.faqs.length > 0) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  const crumbs: { name: string; href: string }[] = [{ name: "Home", href: SEO_SITE }];
  if (page.industryName && page.industrySlug)
    crumbs.push({ name: page.industryName, href: `${SEO_SITE}${serviceForIndustryUrl(page.serviceSlug, page.industrySlug)}` });
  if (page.cityName) crumbs.push({ name: page.cityName, href: page.url });
  out.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.href,
    })),
  });
  return out;
}

export function seoHeadFor(page: ResolvedSeoPage) {
  return {
    meta: [
      { title: page.metaTitle },
      { name: "description", content: page.metaDescription },
      { property: "og:title", content: page.metaTitle },
      { property: "og:description", content: page.metaDescription },
      { property: "og:url", content: page.url },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Oqlio" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: page.metaTitle },
      { name: "twitter:description", content: page.metaDescription },
    ],
    links: [{ rel: "canonical", href: page.url }],
    scripts: jsonLdFor(page).map((j) => ({
      type: "application/ld+json",
      children: JSON.stringify(j),
    })),
  };
}
