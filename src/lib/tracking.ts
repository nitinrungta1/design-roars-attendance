/**
 * Oqlio first-party analytics SDK.
 * - Captures UTM/click-IDs/referrer on first visit (first-touch in localStorage, 1y).
 * - Tracks last-touch in a session cookie (30-min sliding).
 * - Generates stable visitor_id (localStorage) + session_id (cookie).
 * - Batches events and POSTs to /api/public/track.
 *
 * Safe to import in any client code; all browser checks are guarded.
 */

const VISITOR_KEY = "oq_vid";
const FIRST_TOUCH_KEY = "oq_first_touch";
const LAST_TOUCH_KEY = "oq_last_touch";
const SESSION_COOKIE = "oq_sid";
const CONSENT_COOKIE = "oq_consent";
const SESSION_TTL_MIN = 30;
const VISITOR_TTL_DAYS = 365;

export type TouchData = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;
  fbclid?: string;
  gclid?: string;
  msclkid?: string;
  ad_id?: string;
  placement?: string;
  creative_type?: string;
  referrer?: string;
  landing_url?: string;
  landing_path?: string;
  device?: string;
  browser?: string;
  os?: string;
  captured_at?: string;
};

type TrackEvent = {
  event_name: string;
  props?: Record<string, unknown>;
  page_url?: string;
  page_path?: string;
  referrer?: string;
  occurred_at: string;
};

const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

