import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePermission } from "@/integrations/supabase/permission-middleware";
import type { SeoFaq, SeoIndustry, SeoService, SeoTestimonial } from "@/lib/seo/types";

const guard = requirePermission("cms.seo.write");

const faqSchema = z.object({ q: z.string(), a: z.string() });
const testimonialSchema = z.object({ quote: z.string(), name: z.string(), role: z.string() });

// ============================================================
// Services
// ============================================================
export const listSeoServices = createServerFn({ method: "POST" })
  .middleware([guard])
  .handler(async ({ context }): Promise<{ services: SeoService[] }> => {
    const sb = (context as { supabase: unknown }).supabase as { from: (t: string) => any };
    const { data } = await sb.from("seo_services").select("*").order("name");
    return { services: (data ?? []) as SeoService[] };
  });

const serviceInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  noun: z.string().min(1).max(120),
  tagline: z.string().max(300).nullable().optional(),
  default_meta_title_tpl: z.string().max(300).nullable().optional(),
  default_meta_description_tpl: z.string().max(500).nullable().optional(),
  default_h1_tpl: z.string().max(300).nullable().optional(),
  default_hero_intro_tpl: z.string().max(1000).nullable().optional(),
  default_cta_text_tpl: z.string().max(200).nullable().optional(),
  default_faqs: z.array(faqSchema).max(20).default([]),
  default_testimonials: z.array(testimonialSchema).max(10).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const upsertSeoService = createServerFn({ method: "POST" })
  .middleware([guard])
  .inputValidator((input) => serviceInputSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true; id: string } | { ok: false; error: string }> => {
    const sb = (context as { supabase: unknown }).supabase as { from: (t: string) => any };
    const { data: row, error } = await sb.from("seo_services").upsert(data, { onConflict: "slug" }).select("id").single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: (row as { id: string }).id };
  });

export const deleteSeoService = createServerFn({ method: "POST" })
  .middleware([guard])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    const sb = (context as { supabase: unknown }).supabase as { from: (t: string) => any };
    const { error } = await sb.from("seo_services").delete().eq("id", data.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  });

// ============================================================
// Industries
// ============================================================
export const listSeoIndustries = createServerFn({ method: "POST" })
  .middleware([guard])
  .handler(async ({ context }): Promise<{ industries: SeoIndustry[] }> => {
    const sb = (context as { supabase: unknown }).supabase as { from: (t: string) => any };
    const { data } = await sb.from("seo_industries").select("*").order("name");
    return { industries: (data ?? []) as SeoIndustry[] };
  });

const industryInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  noun: z.string().min(1).max(120),
  hero_blurb: z.string().max(1000).nullable().optional(),
  pain_points: z.array(z.string().max(300)).max(12).default([]),
  use_cases: z.array(z.string().max(300)).max(12).default([]),
  default_faqs: z.array(faqSchema).max(20).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const upsertSeoIndustry = createServerFn({ method: "POST" })
  .middleware([guard])
  .inputValidator((input) => industryInputSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true; id: string } | { ok: false; error: string }> => {
    const sb = (context as { supabase: unknown }).supabase as { from: (t: string) => any };
    const { data: row, error } = await sb.from("seo_industries").upsert(data, { onConflict: "slug" }).select("id").single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: (row as { id: string }).id };
  });

export const deleteSeoIndustry = createServerFn({ method: "POST" })
  .middleware([guard])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    const sb = (context as { supabase: unknown }).supabase as { from: (t: string) => any };
    const { error } = await sb.from("seo_industries").delete().eq("id", data.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  });

// ============================================================
// Per-page overrides (city / industry / industry+city)
// ============================================================
export type OverrideKind = "city" | "industry" | "industry-city";

const TABLE: Record<OverrideKind, string> = {
  city: "seo_city_pages",
  industry: "seo_industry_pages",
  "industry-city": "seo_industry_city_pages",
};

