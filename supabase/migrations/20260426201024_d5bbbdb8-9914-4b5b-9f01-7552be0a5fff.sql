-- ENUMS
do $$ begin
  create type public.employment_type as enum ('full_time','part_time','contract','intern','consultant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('present','absent','late','half_day','on_leave','holiday','weekly_off');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_source as enum ('mobile','web','biometric','kiosk','manual','geofence');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.timesheet_status as enum ('draft','submitted','approved','rejected','locked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.leave_request_status as enum ('pending','approved','rejected','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.overtime_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

-- DEPARTMENTS
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

-- DESIGNATIONS
create table if not exists public.designations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  level int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

-- WORK LOCATIONS
create table if not exists public.work_locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  radius_meters int default 100,
  timezone text default 'Asia/Kolkata',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- EMPLOYEES
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid,
  employee_code text not null,
  full_name text not null,
  email text,
  phone text,
  department_id uuid references public.departments(id) on delete set null,
  designation_id uuid references public.designations(id) on delete set null,
  manager_id uuid references public.employees(id) on delete set null,
  default_location_id uuid references public.work_locations(id) on delete set null,
  employment_type employment_type not null default 'full_time',
  hire_date date,
  exit_date date,
  status text not null default 'active',
  payroll_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, employee_code)
);
create index if not exists employees_company_idx on public.employees(company_id);
create index if not exists employees_user_idx on public.employees(user_id);

-- SHIFTS
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  start_time time not null,
  end_time time not null,
  break_minutes int not null default 0,
  weekly_off int[] not null default '{0}'::int[], -- 0=Sun..6=Sat
  is_night_shift boolean not null default false,
  color text default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SHIFT ASSIGNMENTS
create table if not exists public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  starts_on date not null,
  ends_on date,
  created_at timestamptz not null default now()
);
create index if not exists shift_assign_emp_idx on public.shift_assignments(employee_id);

-- ATTENDANCE LOGS
create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  log_date date not null default current_date,
  check_in_at timestamptz,
  check_out_at timestamptz,
  source attendance_source not null default 'mobile',
  status attendance_status not null default 'present',
  is_late boolean not null default false,
  is_early_leave boolean not null default false,
  worked_minutes int not null default 0,
  location_id uuid references public.work_locations(id) on delete set null,
  latitude double precision,
  longitude double precision,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists attlog_company_date_idx on public.attendance_logs(company_id, log_date desc);
create index if not exists attlog_emp_date_idx on public.attendance_logs(employee_id, log_date desc);

-- TIMESHEETS
create table if not exists public.timesheets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  total_hours numeric(8,2) not null default 0,
  billable_hours numeric(8,2) not null default 0,
  status timesheet_status not null default 'draft',
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ts_company_idx on public.timesheets(company_id, period_start desc);

-- OVERTIME
create table if not exists public.overtime_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  request_date date not null,
  hours numeric(5,2) not null default 0,
  reason text,
  status overtime_status not null default 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- LEAVE TYPES
create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text not null,
  is_paid boolean not null default true,
  annual_quota numeric(5,2) not null default 0,
  color text default '#10b981',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

-- LEAVE BALANCES
create table if not exists public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  year int not null,
  allotted numeric(5,2) not null default 0,
  used numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, leave_type_id, year)
);

-- LEAVE REQUESTS
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid references public.leave_types(id) on delete set null,
  start_date date not null,
  end_date date not null,
  days numeric(5,2) not null default 0,
  reason text,
  status leave_request_status not null default 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leave_req_company_idx on public.leave_requests(company_id, start_date desc);

-- HOLIDAYS
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  holiday_date date not null,
  region text,
  is_optional boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists holidays_company_date_idx on public.holidays(company_id, holiday_date);

