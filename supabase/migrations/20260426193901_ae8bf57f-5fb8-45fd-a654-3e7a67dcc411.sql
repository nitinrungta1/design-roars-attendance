-- ============================================================
-- Phase 2: Auth, Roles, Profiles, Companies
-- ============================================================

-- 1. App role enum --------------------------------------------------
create type public.app_role as enum (
  'super_admin',
  'admin',
  'hr',
  'manager',
  'employee'
);

-- 2. Generic updated_at helper --------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. Profiles -------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  locale text not null default 'en',
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "authenticated reads profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 4. User roles -----------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id) on delete set null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security-definer role helpers (bypass RLS recursion) -------------
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_super_admin(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = 'super_admin'
  );
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('super_admin', 'admin')
  );
$$;

create or replace function public.is_attendance_admin(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('super_admin', 'admin', 'hr')
  );
$$;

create or replace function public.needs_bootstrap()
returns boolean
language sql stable security definer set search_path = public
as $$
  select not exists (select 1 from public.user_roles where role = 'super_admin');
$$;

-- RLS for user_roles ----------------------------------------------
create policy "users see own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "admins see all roles"
  on public.user_roles for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "admins insert roles"
  on public.user_roles for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy "admins update roles"
  on public.user_roles for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins delete roles"
  on public.user_roles for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- 5. Companies (multi-tenant scaffold) -----------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'free',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.companies enable row level security;

create policy "authenticated reads companies"
  on public.companies for select
  to authenticated
  using (true);

create policy "super_admin inserts companies"
  on public.companies for insert
  to authenticated
  with check (public.is_super_admin(auth.uid()));

create policy "super_admin updates companies"
  on public.companies for update
  to authenticated
  using (public.is_super_admin(auth.uid()))
  with check (public.is_super_admin(auth.uid()));

create policy "super_admin deletes companies"
  on public.companies for delete
  to authenticated
  using (public.is_super_admin(auth.uid()));

create trigger trg_companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

-- Seed default company
insert into public.companies (name, slug, plan, is_default)
values ('Oqlio', 'oqlio', 'enterprise', true);

-- 6. New-user trigger: profile + bootstrap super_admin ------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count int;
begin
  -- Create profile
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- First user becomes super_admin (bootstrap). Subsequent users are 'employee'.
  select count(*) into user_count from auth.users;
  if user_count <= 1 then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin')
    on conflict (user_id, role) do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'employee')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();