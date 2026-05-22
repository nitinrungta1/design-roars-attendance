export type SeoFaq = { q: string; a: string };
export type SeoTestimonial = { quote: string; name: string; role: string };

export type SeoService = {
  id: string;
  slug: string;
  name: string;
  noun: string;
  tagline: string | null;
  default_meta_title_tpl: string | null;
  default_meta_description_tpl: string | null;
  default_h1_tpl: string | null;
  default_hero_intro_tpl: string | null;
  default_cta_text_tpl: string | null;
  default_faqs: SeoFaq[];
  default_testimonials: SeoTestimonial[];
  status: "draft" | "published";
};

export type SeoIndustry = {
  id: string;
  slug: string;
  name: string;
  noun: string;
  hero_blurb: string | null;
  pain_points: string[];
  use_cases: string[];
  default_faqs: SeoFaq[];
  status: "draft" | "published";
};

export type TemplateVars = {
  city?: string;
  state?: string;
  service?: string;
  industry?: string;
};

export function fillTemplate(
  tpl: string | null | undefined,
  vars: TemplateVars,
  fallback = "",
): string {
  if (!tpl) return fallback;
  return tpl
    .replaceAll("{city}", vars.city ?? "")
    .replaceAll("{state}", vars.state ?? "")
    .replaceAll("{service}", vars.service ?? "")
    .replaceAll("{industry}", vars.industry ?? "");
}

export function fillFaqs(faqs: SeoFaq[] | null | undefined, vars: TemplateVars): SeoFaq[] {
  if (!faqs || faqs.length === 0) return [];
  return faqs.map((f) => ({
    q: fillTemplate(f.q, vars, f.q),
    a: fillTemplate(f.a, vars, f.a),
  }));
}
