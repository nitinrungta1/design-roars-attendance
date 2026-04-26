-- =========================================================
-- Batch 3: Billing & Subscriptions
-- =========================================================

-- ENUMS
do $$ begin
  create type public.plan_tier as enum ('free','starter','growth','business','enterprise');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.billing_cycle as enum ('monthly','yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum ('trialing','active','past_due','canceled','paused','incomplete');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invoice_status as enum ('draft','open','paid','void','uncollectible');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending','succeeded','failed','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_provider as enum ('stripe','razorpay','paypal','manual','none');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.coupon_kind as enum ('percent','fixed');
exception when duplicate_object then null; end $$;

-- =========================================================
-- PLANS catalog
-- =========================================================
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  tier public.plan_tier not null default 'starter',
  description text,
  price_monthly numeric(12,2) not null default 0,
  price_yearly numeric(12,2) not null default 0,
  currency text not null default 'INR',
  employee_limit int,
  trial_days int not null default 14,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  is_public boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "anyone reads active public plans"
  on public.plans for select to authenticated, anon
  using (is_active = true and is_public = true);

create policy "admins read all plans"
  on public.plans for select to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'finance'));

create policy "admins write plans ins"
  on public.plans for insert to authenticated
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'finance'));

create policy "admins write plans upd"
  on public.plans for update to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'finance'))
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'finance'));

create policy "admins write plans del"
  on public.plans for delete to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'finance'));

create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

-- =========================================================
-- SUBSCRIPTIONS
-- =========================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  status public.subscription_status not null default 'trialing',
  cycle public.billing_cycle not null default 'monthly',
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  provider public.payment_provider not null default 'none',
  provider_subscription_id text,
  seats int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_company on public.subscriptions(company_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);

alter table public.subscriptions enable row level security;

create policy "members read subscriptions"
  on public.subscriptions for select to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance') or is_member_of(company_id));

create policy "admins write subscriptions ins"
  on public.subscriptions for insert to authenticated
  with check (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create policy "admins write subscriptions upd"
  on public.subscriptions for update to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance'))
  with check (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create policy "admins write subscriptions del"
  on public.subscriptions for delete to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- =========================================================
-- INVOICES
-- =========================================================
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  number text not null unique,
  status public.invoice_status not null default 'draft',
  currency text not null default 'INR',
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_due numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  hosted_pdf_url text,
  provider public.payment_provider not null default 'manual',
  provider_invoice_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_company on public.invoices(company_id);
create index if not exists idx_invoices_status on public.invoices(status);

alter table public.invoices enable row level security;

create policy "members read invoices"
  on public.invoices for select to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance') or is_member_of(company_id));

create policy "admins write invoices ins"
  on public.invoices for insert to authenticated
  with check (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create policy "admins write invoices upd"
  on public.invoices for update to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance'))
  with check (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create policy "admins write invoices del"
  on public.invoices for delete to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- =========================================================
-- PAYMENTS
-- =========================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'INR',
  status public.payment_status not null default 'pending',
  method text,
  provider public.payment_provider not null default 'manual',
  provider_charge_id text,
  failure_reason text,
  processed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_company on public.payments(company_id);
create index if not exists idx_payments_invoice on public.payments(invoice_id);

alter table public.payments enable row level security;

create policy "members read payments"
  on public.payments for select to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance') or is_member_of(company_id));

create policy "admins write payments ins"
  on public.payments for insert to authenticated
  with check (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create policy "admins write payments upd"
  on public.payments for update to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance'))
  with check (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create policy "admins write payments del"
  on public.payments for delete to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- =========================================================
-- TAX RATES
-- =========================================================
create table if not exists public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rate numeric(5,2) not null default 0,
  country text,
  region text,
  inclusive boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tax_rates enable row level security;

create policy "staff read tax_rates"
  on public.tax_rates for select to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create policy "admins write tax_rates ins"
  on public.tax_rates for insert to authenticated
  with check (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create policy "admins write tax_rates upd"
  on public.tax_rates for update to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance'))
  with check (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create policy "admins write tax_rates del"
  on public.tax_rates for delete to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create trigger tax_rates_set_updated_at
  before update on public.tax_rates
  for each row execute function public.set_updated_at();

-- =========================================================
-- COUPONS
-- =========================================================
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  kind public.coupon_kind not null default 'percent',
  value numeric(10,2) not null default 0,
  currency text default 'INR',
  max_redemptions int,
  redeemed_count int not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  applies_to_plan_ids uuid[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

create policy "staff read coupons"
  on public.coupons for select to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance') or has_role(auth.uid(),'sales'));

create policy "admins write coupons ins"
  on public.coupons for insert to authenticated
  with check (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create policy "admins write coupons upd"
  on public.coupons for update to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance'))
  with check (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create policy "admins write coupons del"
  on public.coupons for delete to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'finance'));

create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

-- =========================================================
-- SEED default plans
-- =========================================================
insert into public.plans (code, name, tier, description, price_monthly, price_yearly, currency, employee_limit, trial_days, features, sort_order)
values
  ('free', 'Free', 'free', 'Up to 5 employees. Forever free for tiny teams.', 0, 0, 'INR', 5, 0,
    '["Mobile check-in","Basic reports","1 admin"]'::jsonb, 10),
  ('starter', 'Starter', 'starter', 'For growing teams up to 25 employees.', 999, 9990, 'INR', 25, 14,
    '["Geo + selfie attendance","Shifts","CSV export","Email support"]'::jsonb, 20),
  ('growth', 'Growth', 'growth', 'Most popular. Up to 100 employees.', 2999, 29990, 'INR', 100, 14,
    '["Everything in Starter","Overtime rules","Leave policies","API access"]'::jsonb, 30),
  ('business', 'Business', 'business', 'Up to 500 employees, advanced workflows.', 7999, 79990, 'INR', 500, 14,
    '["Everything in Growth","SSO","Advanced analytics","Priority support"]'::jsonb, 40),
  ('enterprise', 'Enterprise', 'enterprise', 'Unlimited scale, custom contracts.', 0, 0, 'INR', null, 30,
    '["Everything in Business","SLA","Dedicated CSM","Custom integrations","White label"]'::jsonb, 50)
on conflict (code) do nothing;