export interface OverrideRow {
  id: string;
  service_id: string;
  city_slug?: string | null;
  industry_slug?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  h1?: string | null;
  heroIntro?: string | null;
  ctaText?: string | null;
  body_html?: string | null;
  faqs?: SeoFaq[] | null;
  testimonials?: SeoTestimonial[] | null;
  nearby_slugs?: string[] | null;
  status: "draft" | "published";
}

export const listSeoOverrides = createServerFn({ method: "POST" })
  .middleware([guard])
  .inputValidator((input) => z.object({ kind: z.enum(["city", "industry", "industry-city"]) }).parse(input))
  .handler(async ({ data, context }): Promise<{ rows: OverrideRow[] }> => {
    const sb = (context as { supabase: unknown }).supabase as { from: (t: string) => any };
    const { data: rows } = await sb.from(TABLE[data.kind]).select("*").order("updated_at", { ascending: false }).limit(500);
    const mapped: OverrideRow[] = ((rows ?? []) as any[]).map((r) => ({
      id: r.id,
      service_id: r.service_id,
      city_slug: r.city_slug ?? null,
      industry_slug: r.industry_slug ?? null,
      metaTitle: r.meta_title ?? null,
      metaDescription: r.meta_description ?? null,
      h1: r.h1 ?? null,
      heroIntro: r.hero_intro ?? null,
      ctaText: r.cta_text ?? null,
      body_html: r.body_html ?? null,
      faqs: r.faqs ?? null,
      testimonials: r.testimonials ?? null,
      nearby_slugs: r.nearby_slugs ?? null,
      status: r.status,
    }));
    return { rows: mapped };
  });

const overrideInputSchema = z.object({
  kind: z.enum(["city", "industry", "industry-city"]),
  id: z.string().uuid().optional(),
  service_id: z.string().uuid(),
  city_slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
  industry_slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
  metaTitle: z.string().max(300).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  h1: z.string().max(300).nullable().optional(),
  heroIntro: z.string().max(1000).nullable().optional(),
  ctaText: z.string().max(200).nullable().optional(),
  body_html: z.string().max(40000).nullable().optional(),
  faqs: z.array(faqSchema).max(20).nullable().optional(),
  testimonials: z.array(testimonialSchema).max(10).nullable().optional(),
  nearby_slugs: z.array(z.string()).max(12).nullable().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const upsertSeoOverride = createServerFn({ method: "POST" })
  .middleware([guard])
  .inputValidator((input) => overrideInputSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    const sb = (context as { supabase: unknown }).supabase as { from: (t: string) => any };
    const { kind, metaTitle, metaDescription, heroIntro, ctaText, ...rest } = data;
    if (kind === "city" && !rest.city_slug) return { ok: false, error: "city_slug required" };
    if (kind === "industry" && !rest.industry_slug) return { ok: false, error: "industry_slug required" };
    if (kind === "industry-city" && (!rest.industry_slug || !rest.city_slug))
      return { ok: false, error: "industry_slug and city_slug required" };
    const row: Record<string, unknown> = { ...rest };
    if (metaTitle !== undefined) row.meta_title = metaTitle;
    if (metaDescription !== undefined) row.meta_description = metaDescription;
    if (heroIntro !== undefined) row.hero_intro = heroIntro;
    if (ctaText !== undefined) row.cta_text = ctaText;
    const conflict =
      kind === "city" ? "service_id,city_slug"
      : kind === "industry" ? "service_id,industry_slug"
      : "service_id,industry_slug,city_slug";
    const { error } = await sb.from(TABLE[kind]).upsert(row, { onConflict: conflict });
    return error ? { ok: false, error: error.message } : { ok: true };
  });

export const deleteSeoOverride = createServerFn({ method: "POST" })
  .middleware([guard])
  .inputValidator((input) => z.object({ kind: z.enum(["city", "industry", "industry-city"]), id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    const sb = (context as { supabase: unknown }).supabase as { from: (t: string) => any };
    const { error } = await sb.from(TABLE[data.kind]).delete().eq("id", data.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  });
