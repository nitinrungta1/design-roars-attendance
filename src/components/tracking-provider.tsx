import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { startAutoTracking, trackPageView, hasConsent } from "@/lib/tracking";
import { supabase } from "@/integrations/supabase/client";

type Settings = {
  meta_pixel_id?: string | null;
  ga4_id?: string | null;
  gtm_id?: string | null;
  clarity_id?: string | null;
  cookie_consent_required?: boolean | null;
};

let pixelsLoaded = false;

function loadPixels(s: Settings) {
  if (pixelsLoaded || typeof window === "undefined") return;
  pixelsLoaded = true;

  // Meta Pixel
  if (s.meta_pixel_id) {
    const id = s.meta_pixel_id;
    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any) {
      if (f.fbq) return;
      const n: any = (f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      });
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      const t = b.createElement(e);
      t.async = true;
      t.src = v;
      const s0 = b.getElementsByTagName(e)[0];
      s0.parentNode.insertBefore(t, s0);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    (window as any).fbq("init", id);
    (window as any).fbq("track", "PageView");
    /* eslint-enable */
  }

  // GA4
  if (s.ga4_id) {
    const id = s.ga4_id;
    const el = document.createElement("script");
    el.async = true;
    el.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(el);
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: unknown[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;
    gtag("js", new Date());
    gtag("config", id, { send_page_view: true });
  }

  // GTM
  if (s.gtm_id) {
    const id = s.gtm_id;
    /* eslint-disable */
    (function (w: any, d: any, s: any, l: any, i: any) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      const f = d.getElementsByTagName(s)[0];
      const j = d.createElement(s);
      const dl = l !== "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", id);
    /* eslint-enable */
  }

  // Microsoft Clarity
  if (s.clarity_id) {
    const id = s.clarity_id;
    /* eslint-disable */
    (function (c: any, l: any, a: any, r: any, i: any) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      const t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      const y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", id);
    /* eslint-enable */
  }
}

export function TrackingProvider() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [settings, setSettings] = useState<Settings>({});

  // Fetch optional pixel IDs from public view.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await (supabase as any)
          .from("analytics_settings_public")
          .select("*")
          .maybeSingle();
        if (data) setSettings(data as Settings);
      } catch {
        /* ignore — analytics is optional */
      }
    })();
  }, []);

  // Start auto-tracking + load pixels.
  useEffect(() => {
    startAutoTracking();
    const consentRequired = settings.cookie_consent_required ?? false;
    if (!consentRequired || hasConsent()) {
      loadPixels(settings);
    }
    const handler = () => {
      if (hasConsent()) loadPixels(settings);
    };
    window.addEventListener("oq:consent-changed", handler);
    return () => window.removeEventListener("oq:consent-changed", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Fire page_view on route change (skip first — startAutoTracking did it).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!(window as any).__oq_pv_init) {
      (window as any).__oq_pv_init = true;
      return;
    }
    trackPageView();
    if ((window as any).fbq) (window as any).fbq("track", "PageView");
    if ((window as any).gtag && settings.ga4_id) {
      (window as any).gtag("event", "page_view", { page_path: pathname });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
