-- Marketing lead capture tables
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  phone text,
  message text,
  source text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  team_size text,
  preferred_time text,
  message text,
  source text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_created_at on public.leads (created_at desc);
create index if not exists idx_subscribers_created_at on public.subscribers (created_at desc);
create index if not exists idx_demo_requests_created_at on public.demo_requests (created_at desc);

alter table public.leads enable row level security;
alter table public.subscribers enable row level security;
alter table public.demo_requests enable row level security;

-- Public can submit (anon + authenticated)
create policy "anyone can insert leads"
  on public.leads for insert
  to anon, authenticated
  with check (true);

create policy "anyone can insert subscribers"
  on public.subscribers for insert
  to anon, authenticated
  with check (true);

create policy "anyone can insert demo requests"
  on public.demo_requests for insert
  to anon, authenticated
  with check (true);

-- No SELECT/UPDATE/DELETE policies = nobody can read/modify until admin role is added.