function uuid(): string {
  if (isBrowser() && typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function setCookie(name: string, value: string, ttlMinutes: number) {
  if (!isBrowser()) return;
  const exp = new Date(Date.now() + ttlMinutes * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function detectDevice(): { device: string; browser: string; os: string } {
  if (!isBrowser()) return { device: "unknown", browser: "unknown", os: "unknown" };
  const ua = navigator.userAgent;
  const isTablet = /iPad|Tablet/i.test(ua);
  const isMobile = /Mobi|Android|iPhone/i.test(ua) && !isTablet;
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let browser = "other";
  if (/Edg\//.test(ua)) browser = "edge";
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "chrome";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "safari";
  else if (/Firefox\//.test(ua)) browser = "firefox";

  let os = "other";
  if (/Windows/i.test(ua)) os = "windows";
  else if (/Mac OS/i.test(ua)) os = "macos";
  else if (/Android/i.test(ua)) os = "android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "ios";
  else if (/Linux/i.test(ua)) os = "linux";

  return { device, browser, os };
}

function inferPlacement(t: Partial<TouchData>): string | undefined {
  const src = (t.utm_source || "").toLowerCase();
  const med = (t.utm_medium || "").toLowerCase();
  const camp = (t.utm_campaign || "").toLowerCase();
  if (t.fbclid || /facebook|instagram|meta/.test(src)) {
    if (/reel/.test(camp) || /reel/.test(med)) return "reels";
    if (/story|stories/.test(camp) || /story/.test(med)) return "story";
    if (/feed/.test(camp) || /feed/.test(med)) return "feed";
    return "social_paid";
  }
  if (t.gclid || /google/.test(src)) {
    if (/display/.test(med) || /display/.test(camp)) return "display";
    if (/youtube/.test(src) || /youtube/.test(camp)) return "youtube";
    return "search";
  }
  if (med === "organic") return "organic";
  if (med === "referral") return "referral";
  return undefined;
}

function inferCreativeType(t: Partial<TouchData>): string | undefined {
  const c = (t.utm_content || "").toLowerCase();
  const camp = (t.utm_campaign || "").toLowerCase();
  if (/reel|video|vid/.test(c) || /reel|video/.test(camp)) return "video";
  if (/image|img|static/.test(c)) return "image";
  if (/carousel|carrousel/.test(c)) return "carousel";
  if (/text|search/.test(c)) return "text";
  return undefined;
}

function captureCurrentTouch(): TouchData {
  if (!isBrowser()) return { captured_at: new Date().toISOString() };
  const url = new URL(window.location.href);
  const q = url.searchParams;
  const td: TouchData = {
    utm_source: q.get("utm_source") || undefined,
    utm_medium: q.get("utm_medium") || undefined,
    utm_campaign: q.get("utm_campaign") || undefined,
    utm_content: q.get("utm_content") || undefined,
    utm_term: q.get("utm_term") || undefined,
    utm_id: q.get("utm_id") || undefined,
    fbclid: q.get("fbclid") || undefined,
    gclid: q.get("gclid") || undefined,
    msclkid: q.get("msclkid") || undefined,
    ad_id: q.get("ad_id") || q.get("adid") || undefined,
    placement: q.get("placement") || undefined,
    creative_type: q.get("creative") || q.get("creative_type") || undefined,
    referrer: document.referrer || undefined,
    landing_url: window.location.href,
    landing_path: window.location.pathname,
    captured_at: new Date().toISOString(),
    ...detectDevice(),
  };
  if (!td.placement) td.placement = inferPlacement(td);
  if (!td.creative_type) td.creative_type = inferCreativeType(td);
  if (!td.utm_source && !td.fbclid && !td.gclid && !td.msclkid) {
    if (td.referrer) {
      try {
        const refHost = new URL(td.referrer).hostname;
        if (refHost && refHost !== window.location.hostname) {
          td.utm_source = refHost.replace(/^www\./, "");
          td.utm_medium = /google|bing|duckduckgo|yahoo/.test(refHost) ? "organic" : "referral";
          if (!td.placement) td.placement = td.utm_medium;
        } else {
          td.utm_source = "direct";
          td.utm_medium = "none";
          td.placement = td.placement || "direct";
        }
      } catch {
        td.utm_source = "direct";
        td.utm_medium = "none";
      }
    } else {
      td.utm_source = "direct";
      td.utm_medium = "none";
      td.placement = td.placement || "direct";
    }
  }
  return td;
}

function readJSON<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function getVisitorId(): string {
  if (!isBrowser()) return "ssr-noop";
  let vid = window.localStorage.getItem(VISITOR_KEY);
  if (!vid) {
    vid = uuid();
    try {
      window.localStorage.setItem(VISITOR_KEY, vid);
    } catch {
      /* ignore */
    }
  }
  return vid;
}

export function getSessionId(): string {
  if (!isBrowser()) return "ssr-noop";
  let sid = getCookie(SESSION_COOKIE);
  if (!sid) sid = uuid();
  setCookie(SESSION_COOKIE, sid, SESSION_TTL_MIN);
  return sid;
}

export function getFirstTouch(): TouchData {
  const stored = readJSON<TouchData>(FIRST_TOUCH_KEY);
  if (stored) return stored;
  const t = captureCurrentTouch();
  writeJSON(FIRST_TOUCH_KEY, t);
  return t;
}

export function refreshLastTouch(): TouchData {
  const t = captureCurrentTouch();
  writeJSON(LAST_TOUCH_KEY, t);
  return t;
}

export function getLastTouch(): TouchData {
  return readJSON<TouchData>(LAST_TOUCH_KEY) ?? getFirstTouch();
}

export function getAttribution() {
  const visitor_id = getVisitorId();
  const session_id = getSessionId();
  const first = getFirstTouch();
  const last = getLastTouch();
  const dev = detectDevice();
  return { visitor_id, session_id, first, last, ...dev };
}

export function hasConsent(): boolean {
  return getCookie(CONSENT_COOKIE) === "granted";
}

export function setConsent(granted: boolean) {
  setCookie(CONSENT_COOKIE, granted ? "granted" : "denied", 60 * 24 * 365);
  if (isBrowser()) window.dispatchEvent(new Event("oq:consent-changed"));
}

export function consentDecisionMade(): boolean {
  const v = getCookie(CONSENT_COOKIE);
  return v === "granted" || v === "denied";
}

// ---------------------------------------------------------------------------
// Event queue — batches and flushes via fetch keepalive / sendBeacon.
// ---------------------------------------------------------------------------
const queue: TrackEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let started = false;

function flush(useBeacon = false) {
  if (!isBrowser() || queue.length === 0) return;
  const events = queue.splice(0, queue.length);
  const payload = JSON.stringify({
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    first_touch: getFirstTouch(),
    last_touch: getLastTouch(),
    events,
  });
  const url = "/api/public/track";
  try {
    if (useBeacon && "sendBeacon" in navigator) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      /* swallow */
    });
  } catch {
    /* swallow */
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush(false);
  }, 1500);
}

export function track(event_name: string, props?: Record<string, unknown>) {
  if (!isBrowser()) return;
  queue.push({
    event_name,
    props: props ?? {},
    page_url: window.location.href,
    page_path: window.location.pathname,
    referrer: document.referrer || undefined,
    occurred_at: new Date().toISOString(),
  });
  if (queue.length >= 10) flush(false);
  else scheduleFlush();
}

/** Idempotent — safe to call multiple times. */
export function startAutoTracking() {
  if (!isBrowser() || started) return;
  started = true;

  getVisitorId();
  getFirstTouch();
  refreshLastTouch();

  const wasNew = !getCookie(SESSION_COOKIE + "_seen");
  getSessionId();
  setCookie(SESSION_COOKIE + "_seen", "1", SESSION_TTL_MIN);
  if (wasNew) track("session_start");

  track("page_view");

  // Scroll depth.
  const seen = new Set<number>();
  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = window.scrollY + window.innerHeight;
    const max = h.scrollHeight;
    if (max <= 0) return;
    const pct = Math.round((scrolled / max) * 100);
    [25, 50, 75, 100].forEach((bucket) => {
      if (pct >= bucket && !seen.has(bucket)) {
        seen.add(bucket);
        track("scroll_depth", { depth: bucket });
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // Time on page on unload.
  const startedAt = Date.now();
  const sendUnload = () => {
    track("time_on_page", { seconds: Math.round((Date.now() - startedAt) / 1000) });
    flush(true);
  };
  window.addEventListener("pagehide", sendUnload);
  window.addEventListener("beforeunload", sendUnload);

  // Delegated click tracking.
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest<HTMLElement>("a, button, [data-track]");
      if (!el) return;
      const trackName = el.getAttribute("data-track");
      const href = el.getAttribute("href") || "";
      const text = (el.textContent || "").trim().slice(0, 80);

      if (trackName) {
        track(trackName, { text, href });
        return;
      }
      if (href.startsWith("https://wa.me") || href.includes("whatsapp")) {
        track("whatsapp_click", { href, text });
        return;
      }
      if (href.startsWith("tel:")) {
        track("phone_click", { href, text });
        return;
      }
      if (href.startsWith("mailto:")) {
        track("email_click", { href, text });
        return;
      }
      if (/\.(pdf|zip|docx?|xlsx?|pptx?)$/i.test(href)) {
        track("download_click", { href, text });
        return;
      }
      try {
        if (href && /^https?:/.test(href)) {
          const u = new URL(href, window.location.origin);
          if (u.hostname && u.hostname !== window.location.hostname) {
            track("outbound_click", { href, text, host: u.hostname });
          }
        }
      } catch {
        /* ignore */
      }
    },
    { capture: true }
  );

  // Form open/submit.
  document.addEventListener(
    "focusin",
    (e) => {
      const t = e.target as HTMLElement | null;
      const form = t?.closest("form");
      if (form && !form.dataset.oqFormOpened) {
        form.dataset.oqFormOpened = "1";
        track("form_open", { form_id: form.id || form.getAttribute("name") || "unknown" });
      }
    },
    { capture: true }
  );
  document.addEventListener(
    "submit",
    (e) => {
      const form = e.target as HTMLFormElement | null;
      if (form) {
        track("form_submit", { form_id: form.id || form.getAttribute("name") || "unknown" });
      }
    },
    { capture: true }
  );
}

/** SPA navigation hook — call on route change. */
export function trackPageView() {
  if (!isBrowser()) return;
  refreshLastTouch();
  getSessionId();
  track("page_view");
}

export const __internal = { VISITOR_TTL_DAYS, SESSION_TTL_MIN };
