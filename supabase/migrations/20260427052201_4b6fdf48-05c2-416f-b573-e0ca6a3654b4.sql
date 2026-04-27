-- ============================================================
-- Workforce Pro — Batch W1 schema
-- ============================================================

-- Enums (guarded)
do $$ begin
  create type public.schedule_status as enum ('draft','published','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.swap_status as enum ('pending','approved','rejected','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.correction_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.remote_status as enum ('pending','approved','rejected','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.asset_kind as enum ('laptop','phone','sim','id_card','accessory','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.asset_status as enum ('available','assigned','retired','lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_kind as enum ('offer_letter','nda','id_proof','contract','policy','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.announcement_audience as enum ('all','department','team','role');
exception when duplicate_object then null; end $$;

-- ============================================================
-- attendance_rules
-- ============================================================
create table if not exists public.attendance_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  name text not null,
  is_default boolean not null default false,
  -- time
  grace_minutes int not null default 10,
  late_after_minutes int not null default 15,
  half_day_after_minutes int not null default 120,
  auto_absent_no_checkin boolean not null default true,
  auto_checkout_after_shift boolean not null default false,
  early_exit_minutes int not null default 30,
  -- break
  allowed_break_minutes int not null default 60,
  excess_break_alert boolean not null default true,
  unpaid_break_after_minutes int not null default 90,
  -- overtime
  ot_after_minutes int not null default 540,
  weekend_ot_multiplier numeric(4,2) not null default 1.5,
  holiday_ot_multiplier numeric(4,2) not null default 2.0,
  -- shift
  night_shift_handling text not null default 'split_at_midnight',
  cross_midnight_allowed boolean not null default true,
  rotation_automation boolean not null default false,
  -- geo
  geo_radius_meters int not null default 100,
  allowed_ips text[] not null default '{}',
  -- payroll
  paid_hours_logic text not null default 'worked_minutes',
  deduction_logic text not null default 'half_day_threshold',
  half_day_calc text not null default 'less_than_240_minutes',
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_attendance_rules_company on public.attendance_rules(company_id);
create unique index if not exists uq_attendance_rules_default
  on public.attendance_rules(company_id) where is_default;

alter table public.attendance_rules enable row level security;
create policy "members read attendance_rules" on public.attendance_rules
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr write attendance_rules ins" on public.attendance_rules
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write attendance_rules upd" on public.attendance_rules
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write attendance_rules del" on public.attendance_rules
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

create trigger trg_attendance_rules_updated
  before update on public.attendance_rules
  for each row execute function public.set_updated_at();

-- ============================================================
-- schedules + schedule_entries
-- ============================================================
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  status public.schedule_status not null default 'draft',
  created_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_schedules_company on public.schedules(company_id);

alter table public.schedules enable row level security;
create policy "members read schedules" on public.schedules
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr write schedules ins" on public.schedules
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write schedules upd" on public.schedules
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write schedules del" on public.schedules
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create trigger trg_schedules_updated before update on public.schedules
  for each row execute function public.set_updated_at();

create table if not exists public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  company_id uuid not null,
  employee_id uuid not null,
  work_date date not null,
  shift_id uuid,
  location_id uuid,
  notes text,
  is_off boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (schedule_id, employee_id, work_date)
);
create index if not exists idx_schedule_entries_company on public.schedule_entries(company_id);
create index if not exists idx_schedule_entries_emp_date on public.schedule_entries(employee_id, work_date);

alter table public.schedule_entries enable row level security;
create policy "members read schedule_entries" on public.schedule_entries
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr write schedule_entries ins" on public.schedule_entries
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write schedule_entries upd" on public.schedule_entries
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write schedule_entries del" on public.schedule_entries
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create trigger trg_schedule_entries_updated before update on public.schedule_entries
  for each row execute function public.set_updated_at();

-- ============================================================
-- shift_swap_requests
-- ============================================================
create table if not exists public.shift_swap_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  requester_employee_id uuid not null,
  target_employee_id uuid,
  schedule_entry_id uuid references public.schedule_entries(id) on delete set null,
  reason text,
  status public.swap_status not null default 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_swaps_company on public.shift_swap_requests(company_id);

alter table public.shift_swap_requests enable row level security;
create policy "members read swaps" on public.shift_swap_requests
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "members insert swaps" on public.shift_swap_requests
  for insert to authenticated with check (is_member_of(company_id));
create policy "hr update swaps" on public.shift_swap_requests
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr delete swaps" on public.shift_swap_requests
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create trigger trg_swaps_updated before update on public.shift_swap_requests
  for each row execute function public.set_updated_at();

-- ============================================================
-- attendance_correction_requests
-- ============================================================
create table if not exists public.attendance_correction_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  employee_id uuid not null,
  log_date date not null,
  requested_check_in_at timestamptz,
  requested_check_out_at timestamptz,
  reason text,
  status public.correction_status not null default 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_corrections_company on public.attendance_correction_requests(company_id);

alter table public.attendance_correction_requests enable row level security;
create policy "members read corrections" on public.attendance_correction_requests
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "members insert corrections" on public.attendance_correction_requests
  for insert to authenticated with check (is_member_of(company_id));
create policy "hr update corrections" on public.attendance_correction_requests
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr delete corrections" on public.attendance_correction_requests
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create trigger trg_corrections_updated before update on public.attendance_correction_requests
  for each row execute function public.set_updated_at();

-- ============================================================
-- remote_work_requests
-- ============================================================
create table if not exists public.remote_work_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  employee_id uuid not null,
  request_date date not null,
  end_date date,
  reason text,
  status public.remote_status not null default 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_remote_company on public.remote_work_requests(company_id);

alter table public.remote_work_requests enable row level security;
create policy "members read remote" on public.remote_work_requests
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "members insert remote" on public.remote_work_requests
  for insert to authenticated with check (is_member_of(company_id));
create policy "hr update remote" on public.remote_work_requests
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr delete remote" on public.remote_work_requests
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create trigger trg_remote_updated before update on public.remote_work_requests
  for each row execute function public.set_updated_at();

-- ============================================================
-- productivity_logs
-- ============================================================
create table if not exists public.productivity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  employee_id uuid not null,
  log_date date not null,
  productive_minutes int not null default 0,
  idle_minutes int not null default 0,
  tasks_completed int not null default 0,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, log_date)
);
create index if not exists idx_productivity_company on public.productivity_logs(company_id);

