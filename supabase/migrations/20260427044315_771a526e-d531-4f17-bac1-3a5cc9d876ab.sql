
-- =========================================================================
-- BATCH 6: Access Control & System Governance
-- =========================================================================

-- ---------- TEAMS ---------------------------------------------------------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  name text not null,
  slug text not null,
  color text default '#6366f1',
  description text,
  lead_user_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);
alter table public.teams enable row level security;

create or replace function public.is_team_lead(_team_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teams where id = _team_id and lead_user_id = _user_id);
$$;

create policy "members read teams" on public.teams for select to authenticated
  using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "admins write teams ins" on public.teams for insert to authenticated
  with check (is_admin(auth.uid()) or is_member_of(company_id));
create policy "admins write teams upd" on public.teams for update to authenticated
  using (is_admin(auth.uid()) or lead_user_id = auth.uid())
  with check (is_admin(auth.uid()) or lead_user_id = auth.uid());
create policy "admins write teams del" on public.teams for delete to authenticated
  using (is_admin(auth.uid()));

create trigger trg_teams_updated before update on public.teams
  for each row execute function public.set_updated_at();

-- ---------- TEAM MEMBERS --------------------------------------------------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null,
  is_lead boolean not null default false,
  added_by uuid,
  added_at timestamptz not null default now(),
  unique (team_id, user_id)
);
alter table public.team_members enable row level security;

create or replace function public.team_company_id(_team_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.teams where id = _team_id;
$$;

create policy "members read team_members" on public.team_members for select to authenticated
  using (is_admin(auth.uid()) or is_member_of(public.team_company_id(team_id)));
create policy "admins write team_members ins" on public.team_members for insert to authenticated
  with check (is_admin(auth.uid()) or public.is_team_lead(team_id, auth.uid()));
create policy "admins write team_members upd" on public.team_members for update to authenticated
  using (is_admin(auth.uid()) or public.is_team_lead(team_id, auth.uid()))
  with check (is_admin(auth.uid()) or public.is_team_lead(team_id, auth.uid()));
create policy "admins write team_members del" on public.team_members for delete to authenticated
  using (is_admin(auth.uid()) or public.is_team_lead(team_id, auth.uid()));

-- ---------- PERMISSIONS CATALOG ------------------------------------------
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,           -- e.g. 'workforce.attendance.read'
  module text not null,               -- e.g. 'workforce'
  action text not null,               -- 'read' | 'write' | 'delete' | 'manage'
  label text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.permissions enable row level security;

create policy "auth read permissions" on public.permissions for select to authenticated
  using (true);
create policy "super_admin write permissions ins" on public.permissions for insert to authenticated
  with check (is_super_admin(auth.uid()));
create policy "super_admin write permissions upd" on public.permissions for update to authenticated
  using (is_super_admin(auth.uid())) with check (is_super_admin(auth.uid()));
create policy "super_admin write permissions del" on public.permissions for delete to authenticated
  using (is_super_admin(auth.uid()));

-- ---------- ROLE → PERMISSIONS MATRIX ------------------------------------
create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role app_role not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid,
  unique (role, permission_key)
);
alter table public.role_permissions enable row level security;

create policy "admin read role_permissions" on public.role_permissions for select to authenticated
  using (is_admin(auth.uid()));
create policy "super_admin write role_permissions ins" on public.role_permissions for insert to authenticated
  with check (is_super_admin(auth.uid()));
create policy "super_admin write role_permissions del" on public.role_permissions for delete to authenticated
  using (is_super_admin(auth.uid()));

-- has_permission helper -----------------------------------------------------
create or replace function public.has_permission(_user_id uuid, _key text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role = ur.role
    where ur.user_id = _user_id and rp.permission_key = _key
  );
$$;

-- ---------- PLATFORM SETTINGS --------------------------------------------
create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,  -- enforce single row
  brand_name text not null default 'Oqlio',
  product_name text not null default 'Punchly',
  support_email text not null default 'support@oqlio.com',
  default_plan_code text default 'starter',
  default_currency text not null default 'INR',
  default_timezone text not null default 'Asia/Kolkata',
  logo_url text,
  primary_color text default '#6366f1',
  role_labels jsonb not null default '{}'::jsonb,
  security jsonb not null default jsonb_build_object(
    'enforce_2fa', false,
    'idle_timeout_minutes', 60,
    'max_concurrent_sessions', 5,
    'ip_allowlist', '',
    'password_min_length', 10,
    'require_symbol', true,
    'require_number', true,
    'hibp_check', true
  ),
  email jsonb not null default '{}'::jsonb,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.platform_settings enable row level security;

create policy "admin read platform_settings" on public.platform_settings for select to authenticated
  using (is_admin(auth.uid()));
create policy "super_admin write platform_settings ins" on public.platform_settings for insert to authenticated
  with check (is_super_admin(auth.uid()));
