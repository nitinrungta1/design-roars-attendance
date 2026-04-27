/**
 * Server-only attribution helpers.
 * Used by /api/public/track.
 */

export type TouchData = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  utm_id?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  msclkid?: string | null;
  ad_id?: string | null;
  placement?: string | null;
  creative_type?: string | null;
  referrer?: string | null;
  landing_url?: string | null;
  landing_path?: string | null;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  captured_at?: string | null;
};

const SAFE_STRING = (v: unknown, max = 500): string | null => {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
};

export function sanitizeTouch(input: unknown): TouchData {
  if (!input || typeof input !== "object") return {};
  const o = input as Record<string, unknown>;
  return {
    utm_source: SAFE_STRING(o.utm_source, 200),
    utm_medium: SAFE_STRING(o.utm_medium, 200),
    utm_campaign: SAFE_STRING(o.utm_campaign, 300),
    utm_content: SAFE_STRING(o.utm_content, 300),
    utm_term: SAFE_STRING(o.utm_term, 300),
    utm_id: SAFE_STRING(o.utm_id, 200),
    fbclid: SAFE_STRING(o.fbclid, 500),
    gclid: SAFE_STRING(o.gclid, 500),
    msclkid: SAFE_STRING(o.msclkid, 500),
    ad_id: SAFE_STRING(o.ad_id, 200),
    placement: SAFE_STRING(o.placement, 80),
    creative_type: SAFE_STRING(o.creative_type, 80),
    referrer: SAFE_STRING(o.referrer, 2000),
    landing_url: SAFE_STRING(o.landing_url, 2000),
    landing_path: SAFE_STRING(o.landing_path, 1000),
    device: SAFE_STRING(o.device, 40),
    browser: SAFE_STRING(o.browser, 40),
    os: SAFE_STRING(o.os, 40),
    captured_at: SAFE_STRING(o.captured_at, 50),
  };
}
