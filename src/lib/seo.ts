/**
 * SEO helper for Oqlio (company) + Punchly (product) brand model.
 *
 * - SITE_NAME is always "Oqlio" (used in og:site_name).
 * - Product pages get titles like "Punchly — Pricing | Oqlio".
 * - Company pages get titles like "About | Oqlio".
 * - Canonical domain is https://oqlio.com (apex).
 */
export const SITE_NAME = "Oqlio";
export const PRODUCT_NAME = "Punchly";
export const SITE_URL = "https://oqlio.com";
export const DEFAULT_OG = `${SITE_URL}/og-default.jpg`;

export type SeoKind = "product" | "company";

export interface SeoInput {
  /** Page-specific title fragment, e.g. "Pricing" or "About". */
  title: string;
  description: string;
  path: string;
  /** Override full og/twitter title if you don't want auto-formatting. */
  fullTitle?: string;
  /** Defaults to "company" — pass "product" for Punchly product pages. */
  kind?: SeoKind;
  image?: string;
  noindex?: boolean;
}

export function formatTitle(title: string, kind: SeoKind = "company") {
  return kind === "product"
    ? `${PRODUCT_NAME} — ${title} | ${SITE_NAME}`
    : `${title} | ${SITE_NAME}`;
}

export function seo(input: SeoInput) {
  const url = `${SITE_URL}${input.path === "/" ? "" : input.path}`;
  const image = input.image ?? DEFAULT_OG;
  const fullTitle = input.fullTitle ?? formatTitle(input.title, input.kind);
  const meta: Array<{ name?: string; property?: string; content: string; charSet?: string; title?: string }> = [
    { title: fullTitle } as never,
    { name: "description", content: input.description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: input.description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: image },
  ];
  if (input.noindex) {
    meta.push({ name: "robots", content: "noindex,nofollow" });
  }
  return {
    meta,
    links: [{ rel: "canonical", href: url }],
  };
}

export function jsonLd(data: Record<string, unknown> | Array<Record<string, unknown>>) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data),
  };
}

export const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [],
};

export const PUNCHLY_SOFTWARE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: PRODUCT_NAME,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  url: SITE_URL,
  brand: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "1284" },
};
