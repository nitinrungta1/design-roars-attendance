
do $$ begin
  create type public.holiday_scope_level as enum ('global','country','region','office','employee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.holiday_override_action as enum ('add','remove','move');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.floating_holiday_status as enum ('pending','approved','used','cancelled');
exception when duplicate_object then null; end $$;

alter table public.employees
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists city text,
  add column if not exists timezone text,
  add column if not exists holiday_policy_id uuid;

alter table public.holidays
  add column if not exists scope_level public.holiday_scope_level not null default 'global',
  add column if not exists office_location_id uuid references public.work_locations(id) on delete set null;

create table if not exists public.holiday_policies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  country_code text,
  region text,
  office_location_id uuid references public.work_locations(id) on delete set null,
  weekend_days int[] not null default '{0,6}',
  floating_quota int not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_holiday_policies_company on public.holiday_policies(company_id);

drop trigger if exists trg_holiday_policies_updated on public.holiday_policies;
create trigger trg_holiday_policies_updated
  before update on public.holiday_policies
  for each row execute function public.set_updated_at();

do $$ begin
  alter table public.employees
    add constraint employees_holiday_policy_fk
    foreign key (holiday_policy_id) references public.holiday_policies(id) on delete set null
    not valid;
exception when duplicate_object then null; end $$;

create table if not exists public.holiday_policy_holidays (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.holiday_policies(id) on delete cascade,
  name text not null,
  holiday_date date not null,
  type public.holiday_type not null default 'company',
  is_paid boolean not null default true,
  is_optional boolean not null default false,
  is_recurring boolean not null default false,
  region text,
  source_template_id uuid references public.holiday_templates(id) on delete set null,
  year int generated always as (extract(year from holiday_date)::int) stored,
  created_at timestamptz not null default now()
);
create index if not exists idx_pol_hols_policy on public.holiday_policy_holidays(policy_id);
create index if not exists idx_pol_hols_year on public.holiday_policy_holidays(year);

create table if not exists public.employee_holiday_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  policy_id uuid not null references public.holiday_policies(id) on delete cascade,
  scope_level public.holiday_scope_level not null,
  employee_id uuid references public.employees(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  location_id uuid references public.work_locations(id) on delete cascade,
  country_code text,
  region text,
  priority int not null default 100,
  created_at timestamptz not null default now()
);
create index if not exists idx_eha_company on public.employee_holiday_assignments(company_id);
create index if not exists idx_eha_employee on public.employee_holiday_assignments(employee_id);
create index if not exists idx_eha_policy on public.employee_holiday_assignments(policy_id);

create table if not exists public.employee_floating_holidays (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  holiday_date date not null,
  name text not null,
  year int generated always as (extract(year from holiday_date)::int) stored,
  status public.floating_holiday_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists idx_efh_employee_year on public.employee_floating_holidays(employee_id, year);

create table if not exists public.holiday_overrides (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  holiday_date date not null,
  action public.holiday_override_action not null,
  original_date date,
  name text,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_overrides_employee on public.holiday_overrides(employee_id);

insert into public.permissions(key, module, action, label) values
  ('workforce.holidays.policies.read','workforce','read','View holiday policies'),
  ('workforce.holidays.policies.write','workforce','write','Manage holiday policies'),
  ('workforce.holidays.assign','workforce','write','Assign holiday policies')
on conflict (key) do nothing;

insert into public.role_permissions(role, permission_key)
select r.role, p.key
from (values ('super_admin'::app_role),('admin'::app_role),('hr'::app_role)) r(role),
     (values ('workforce.holidays.policies.read'),('workforce.holidays.policies.write'),('workforce.holidays.assign')) p(key)
on conflict do nothing;

insert into public.role_permissions(role, permission_key) values
  ('manager','workforce.holidays.policies.read'),
  ('manager','workforce.holidays.assign')
on conflict do nothing;

alter table public.holiday_policies enable row level security;
alter table public.holiday_policy_holidays enable row level security;
alter table public.employee_holiday_assignments enable row level security;
alter table public.employee_floating_holidays enable row level security;
alter table public.holiday_overrides enable row level security;

drop policy if exists pol_holiday_policies_read on public.holiday_policies;
create policy pol_holiday_policies_read on public.holiday_policies
  for select using (public.is_member_of(company_id) or public.is_super_admin(auth.uid()));

drop policy if exists pol_holiday_policies_write on public.holiday_policies;
create policy pol_holiday_policies_write on public.holiday_policies
  for all using (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(),'workforce.holidays.policies.write'))
  with check (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(),'workforce.holidays.policies.write'));

drop policy if exists pol_pol_hols_read on public.holiday_policy_holidays;
create policy pol_pol_hols_read on public.holiday_policy_holidays
  for select using (
    exists (select 1 from public.holiday_policies p
            where p.id = policy_id and (public.is_member_of(p.company_id) or public.is_super_admin(auth.uid())))
  );

drop policy if exists pol_pol_hols_write on public.holiday_policy_holidays;
create policy pol_pol_hols_write on public.holiday_policy_holidays
  for all using (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(),'workforce.holidays.policies.write'))
  with check (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(),'workforce.holidays.policies.write'));

