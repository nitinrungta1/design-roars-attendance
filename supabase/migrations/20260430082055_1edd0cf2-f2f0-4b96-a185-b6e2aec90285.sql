-- Add permissions jsonb column to user_roles for per-user permission overrides
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;