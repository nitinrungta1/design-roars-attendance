-- enums
do $$ begin
  create type public.job_posting_status as enum ('draft','published','archived','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.job_employment_type as enum ('full_time','part_time','contract','internship');
exception when duplicate_object then null; end $$;

create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  department text,
  location text,
  employment_type public.job_employment_type not null default 'full_time',
  summary text,
  description text,
  salary_min numeric,
  salary_max numeric,
  salary_currency text default 'INR',
  apply_url text,
  status public.job_posting_status not null default 'draft',
  order_index integer not null default 0,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_job_postings_status_order on public.job_postings (status, order_index);
create index if not exists idx_job_postings_published on public.job_postings (published_at desc) where status = 'published';

alter table public.job_postings enable row level security;

drop policy if exists "public read job_postings published" on public.job_postings;
create policy "public read job_postings published"
  on public.job_postings for select
  to anon, authenticated
  using (status = 'published' or public.is_admin(auth.uid()));

drop policy if exists "admin write job_postings ins" on public.job_postings;
create policy "admin write job_postings ins"
  on public.job_postings for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "admin write job_postings upd" on public.job_postings;
create policy "admin write job_postings upd"
  on public.job_postings for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "admin write job_postings del" on public.job_postings;
create policy "admin write job_postings del"
  on public.job_postings for delete
  to authenticated
  using (public.is_admin(auth.uid()));

drop trigger if exists trg_job_postings_updated_at on public.job_postings;
create trigger trg_job_postings_updated_at
before update on public.job_postings
for each row execute function public.set_updated_at();