-- ============================================================
-- LEADS: pipeline fields
-- ============================================================
do $$ begin
  create type public.lead_status as enum (
    'new','contacted','demo_booked','trial','negotiation','won','lost'
  );
exception when duplicate_object then null; end $$;

alter table public.leads
  add column if not exists status public.lead_status not null default 'new',
  add column if not exists plan_interest text,
  add column if not exists assigned_to uuid,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_assigned on public.leads(assigned_to);
create index if not exists idx_leads_created on public.leads(created_at desc);

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- New SELECT/UPDATE policies for sales/support/admins (keep existing INSERT policy untouched)
drop policy if exists "staff read leads" on public.leads;
create policy "staff read leads"
on public.leads for select
to authenticated
using (
  is_admin(auth.uid())
  or has_role(auth.uid(), 'sales')
  or has_role(auth.uid(), 'support')
);

drop policy if exists "staff update leads" on public.leads;
create policy "staff update leads"
on public.leads for update
to authenticated
using (
  is_admin(auth.uid())
  or has_role(auth.uid(), 'sales')
  or has_role(auth.uid(), 'support')
)
with check (
  is_admin(auth.uid())
  or has_role(auth.uid(), 'sales')
  or has_role(auth.uid(), 'support')
);

-- ============================================================
-- CONTACTS table (CRM people)
-- ============================================================
do $$ begin
  create type public.contact_stage as enum (
    'subscriber','lead','mql','sql','customer','evangelist','other'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  title text,
  company_name text,
  company_id uuid references public.companies(id) on delete set null,
  stage public.contact_stage not null default 'lead',
  owner_id uuid,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_company on public.contacts(company_id);
create index if not exists idx_contacts_stage on public.contacts(stage);
create index if not exists idx_contacts_email on public.contacts(email);

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

alter table public.contacts enable row level security;

drop policy if exists "staff read contacts" on public.contacts;
create policy "staff read contacts"
on public.contacts for select
to authenticated
using (
  is_admin(auth.uid())
  or has_role(auth.uid(), 'sales')
  or has_role(auth.uid(), 'support')
);

drop policy if exists "staff insert contacts" on public.contacts;
create policy "staff insert contacts"
on public.contacts for insert
to authenticated
with check (
  is_admin(auth.uid())
  or has_role(auth.uid(), 'sales')
);

drop policy if exists "staff update contacts" on public.contacts;
create policy "staff update contacts"
on public.contacts for update
to authenticated
using (
  is_admin(auth.uid())
  or has_role(auth.uid(), 'sales')
)
with check (
  is_admin(auth.uid())
  or has_role(auth.uid(), 'sales')
);

drop policy if exists "admins delete contacts" on public.contacts;
create policy "admins delete contacts"
on public.contacts for delete
to authenticated
using (is_admin(auth.uid()));

-- ============================================================
-- USAGE METRICS table (daily company rollups)
-- ============================================================
create table if not exists public.usage_metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  metric_date date not null default current_date,
  employees int not null default 0,
  active_users int not null default 0,
  checkins int not null default 0,
  api_calls int not null default 0,
  storage_mb numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, metric_date)
);

create index if not exists idx_usage_company_date on public.usage_metrics(company_id, metric_date desc);

drop trigger if exists trg_usage_updated_at on public.usage_metrics;
create trigger trg_usage_updated_at
  before update on public.usage_metrics
  for each row execute function public.set_updated_at();

alter table public.usage_metrics enable row level security;

drop policy if exists "members read usage" on public.usage_metrics;
create policy "members read usage"
on public.usage_metrics for select
to authenticated
using (is_admin(auth.uid()) or is_member_of(company_id));

drop policy if exists "admins write usage ins" on public.usage_metrics;
create policy "admins write usage ins"
on public.usage_metrics for insert
to authenticated
with check (is_admin(auth.uid()));

drop policy if exists "admins write usage upd" on public.usage_metrics;
create policy "admins write usage upd"
on public.usage_metrics for update
to authenticated
using (is_admin(auth.uid()))
with check (is_admin(auth.uid()));
