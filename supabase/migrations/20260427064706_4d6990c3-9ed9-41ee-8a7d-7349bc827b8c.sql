-- Add admin-controllable marketing fields to plans
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS popular boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS comparison jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Allow public (anon) to read active+public plans for the marketing pricing page
DROP POLICY IF EXISTS "public read active public plans" ON public.plans;
CREATE POLICY "public read active public plans"
  ON public.plans FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND is_public = true);

-- Pricing analytics events (insert-only from public; admins can read)
CREATE TABLE IF NOT EXISTS public.pricing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,            -- 'toggle' | 'cta_click' | 'plan_hover' | 'compare_open' | 'view'
  plan_code text,
  cycle text,                          -- 'monthly' | 'yearly'
  currency text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_agent text,
  referrer text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pricing_events_event_type_chk
    CHECK (char_length(event_type) BETWEEN 1 AND 64),
  CONSTRAINT pricing_events_plan_code_chk
    CHECK (plan_code IS NULL OR char_length(plan_code) <= 64),
  CONSTRAINT pricing_events_cycle_chk
    CHECK (cycle IS NULL OR cycle IN ('monthly','yearly')),
  CONSTRAINT pricing_events_currency_chk
    CHECK (currency IS NULL OR char_length(currency) <= 8)
);

CREATE INDEX IF NOT EXISTS pricing_events_created_at_idx
  ON public.pricing_events (created_at DESC);
CREATE INDEX IF NOT EXISTS pricing_events_event_plan_idx
  ON public.pricing_events (event_type, plan_code);

ALTER TABLE public.pricing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can log pricing events" ON public.pricing_events;
CREATE POLICY "anyone can log pricing events"
  ON public.pricing_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(event_type) BETWEEN 1 AND 64
    AND (plan_code IS NULL OR char_length(plan_code) <= 64)
    AND (cycle IS NULL OR cycle IN ('monthly','yearly'))
    AND (currency IS NULL OR char_length(currency) <= 8)
    AND octet_length(metadata::text) <= 4096
  );

DROP POLICY IF EXISTS "admins read pricing events" ON public.pricing_events;
CREATE POLICY "admins read pricing events"
  ON public.pricing_events FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'finance'::app_role));