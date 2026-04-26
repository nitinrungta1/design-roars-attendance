-- ============================================================
-- BATCH 1: Multi-tenant foundation
-- ============================================================

-- 1. Extend app_role enum -------------------------------------
alter type public.app_role add value if not exists 'sales';
alter type public.app_role add value if not exists 'support';
alter type public.app_role add value if not exists 'finance';
alter type public.app_role add value if not exists 'developer';
alter type public.app_role add value if not exists 'viewer';

-- 2. Add company_id to existing tables (nullable) -------------
alter table public.profiles
  add column if not exists company_id uuid references public.companies(id) on delete set null;
create index if not exists idx_profiles_company on public.profiles(company_id);

alter table public.leads
  add column if not exists company_id uuid references public.companies(id) on delete set null;
create index if not exists idx_leads_company on public.leads(company_id);

alter table public.demo_requests
  add column if not exists company_id uuid references public.companies(id) on delete set null;
create index if not exists idx_demo_requests_company on public.demo_requests(company_id);

-- 3. company_members (user ↔ company ↔ role-in-company) -------
create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'employee',
  is_owner boolean not null default false,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  unique (company_id, user_id)
);
create index idx_company_members_user on public.company_members(user_id);
create index idx_company_members_company on public.company_members(company_id);

alter table public.company_members enable row level security;

-- Helper: is this user a member of this company?
create or replace function public.is_member_of(_company_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.company_members
    where company_id = _company_id
      and user_id = auth.uid()
  );
$$;

-- Helper: which company does the current user primarily belong to?
create or replace function public.current_company_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select company_id from public.company_members
  where user_id = auth.uid()
  order by is_owner desc, joined_at asc
  limit 1;
$$;

create policy "members read own company memberships"
  on public.company_members for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "admins manage memberships insert"
  on public.company_members for insert to authenticated
  with check (public.is_admin(auth.uid()));

create policy "admins manage memberships update"
  on public.company_members for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins manage memberships delete"
  on public.company_members for delete to authenticated
  using (public.is_admin(auth.uid()));

-- 4. audit_logs (append-only) ---------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  action text not null,            -- e.g. 'role.granted', 'company.suspended'
  entity_type text,                -- e.g. 'user', 'company', 'invoice'
  entity_id text,                  -- free-form id (uuid string, etc.)
  diff jsonb,                      -- before/after, params, etc.
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_created on public.audit_logs(created_at desc);
create index idx_audit_logs_company on public.audit_logs(company_id, created_at desc);
create index idx_audit_logs_actor on public.audit_logs(actor_id, created_at desc);
create index idx_audit_logs_action on public.audit_logs(action, created_at desc);

alter table public.audit_logs enable row level security;

create policy "members read company audit logs"
  on public.audit_logs for select to authenticated
  using (
    public.is_admin(auth.uid())
    or (company_id is not null and public.is_member_of(company_id))
  );

create policy "system inserts audit logs"
  on public.audit_logs for insert to authenticated
  with check (actor_id = auth.uid() or public.is_admin(auth.uid()));
-- No update or delete policies → table is effectively append-only.

-- 5. notifications --------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  type text not null,              -- 'signup', 'payment_failed', 'ticket', etc.
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, created_at desc);
create index idx_notifications_unread
  on public.notifications(user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "users read own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "users mark own notifications read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "admins create notifications"
  on public.notifications for insert to authenticated
  with check (public.is_admin(auth.uid()));

-- 6. feature_flags --------------------------------------------
create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  key text not null,
  enabled boolean not null default false,
  payload jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  unique (company_id, key)
);
create index idx_feature_flags_company on public.feature_flags(company_id);

alter table public.feature_flags enable row level security;

create policy "members read flags"
  on public.feature_flags for select to authenticated
  using (
    company_id is null
    or public.is_member_of(company_id)
    or public.is_admin(auth.uid())
  );

create policy "admins write flags ins"
  on public.feature_flags for insert to authenticated
  with check (public.is_admin(auth.uid()));

create policy "admins write flags upd"
  on public.feature_flags for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins write flags del"
  on public.feature_flags for delete to authenticated
  using (public.is_admin(auth.uid()));

create trigger trg_feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.set_updated_at();

-- 7. Bootstrap: seed default Oqlio platform company + add existing super_admin(s) ------
do $$
declare
  v_company_id uuid;
  v_user_id uuid;
begin
  -- Reuse the existing seeded "Oqlio" company if present, else create
  select id into v_company_id from public.companies where slug = 'oqlio' limit 1;
  if v_company_id is null then
    insert into public.companies (name, slug, plan, is_default)
    values ('Oqlio', 'oqlio', 'enterprise', true)
    returning id into v_company_id;
  end if;

  -- Make every existing super_admin an owner of the Oqlio platform company
  for v_user_id in
    select user_id from public.user_roles where role = 'super_admin'
  loop
    insert into public.company_members (company_id, user_id, role, is_owner)
    values (v_company_id, v_user_id, 'super_admin', true)
    on conflict (company_id, user_id) do nothing;

    update public.profiles set company_id = v_company_id where id = v_user_id and company_id is null;
  end loop;
end $$;

-- 8. Update handle_new_user trigger to also link user to default company ---
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count int;
  default_company uuid;
begin
  -- Profile
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  select count(*) into user_count from auth.users;
  select id into default_company from public.companies where slug = 'oqlio' limit 1;

  if user_count <= 1 then
    -- First user: super_admin + owner of platform company
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin')
    on conflict (user_id, role) do nothing;
    if default_company is not null then
      insert into public.company_members (company_id, user_id, role, is_owner)
      values (default_company, new.id, 'super_admin', true)
      on conflict (company_id, user_id) do nothing;
      update public.profiles set company_id = default_company where id = new.id;
    end if;
  else
    -- Subsequent: plain employee, no auto-membership (admins invite explicitly)
    insert into public.user_roles (user_id, role) values (new.id, 'employee')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;