create policy "super_admin write platform_settings upd" on public.platform_settings for update to authenticated
  using (is_super_admin(auth.uid())) with check (is_super_admin(auth.uid()));

create trigger trg_platform_settings_updated before update on public.platform_settings
  for each row execute function public.set_updated_at();

-- Seed singleton row
insert into public.platform_settings (singleton) values (true) on conflict do nothing;

-- ---------- BACKUP SNAPSHOTS ---------------------------------------------
create table if not exists public.backup_snapshots (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',          -- pending|running|ready|failed
  table_count int default 0,
  row_count bigint default 0,
  size_bytes bigint default 0,
  download_url text,
  error text,
  requested_by uuid,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.backup_snapshots enable row level security;

create policy "super_admin read backups" on public.backup_snapshots for select to authenticated
  using (is_super_admin(auth.uid()));
create policy "super_admin write backups ins" on public.backup_snapshots for insert to authenticated
  with check (is_super_admin(auth.uid()));
create policy "super_admin write backups upd" on public.backup_snapshots for update to authenticated
  using (is_super_admin(auth.uid())) with check (is_super_admin(auth.uid()));
create policy "super_admin write backups del" on public.backup_snapshots for delete to authenticated
  using (is_super_admin(auth.uid()));

-- ---------- AUDIT LOG HELPER ---------------------------------------------
create or replace function public.log_audit(
  _action text,
  _entity_type text default null,
  _entity_id text default null,
  _diff jsonb default null,
  _company_id uuid default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  _id uuid;
begin
  insert into public.audit_logs (actor_id, company_id, action, entity_type, entity_id, diff)
  values (auth.uid(), _company_id, _action, _entity_type, _entity_id, _diff)
  returning id into _id;
  return _id;
end;
$$;

-- =========================================================================
-- SEED PERMISSIONS CATALOG
-- =========================================================================
insert into public.permissions (key, module, action, label, sort_order) values
  -- dashboard
  ('dashboard.read',                'dashboard',     'read',   'View dashboards',                10),
  ('dashboard.platform.read',       'dashboard',     'read',   'View platform-wide dashboards',  11),
  -- customers
  ('customers.companies.read',      'customers',     'read',   'View companies',                 20),
  ('customers.companies.write',     'customers',     'write',  'Edit companies',                 21),
  ('customers.contacts.read',       'customers',     'read',   'View contacts',                  22),
  ('customers.contacts.write',      'customers',     'write',  'Edit contacts',                  23),
  ('customers.usage.read',          'customers',     'read',   'View usage analytics',           24),
  -- workforce
  ('workforce.employees.read',      'workforce',     'read',   'View employees',                 30),
  ('workforce.employees.write',     'workforce',     'write',  'Edit employees',                 31),
  ('workforce.attendance.read',     'workforce',     'read',   'View attendance',                32),
  ('workforce.attendance.write',    'workforce',     'write',  'Edit attendance',                33),
  ('workforce.timesheets.read',     'workforce',     'read',   'View timesheets',                34),
  ('workforce.timesheets.write',    'workforce',     'write',  'Approve timesheets',             35),
  ('workforce.shifts.write',        'workforce',     'write',  'Manage shifts',                  36),
  ('workforce.leave.write',         'workforce',     'write',  'Approve leave',                  37),
  ('workforce.holidays.write',      'workforce',     'write',  'Manage holidays',                38),
  -- billing
  ('billing.plans.read',            'billing',       'read',   'View plans',                     40),
  ('billing.plans.write',           'billing',       'write',  'Edit plans',                     41),
  ('billing.subscriptions.read',    'billing',       'read',   'View subscriptions',             42),
  ('billing.subscriptions.write',   'billing',       'write',  'Manage subscriptions',           43),
  ('billing.invoices.read',         'billing',       'read',   'View invoices',                  44),
  ('billing.invoices.write',        'billing',       'write',  'Issue/edit invoices',            45),
  ('billing.payments.read',         'billing',       'read',   'View payments',                  46),
  ('billing.coupons.write',         'billing',       'write',  'Manage coupons',                 47),
  -- leads / crm
  ('leads.read',                    'leads',         'read',   'View leads',                     50),
  ('leads.write',                   'leads',         'write',  'Edit leads',                     51),
  -- cms
  ('cms.pages.write',               'cms',           'write',  'Edit website pages',             60),
  ('cms.blogs.write',               'cms',           'write',  'Publish blog posts',             61),
  ('cms.media.write',               'cms',           'write',  'Manage media',                   62),
  ('cms.seo.write',                 'cms',           'write',  'Edit SEO settings',              63),
  -- support
  ('support.tickets.read',          'support',       'read',   'View tickets',                   70),
  ('support.tickets.write',         'support',       'write',  'Reply to tickets',               71),
  ('support.kb.write',              'support',       'write',  'Edit knowledge base',            72),
  -- analytics
  ('analytics.read',                'analytics',     'read',   'View analytics',                 80),
  -- access control
  ('access.users.read',             'access',        'read',   'View users',                     90),
  ('access.users.write',            'access',        'write',  'Assign / revoke roles',          91),
  ('access.roles.write',            'access',        'write',  'Edit role permissions',          92),
  ('access.teams.write',            'access',        'write',  'Manage teams',                   93),
  -- integrations
  ('integrations.read',             'integrations',  'read',   'View integrations',             100),
  ('integrations.write',            'integrations',  'write',  'Configure integrations',        101),
  ('integrations.apikeys.write',    'integrations',  'write',  'Create / revoke API keys',      102),
  ('integrations.webhooks.write',   'integrations',  'write',  'Manage webhooks',               103),
  -- system
  ('system.settings.read',          'system',        'read',   'View platform settings',        110),
  ('system.settings.write',         'system',        'write',  'Edit platform settings',        111),
  ('system.audit.read',             'system',        'read',   'View audit logs',               112),
  ('system.security.write',         'system',        'write',  'Edit security policy',          113),
  ('system.backups.write',          'system',        'write',  'Request backups',               114)
on conflict (key) do nothing;

-- =========================================================================
-- SEED DEFAULT ROLE → PERMISSIONS GRANTS
-- =========================================================================
do $$
declare
  perm record;
begin
  -- super_admin: ALL permissions
  for perm in select key from public.permissions loop
    insert into public.role_permissions (role, permission_key) values ('super_admin', perm.key)
    on conflict do nothing;
  end loop;

  -- admin: all except system.security.write & system.backups.write
  for perm in select key from public.permissions
    where key not in ('system.security.write','system.backups.write') loop
    insert into public.role_permissions (role, permission_key) values ('admin', perm.key)
    on conflict do nothing;
  end loop;

  -- viewer: only *.read
  for perm in select key from public.permissions where action = 'read' loop
    insert into public.role_permissions (role, permission_key) values ('viewer', perm.key)
    on conflict do nothing;
  end loop;

  -- finance: billing + customers.read + analytics.read + dashboard
  for perm in select key from public.permissions
    where module = 'billing' or key in ('customers.companies.read','customers.contacts.read','analytics.read','dashboard.read','dashboard.platform.read') loop
    insert into public.role_permissions (role, permission_key) values ('finance', perm.key)
    on conflict do nothing;
  end loop;

  -- sales: leads + customers + dashboard.read + analytics.read + billing.plans.read + billing.coupons.write
  for perm in select key from public.permissions
    where module = 'leads' or module = 'customers'
       or key in ('dashboard.read','analytics.read','billing.plans.read','billing.coupons.write') loop
    insert into public.role_permissions (role, permission_key) values ('sales', perm.key)
    on conflict do nothing;
  end loop;

  -- support: support + customers.contacts.read + dashboard.read + leads.read
  for perm in select key from public.permissions
    where module = 'support' or key in ('customers.contacts.read','dashboard.read','leads.read') loop
    insert into public.role_permissions (role, permission_key) values ('support', perm.key)
    on conflict do nothing;
  end loop;

  -- hr: workforce + dashboard.read + customers.contacts.read + analytics.read
  for perm in select key from public.permissions
    where module = 'workforce' or key in ('dashboard.read','customers.contacts.read','analytics.read') loop
    insert into public.role_permissions (role, permission_key) values ('hr', perm.key)
    on conflict do nothing;
  end loop;

  -- developer: integrations + system.audit.read + dashboard.read
  for perm in select key from public.permissions
    where module = 'integrations' or key in ('system.audit.read','dashboard.read') loop
    insert into public.role_permissions (role, permission_key) values ('developer', perm.key)
    on conflict do nothing;
  end loop;

  -- manager: workforce.read + workforce.timesheets.write + workforce.leave.write + dashboard.read
  for perm in select key from public.permissions
    where key in (
      'workforce.employees.read','workforce.attendance.read','workforce.timesheets.read',
      'workforce.timesheets.write','workforce.leave.write','workforce.shifts.write','dashboard.read'
    ) loop
    insert into public.role_permissions (role, permission_key) values ('manager', perm.key)
    on conflict do nothing;
  end loop;

  -- employee: minimal self-service
  for perm in select key from public.permissions
    where key in ('dashboard.read','workforce.attendance.read','workforce.timesheets.read') loop
    insert into public.role_permissions (role, permission_key) values ('employee', perm.key)
    on conflict do nothing;
  end loop;
end $$;

-- helpful indexes
create index if not exists idx_team_members_team on public.team_members(team_id);
create index if not exists idx_team_members_user on public.team_members(user_id);
create index if not exists idx_role_permissions_role on public.role_permissions(role);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);