-- updated_at triggers
do $$ begin
  perform 1 from pg_trigger where tgname = 'set_departments_updated_at';
  if not found then create trigger set_departments_updated_at before update on public.departments for each row execute function public.set_updated_at(); end if;
  perform 1 from pg_trigger where tgname = 'set_designations_updated_at';
  if not found then create trigger set_designations_updated_at before update on public.designations for each row execute function public.set_updated_at(); end if;
  perform 1 from pg_trigger where tgname = 'set_work_locations_updated_at';
  if not found then create trigger set_work_locations_updated_at before update on public.work_locations for each row execute function public.set_updated_at(); end if;
  perform 1 from pg_trigger where tgname = 'set_employees_updated_at';
  if not found then create trigger set_employees_updated_at before update on public.employees for each row execute function public.set_updated_at(); end if;
  perform 1 from pg_trigger where tgname = 'set_shifts_updated_at';
  if not found then create trigger set_shifts_updated_at before update on public.shifts for each row execute function public.set_updated_at(); end if;
  perform 1 from pg_trigger where tgname = 'set_attendance_logs_updated_at';
  if not found then create trigger set_attendance_logs_updated_at before update on public.attendance_logs for each row execute function public.set_updated_at(); end if;
  perform 1 from pg_trigger where tgname = 'set_timesheets_updated_at';
  if not found then create trigger set_timesheets_updated_at before update on public.timesheets for each row execute function public.set_updated_at(); end if;
  perform 1 from pg_trigger where tgname = 'set_overtime_requests_updated_at';
  if not found then create trigger set_overtime_requests_updated_at before update on public.overtime_requests for each row execute function public.set_updated_at(); end if;
  perform 1 from pg_trigger where tgname = 'set_leave_types_updated_at';
  if not found then create trigger set_leave_types_updated_at before update on public.leave_types for each row execute function public.set_updated_at(); end if;
  perform 1 from pg_trigger where tgname = 'set_leave_balances_updated_at';
  if not found then create trigger set_leave_balances_updated_at before update on public.leave_balances for each row execute function public.set_updated_at(); end if;
  perform 1 from pg_trigger where tgname = 'set_leave_requests_updated_at';
  if not found then create trigger set_leave_requests_updated_at before update on public.leave_requests for each row execute function public.set_updated_at(); end if;
  perform 1 from pg_trigger where tgname = 'set_holidays_updated_at';
  if not found then create trigger set_holidays_updated_at before update on public.holidays for each row execute function public.set_updated_at(); end if;
end $$;

-- Enable RLS
alter table public.departments enable row level security;
alter table public.designations enable row level security;
alter table public.work_locations enable row level security;
alter table public.employees enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_assignments enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.timesheets enable row level security;
alter table public.overtime_requests enable row level security;
alter table public.leave_types enable row level security;
alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security;
alter table public.holidays enable row level security;

-- Generic policy macro: members read; hr/admin write
-- Departments
create policy "members read departments" on public.departments
  for select to authenticated
  using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr writes departments ins" on public.departments
  for insert to authenticated
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes departments upd" on public.departments
  for update to authenticated
  using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes departments del" on public.departments
  for delete to authenticated
  using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- Designations
create policy "members read designations" on public.designations
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr writes designations ins" on public.designations
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes designations upd" on public.designations
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes designations del" on public.designations
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- Work locations
create policy "members read work_locations" on public.work_locations
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr writes work_locations ins" on public.work_locations
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes work_locations upd" on public.work_locations
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes work_locations del" on public.work_locations
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- Employees
create policy "members read employees" on public.employees
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr writes employees ins" on public.employees
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes employees upd" on public.employees
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes employees del" on public.employees
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- Shifts
create policy "members read shifts" on public.shifts
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr writes shifts ins" on public.shifts
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes shifts upd" on public.shifts
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes shifts del" on public.shifts
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- Shift assignments
create policy "members read shift_assignments" on public.shift_assignments
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr writes shift_assignments ins" on public.shift_assignments
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes shift_assignments upd" on public.shift_assignments
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes shift_assignments del" on public.shift_assignments
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- Attendance logs
create policy "members read attendance_logs" on public.attendance_logs
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "members insert attendance_logs" on public.attendance_logs
  for insert to authenticated with check (is_member_of(company_id));
create policy "hr update attendance_logs" on public.attendance_logs
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr delete attendance_logs" on public.attendance_logs
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- Timesheets
create policy "members read timesheets" on public.timesheets
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "members insert timesheets" on public.timesheets
  for insert to authenticated with check (is_member_of(company_id));
create policy "hr update timesheets" on public.timesheets
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr delete timesheets" on public.timesheets
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- Overtime
create policy "members read overtime" on public.overtime_requests
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "members insert overtime" on public.overtime_requests
  for insert to authenticated with check (is_member_of(company_id));
create policy "hr update overtime" on public.overtime_requests
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr delete overtime" on public.overtime_requests
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- Leave types
create policy "members read leave_types" on public.leave_types
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr writes leave_types ins" on public.leave_types
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes leave_types upd" on public.leave_types
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes leave_types del" on public.leave_types
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- Leave balances
create policy "members read leave_balances" on public.leave_balances
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr writes leave_balances ins" on public.leave_balances
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes leave_balances upd" on public.leave_balances
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes leave_balances del" on public.leave_balances
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- Leave requests
create policy "members read leave_requests" on public.leave_requests
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "members insert leave_requests" on public.leave_requests
  for insert to authenticated with check (is_member_of(company_id));
create policy "hr update leave_requests" on public.leave_requests
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr delete leave_requests" on public.leave_requests
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));

-- Holidays
create policy "members read holidays" on public.holidays
  for select to authenticated using (is_admin(auth.uid()) or is_member_of(company_id));
create policy "hr writes holidays ins" on public.holidays
  for insert to authenticated with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes holidays upd" on public.holidays
  for update to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id))
  with check (is_attendance_admin(auth.uid()) and is_member_of(company_id));
create policy "hr writes holidays del" on public.holidays
  for delete to authenticated using (is_attendance_admin(auth.uid()) and is_member_of(company_id));