/**
 * Build standard meta tags for a marketing route.
 * Used inside head() of createFileRoute.
 */
export const SITE_NAME = "Punchly";
export const SITE_URL = "https://punchly.app";
export const DEFAULT_OG = `${SITE_URL}/og-default.jpg`;

export interface SeoInput {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
}

export function seo(input: SeoInput) {
  const url = `${SITE_URL}${input.path === "/" ? "" : input.path}`;
  const image = input.image ?? DEFAULT_OG;
  const meta: Array<{ name?: string; property?: string; content: string; charSet?: string; title?: string }> = [
    { title: input.title } as never,
    { name: "description", content: input.description },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
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