alter table public.productivity_logs enable row level security;
create policy "members read productivity" on public.productivity_logs
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr write productivity ins" on public.productivity_logs
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write productivity upd" on public.productivity_logs
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write productivity del" on public.productivity_logs
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create trigger trg_productivity_updated before update on public.productivity_logs
  for each row execute function public.set_updated_at();

-- ============================================================
-- assets + asset_assignments
-- ============================================================
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  name text not null,
  kind public.asset_kind not null default 'other',
  serial_number text,
  status public.asset_status not null default 'available',
  purchased_at date,
  value numeric(14,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_assets_company on public.assets(company_id);

alter table public.assets enable row level security;
create policy "members read assets" on public.assets
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr write assets ins" on public.assets
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write assets upd" on public.assets
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write assets del" on public.assets
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create trigger trg_assets_updated before update on public.assets
  for each row execute function public.set_updated_at();

create table if not exists public.asset_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  asset_id uuid not null references public.assets(id) on delete cascade,
  employee_id uuid not null,
  assigned_at timestamptz not null default now(),
  returned_at timestamptz,
  condition_on_return text,
  assigned_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_asset_assignments_company on public.asset_assignments(company_id);
create index if not exists idx_asset_assignments_asset on public.asset_assignments(asset_id);

alter table public.asset_assignments enable row level security;
create policy "members read asset_assignments" on public.asset_assignments
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr write asset_assignments ins" on public.asset_assignments
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write asset_assignments upd" on public.asset_assignments
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write asset_assignments del" on public.asset_assignments
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- ============================================================
-- employee_documents
-- ============================================================
create table if not exists public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  employee_id uuid not null,
  doc_type public.document_kind not null default 'other',
  title text not null,
  file_url text,
  expires_at date,
  uploaded_by uuid,
  signed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_documents_company on public.employee_documents(company_id);
create index if not exists idx_documents_employee on public.employee_documents(employee_id);

alter table public.employee_documents enable row level security;
create policy "members read documents" on public.employee_documents
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr write documents ins" on public.employee_documents
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write documents upd" on public.employee_documents
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write documents del" on public.employee_documents
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create trigger trg_documents_updated before update on public.employee_documents
  for each row execute function public.set_updated_at();

-- ============================================================
-- announcements + announcement_reads
-- ============================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  title text not null,
  body text,
  audience public.announcement_audience not null default 'all',
  audience_id uuid,
  pinned boolean not null default false,
  published_at timestamptz default now(),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_announcements_company on public.announcements(company_id);

alter table public.announcements enable row level security;
create policy "members read announcements" on public.announcements
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr write announcements ins" on public.announcements
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write announcements upd" on public.announcements
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr write announcements del" on public.announcements
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create trigger trg_announcements_updated before update on public.announcements
  for each row execute function public.set_updated_at();

create table if not exists public.announcement_reads (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null,
  read_at timestamptz not null default now(),
  unique (announcement_id, user_id)
);
create index if not exists idx_announcement_reads_user on public.announcement_reads(user_id);

alter table public.announcement_reads enable row level security;
create policy "users read own announcement_reads" on public.announcement_reads
  for select to authenticated using (user_id = auth.uid() or is_admin(auth.uid()));
create policy "users insert own announcement_reads" on public.announcement_reads
  for insert to authenticated with check (user_id = auth.uid());

-- ============================================================
-- Timesheet lock trigger
-- Block edits to submitted/approved/locked timesheets unless HR/admin.
-- ============================================================
create or replace function public.guard_timesheet_locked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status in ('submitted','approved','locked')
     and not public.is_attendance_admin(auth.uid()) then
    raise exception 'Timesheet is %; only HR/admin can edit.', old.status
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_timesheet_locked on public.timesheets;
create trigger trg_guard_timesheet_locked
  before update on public.timesheets
  for each row execute function public.guard_timesheet_locked();

-- ============================================================
-- Permissions catalogue + role grants for new modules
-- ============================================================
insert into public.permissions (key, module, action, label, sort_order)
values
  ('workforce.dashboard.read','workforce','read','View Workforce Dashboard',100),
  ('workforce.directory.read','workforce','read','View Employee Directory',101),
  ('workforce.directory.export','workforce','export','Export Employee Directory',102),
  ('workforce.rules.manage','workforce','manage','Manage Attendance Rules',103),
  ('workforce.schedules.read','workforce','read','View Schedules',104),
  ('workforce.schedules.manage','workforce','manage','Manage Schedules',105),
  ('workforce.schedules.publish','workforce','manage','Publish Schedules',106),
  ('workforce.timesheets.manage','workforce','manage','Approve/Lock Timesheets',107),
  ('workforce.timesheets.export','workforce','export','Export Timesheets',108),
  ('workforce.assets.manage','workforce','manage','Manage Assets',109),
  ('workforce.documents.manage','workforce','manage','Manage Employee Documents',110),
  ('workforce.announcements.manage','workforce','manage','Manage Announcements',111),
  ('workforce.approvals.manage','workforce','manage','Approve Workforce Requests',112),
  ('workforce.reports.export','workforce','export','Export Workforce Reports',113),
  ('workforce.productivity.read','workforce','read','View Productivity',114)
on conflict (key) do nothing;

-- Grant to super_admin and admin (full)
insert into public.role_permissions (role, permission_key)
select r.role::app_role, p.key
from (values ('super_admin'),('admin')) as r(role)
cross join public.permissions p
where p.key like 'workforce.%'
on conflict do nothing;

-- Grant to hr (everything except super-admin-only flags — here, all of these)
insert into public.role_permissions (role, permission_key)
select 'hr'::app_role, p.key
from public.permissions p
where p.key like 'workforce.%'
on conflict do nothing;

-- Manager: read + approvals + timesheet manage
insert into public.role_permissions (role, permission_key)
select 'manager'::app_role, p.key
from public.permissions p
where p.key in (
  'workforce.dashboard.read',
  'workforce.directory.read',
  'workforce.schedules.read',
  'workforce.schedules.manage',
  'workforce.timesheets.manage',
  'workforce.approvals.manage',
  'workforce.productivity.read',
  'workforce.announcements.manage'
)
on conflict do nothing;

-- Employee: just read dashboard + directory
insert into public.role_permissions (role, permission_key)
select 'employee'::app_role, p.key
from public.permissions p
where p.key in (
  'workforce.dashboard.read',
  'workforce.directory.read'
)
on conflict do nothing;