drop policy if exists pol_eha_read on public.employee_holiday_assignments;
create policy pol_eha_read on public.employee_holiday_assignments
  for select using (public.is_member_of(company_id) or public.is_super_admin(auth.uid()));

drop policy if exists pol_eha_write on public.employee_holiday_assignments;
create policy pol_eha_write on public.employee_holiday_assignments
  for all using (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(),'workforce.holidays.assign'))
  with check (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(),'workforce.holidays.assign'));

drop policy if exists pol_efh_read on public.employee_floating_holidays;
create policy pol_efh_read on public.employee_floating_holidays
  for select using (
    public.is_super_admin(auth.uid())
    or exists (select 1 from public.employees e
               where e.id = employee_id and (e.user_id = auth.uid() or public.is_member_of(e.company_id)))
  );
drop policy if exists pol_efh_write on public.employee_floating_holidays;
create policy pol_efh_write on public.employee_floating_holidays
  for all using (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(),'workforce.holidays.write'))
  with check (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(),'workforce.holidays.write'));

drop policy if exists pol_overrides_read on public.holiday_overrides;
create policy pol_overrides_read on public.holiday_overrides
  for select using (
    public.is_super_admin(auth.uid())
    or exists (select 1 from public.employees e
               where e.id = employee_id and (e.user_id = auth.uid() or public.is_member_of(e.company_id)))
  );
drop policy if exists pol_overrides_write on public.holiday_overrides;
create policy pol_overrides_write on public.holiday_overrides
  for all using (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(),'workforce.holidays.write'))
  with check (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(),'workforce.holidays.write'));

create or replace function public.get_employee_holidays(_employee_id uuid, _year int)
returns table (
  holiday_date date,
  name text,
  type public.holiday_type,
  scope_level public.holiday_scope_level,
  is_paid boolean,
  is_optional boolean,
  source text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  emp record;
begin
  select e.id, e.company_id, e.country_code, e.region, e.default_location_id, e.holiday_policy_id
    into emp from public.employees e where e.id = _employee_id;
  if not found then return; end if;

  return query
  with company_layer as (
    select h.holiday_date, h.name, h.type, h.scope_level, h.is_paid, h.is_optional,
           ('company:'||h.scope_level::text)::text as source
    from public.holidays h
    where h.company_id = emp.company_id
      and h.year = _year
      and (
        h.scope_level = 'global'
        or (h.scope_level = 'country' and h.country_code is not distinct from emp.country_code)
        or (h.scope_level = 'region' and h.region is not distinct from emp.region)
        or (h.scope_level = 'office' and h.office_location_id is not distinct from emp.default_location_id)
      )
  ),
  policy_ids as (
    select distinct policy_id from (
      select emp.holiday_policy_id as policy_id where emp.holiday_policy_id is not null
      union all
      select a.policy_id from public.employee_holiday_assignments a
      where a.company_id = emp.company_id
        and (
          (a.scope_level = 'employee' and a.employee_id = emp.id)
          or (a.scope_level = 'office' and a.location_id is not distinct from emp.default_location_id)
          or (a.scope_level = 'country' and a.country_code is not distinct from emp.country_code)
          or (a.scope_level = 'region' and a.region is not distinct from emp.region)
          or (a.scope_level = 'global')
        )
    ) s
  ),
  policy_layer as (
    select ph.holiday_date, ph.name, ph.type, 'employee'::public.holiday_scope_level as scope_level,
           ph.is_paid, ph.is_optional, 'policy'::text as source
    from public.holiday_policy_holidays ph
    join policy_ids pi on pi.policy_id = ph.policy_id
    where ph.year = _year
  ),
  combined as (
    select * from company_layer
    union all
    select * from policy_layer
  ),
  with_overrides as (
    select c.* from combined c
    where not exists (
      select 1 from public.holiday_overrides o
      where o.employee_id = _employee_id
        and o.holiday_date = c.holiday_date
        and o.action = 'remove'
    )
    union all
    select o.holiday_date, coalesce(o.name,'Custom') as name, 'company'::public.holiday_type, 'employee'::public.holiday_scope_level,
           true, false, 'override:add'
    from public.holiday_overrides o
    where o.employee_id = _employee_id and o.action = 'add'
      and extract(year from o.holiday_date)::int = _year
  )
  select distinct on (holiday_date, name)
         holiday_date, name, type, scope_level, is_paid, is_optional, source
  from with_overrides
  order by holiday_date, name, scope_level;
end;
$$;

grant execute on function public.get_employee_holidays(uuid,int) to authenticated;
