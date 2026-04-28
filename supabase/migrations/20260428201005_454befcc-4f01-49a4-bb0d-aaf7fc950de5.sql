ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS price_per_user_monthly numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_per_user_yearly  numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_seats              integer       NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS included_seats         integer       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_model          text          NOT NULL DEFAULT 'per_user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plans_billing_model_check'
  ) THEN
    ALTER TABLE public.plans
      ADD CONSTRAINT plans_billing_model_check
      CHECK (billing_model IN ('flat','per_user','hybrid'));
  END IF;
END $$;

-- Backfill: switch paid plans to per-user pricing with sensible defaults.
UPDATE public.plans SET
  billing_model = 'per_user',
  price_per_user_monthly = 99,
  price_per_user_yearly  = ROUND(99 * 12 * 0.8),
  min_seats = 1,
  included_seats = 0,
  price_monthly = 0,
  price_yearly  = 0
WHERE code = 'starter';

UPDATE public.plans SET
  billing_model = 'per_user',
  price_per_user_monthly = 199,
  price_per_user_yearly  = ROUND(199 * 12 * 0.8),
  min_seats = 5,
  included_seats = 0,
  price_monthly = 0,
  price_yearly  = 0
WHERE code = 'growth';

UPDATE public.plans SET
  billing_model = 'per_user',
  price_per_user_monthly = 299,
  price_per_user_yearly  = ROUND(299 * 12 * 0.8),
  min_seats = 10,
  included_seats = 0,
  price_monthly = 0,
  price_yearly  = 0
WHERE code = 'business';

UPDATE public.plans SET
  billing_model = 'flat',
  price_per_user_monthly = 0,
  price_per_user_yearly  = 0,
  min_seats = 1,
  included_seats = 0
WHERE code = 'free';

UPDATE public.plans SET
  billing_model = 'flat',
  price_per_user_monthly = 0,
  price_per_user_yearly  = 0,
  min_seats = 1,
  included_seats = 0
WHERE code = 'enterprise';