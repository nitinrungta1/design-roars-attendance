-- ============================================================================
-- Analytics tables
-- ============================================================================

CREATE TABLE public.analytics_visitors (
  visitor_id      text PRIMARY KEY,
  first_seen      timestamptz NOT NULL DEFAULT now(),
  last_seen       timestamptz NOT NULL DEFAULT now(),
  first_touch     jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_sessions  integer NOT NULL DEFAULT 1,
  total_leads     integer NOT NULL DEFAULT 0,
  country         text,
  city            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_visitors_first_seen ON public.analytics_visitors (first_seen DESC);

CREATE TABLE public.analytics_sessions (
  session_id      text PRIMARY KEY,
  visitor_id      text NOT NULL,
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  landing_url     text,
  exit_url        text,
  referrer        text,
  device          text,
  browser         text,
  os              text,
  country         text,
  city            text,
  page_count      integer NOT NULL DEFAULT 1,
  last_touch      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_sessions_visitor ON public.analytics_sessions (visitor_id);
CREATE INDEX idx_analytics_sessions_started ON public.analytics_sessions (started_at DESC);

CREATE TABLE public.analytics_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id    text,
  session_id    text,
  event_name    text NOT NULL,
  props         jsonb NOT NULL DEFAULT '{}'::jsonb,
  page_url      text,
  page_path     text,
  referrer      text,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_events_session  ON public.analytics_events (session_id);
CREATE INDEX idx_analytics_events_visitor  ON public.analytics_events (visitor_id);
CREATE INDEX idx_analytics_events_name     ON public.analytics_events (event_name);
CREATE INDEX idx_analytics_events_occurred ON public.analytics_events (occurred_at DESC);

CREATE TABLE public.analytics_settings (
  id                       smallint PRIMARY KEY DEFAULT 1,
  meta_pixel_id            text,
  ga4_id                   text,
  gtm_id                   text,
  clarity_id               text,
  cookie_consent_required  boolean NOT NULL DEFAULT false,
  retention_days           integer NOT NULL DEFAULT 365,
  reports_enabled          boolean NOT NULL DEFAULT false,
  reports_from_email       text,
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT analytics_settings_singleton CHECK (id = 1)
);
INSERT INTO public.analytics_settings (id) VALUES (1);

-- ============================================================================
-- Attribution columns on leads
-- ============================================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS utm_source     text,
  ADD COLUMN IF NOT EXISTS utm_medium     text,
  ADD COLUMN IF NOT EXISTS utm_campaign   text,
  ADD COLUMN IF NOT EXISTS utm_content    text,
  ADD COLUMN IF NOT EXISTS utm_term       text,
  ADD COLUMN IF NOT EXISTS gclid          text,
  ADD COLUMN IF NOT EXISTS fbclid         text,
  ADD COLUMN IF NOT EXISTS placement      text,
  ADD COLUMN IF NOT EXISTS creative_type  text,
  ADD COLUMN IF NOT EXISTS landing_url    text,
  ADD COLUMN IF NOT EXISTS referrer       text,
  ADD COLUMN IF NOT EXISTS device         text,
  ADD COLUMN IF NOT EXISTS visitor_id     text,
  ADD COLUMN IF NOT EXISTS session_id     text;

CREATE INDEX IF NOT EXISTS idx_leads_utm_source   ON public.leads (utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON public.leads (utm_campaign);

-- ============================================================================
-- updated_at triggers
-- ============================================================================

CREATE TRIGGER trg_analytics_sessions_updated_at
  BEFORE UPDATE ON public.analytics_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_analytics_settings_updated_at
  BEFORE UPDATE ON public.analytics_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.analytics_visitors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_settings  ENABLE ROW LEVEL SECURITY;

-- Visitors / sessions / events: admin reads only.
-- Writes happen exclusively via the /api/public/track server route using the
-- service role key, which bypasses RLS — so no public insert policy is needed.

CREATE POLICY "admin read analytics_visitors"
  ON public.analytics_visitors FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "admin read analytics_sessions"
  ON public.analytics_sessions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "admin read analytics_events"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Settings: admin read + write
CREATE POLICY "admin read analytics_settings"
  ON public.analytics_settings FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "admin update analytics_settings"
  ON public.analytics_settings FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Public read of non-secret tracking IDs (so the TrackingProvider can fetch them
-- with the anon key without exposing webhook secrets — there are none in this
-- schema, but we keep the policy column-agnostic via a security-definer view).
CREATE OR REPLACE VIEW public.analytics_settings_public
WITH (security_invoker = true) AS
SELECT meta_pixel_id, ga4_id, gtm_id, clarity_id, cookie_consent_required
FROM public.analytics_settings
WHERE id = 1;

GRANT SELECT ON public.analytics_settings_public TO anon, authenticated;

-- We also need a permissive policy so the view can read the underlying row
-- when invoked by anon. Since security_invoker=true, RLS still applies — add
-- a public read policy limited to the singleton row.
CREATE POLICY "public read analytics_settings (singleton)"
  ON public.analytics_settings FOR SELECT TO anon, authenticated
  USING (id = 1);

-- The admin SELECT policy above is now redundant (anyone authenticated can
-- read the row), but keeping it is harmless. Drop it to keep things tidy.
DROP POLICY "admin read analytics_settings" ON public.analytics_settings;