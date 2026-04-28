
-- Enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'holiday_type') then
    create type public.holiday_type as enum (
      'national','regional','religious','optional','company','half_day'
    );
  end if;
end$$;

-- Countries
create table if not exists public.countries (
  code text primary key,
  name text not null,
  flag_emoji text,
  weekend_days int[] not null default array[0,6],
  default_timezone text,
  created_at timestamptz not null default now()
);
alter table public.countries enable row level security;
drop policy if exists "Countries readable to authenticated" on public.countries;
create policy "Countries readable to authenticated"
  on public.countries for select to authenticated using (true);

-- Holiday templates
create table if not exists public.holiday_templates (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code) on delete cascade,
  year int not null,
  name text not null,
  holiday_date date not null,
  region text,
  type public.holiday_type not null default 'national',
  is_recurring boolean not null default false,
  source text,
  created_at timestamptz not null default now(),
  unique (country_code, year, name, holiday_date)
);
create index if not exists idx_holiday_templates_country_year on public.holiday_templates(country_code, year);
alter table public.holiday_templates enable row level security;
drop policy if exists "Templates readable to authenticated" on public.holiday_templates;
create policy "Templates readable to authenticated"
  on public.holiday_templates for select to authenticated using (true);

-- Register new permission keys FIRST (master catalog)
insert into public.permissions (key, module, action, label, description, sort_order) values
  ('workforce.holidays.read','workforce','read','Holidays — Read','View company holiday calendar', 600),
  ('workforce.holidays.write','workforce','write','Holidays — Write','Add, edit, delete company holidays', 601),
  ('workforce.holidays.manage_templates','workforce','manage','Holidays — Manage Templates','Edit global prebuilt holiday templates (super admin)', 602)
on conflict (key) do nothing;

-- Templates manage policy (now permission key exists)
drop policy if exists "Templates managed by super admins" on public.holiday_templates;
create policy "Templates managed by super admins"
  on public.holiday_templates for all
  to authenticated
  using (public.has_permission(auth.uid(), 'workforce.holidays.manage_templates') or public.is_super_admin(auth.uid()))
  with check (public.has_permission(auth.uid(), 'workforce.holidays.manage_templates') or public.is_super_admin(auth.uid()));

-- Extend holidays
alter table public.holidays add column if not exists country_code text references public.countries(code);
alter table public.holidays add column if not exists type public.holiday_type not null default 'company';
alter table public.holidays add column if not exists is_paid boolean not null default true;
alter table public.holidays add column if not exists is_recurring boolean not null default false;
alter table public.holidays add column if not exists template_id uuid references public.holiday_templates(id) on delete set null;
alter table public.holidays add column if not exists description text;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='holidays' and column_name='year'
  ) then
    alter table public.holidays add column year int generated always as (extract(year from holiday_date)::int) stored;
  end if;
end$$;

create index if not exists idx_holidays_company_year on public.holidays(company_id, year);
create index if not exists idx_holidays_date on public.holidays(holiday_date);

-- Refresh holidays RLS
drop policy if exists "Holidays viewable by company members" on public.holidays;
drop policy if exists "Holidays manageable by admins" on public.holidays;
drop policy if exists "holidays select" on public.holidays;
drop policy if exists "holidays write" on public.holidays;
drop policy if exists "holidays insert" on public.holidays;
drop policy if exists "holidays update" on public.holidays;
drop policy if exists "holidays delete" on public.holidays;

create policy "holidays select" on public.holidays for select to authenticated
  using (public.is_super_admin(auth.uid()) or public.is_member_of(company_id));
create policy "holidays insert" on public.holidays for insert to authenticated
  with check (
    (public.is_super_admin(auth.uid()) or public.is_member_of(company_id))
    and (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(), 'workforce.holidays.write'))
  );
create policy "holidays update" on public.holidays for update to authenticated
  using (
    (public.is_super_admin(auth.uid()) or public.is_member_of(company_id))
    and (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(), 'workforce.holidays.write'))
  );
create policy "holidays delete" on public.holidays for delete to authenticated
  using (
    (public.is_super_admin(auth.uid()) or public.is_member_of(company_id))
    and (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(), 'workforce.holidays.write'))
  );

-- Company holiday settings
create table if not exists public.company_holiday_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  country_code text references public.countries(code),
  weekend_days int[] not null default array[0,6],
  auto_import_enabled boolean not null default false,
  last_synced_year int,
  updated_at timestamptz not null default now()
);
alter table public.company_holiday_settings enable row level security;
drop policy if exists "settings select" on public.company_holiday_settings;
create policy "settings select" on public.company_holiday_settings for select to authenticated
  using (public.is_super_admin(auth.uid()) or public.is_member_of(company_id));
drop policy if exists "settings write" on public.company_holiday_settings;
create policy "settings write" on public.company_holiday_settings for all to authenticated
  using (
    (public.is_super_admin(auth.uid()) or public.is_member_of(company_id))
    and (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(), 'workforce.holidays.write'))
  )
  with check (
    (public.is_super_admin(auth.uid()) or public.is_member_of(company_id))
    and (public.is_super_admin(auth.uid()) or public.has_permission(auth.uid(), 'workforce.holidays.write'))
  );
drop trigger if exists trg_company_holiday_settings_updated on public.company_holiday_settings;
create trigger trg_company_holiday_settings_updated
  before update on public.company_holiday_settings
  for each row execute function public.set_updated_at();

-- Grant permissions to roles
insert into public.role_permissions (role, permission_key) values
  ('employee','workforce.holidays.read'),
  ('hr','workforce.holidays.read'),
  ('hr','workforce.holidays.write'),
  ('manager','workforce.holidays.read'),
  ('admin','workforce.holidays.read'),
  ('admin','workforce.holidays.write'),
  ('super_admin','workforce.holidays.read'),
  ('super_admin','workforce.holidays.write'),
  ('super_admin','workforce.holidays.manage_templates')
on conflict do nothing;

-- Seed countries
insert into public.countries (code, name, flag_emoji, weekend_days, default_timezone) values
  ('IN','India','🇮🇳', array[0,6],'Asia/Kolkata'),
  ('US','United States','🇺🇸', array[0,6],'America/New_York'),
  ('GB','United Kingdom','🇬🇧', array[0,6],'Europe/London'),
  ('AE','United Arab Emirates','🇦🇪', array[6,0],'Asia/Dubai'),
  ('CA','Canada','🇨🇦', array[0,6],'America/Toronto'),
  ('AU','Australia','🇦🇺', array[0,6],'Australia/Sydney'),
  ('SG','Singapore','🇸🇬', array[0,6],'Asia/Singapore'),
  ('DE','Germany','🇩🇪', array[0,6],'Europe/Berlin'),
  ('FR','France','🇫🇷', array[0,6],'Europe/Paris'),
  ('SA','Saudi Arabia','🇸🇦', array[5,6],'Asia/Riyadh'),
  ('ZA','South Africa','🇿🇦', array[0,6],'Africa/Johannesburg'),
  ('JP','Japan','🇯🇵', array[0,6],'Asia/Tokyo'),
  ('CN','China','🇨🇳', array[0,6],'Asia/Shanghai'),
  ('BR','Brazil','🇧🇷', array[0,6],'America/Sao_Paulo'),
  ('MX','Mexico','🇲🇽', array[0,6],'America/Mexico_City'),
  ('IT','Italy','🇮🇹', array[0,6],'Europe/Rome'),
  ('ES','Spain','🇪🇸', array[0,6],'Europe/Madrid'),
  ('NL','Netherlands','🇳🇱', array[0,6],'Europe/Amsterdam'),
  ('NZ','New Zealand','🇳🇿', array[0,6],'Pacific/Auckland'),
  ('IE','Ireland','🇮🇪', array[0,6],'Europe/Dublin'),
  ('MY','Malaysia','🇲🇾', array[0,6],'Asia/Kuala_Lumpur'),
  ('ID','Indonesia','🇮🇩', array[0,6],'Asia/Jakarta'),
  ('PH','Philippines','🇵🇭', array[0,6],'Asia/Manila'),
  ('TH','Thailand','🇹🇭', array[0,6],'Asia/Bangkok'),
  ('VN','Vietnam','🇻🇳', array[0,6],'Asia/Ho_Chi_Minh'),
  ('EG','Egypt','🇪🇬', array[5,6],'Africa/Cairo'),
  ('NG','Nigeria','🇳🇬', array[0,6],'Africa/Lagos'),
  ('KE','Kenya','🇰🇪', array[0,6],'Africa/Nairobi'),
  ('AR','Argentina','🇦🇷', array[0,6],'America/Argentina/Buenos_Aires'),
  ('CH','Switzerland','🇨🇭', array[0,6],'Europe/Zurich')
on conflict (code) do nothing;

-- Seed templates
insert into public.holiday_templates(country_code,year,name,holiday_date,type,is_recurring,source) values
('IN',2025,'Republic Day','2025-01-26','national',true,'curated'),
('IN',2025,'Holi','2025-03-14','religious',false,'curated'),
('IN',2025,'Good Friday','2025-04-18','religious',false,'curated'),
('IN',2025,'Eid al-Fitr','2025-03-31','religious',false,'curated'),
('IN',2025,'Independence Day','2025-08-15','national',true,'curated'),
('IN',2025,'Gandhi Jayanti','2025-10-02','national',true,'curated'),
('IN',2025,'Diwali','2025-10-20','religious',false,'curated'),
('IN',2025,'Christmas Day','2025-12-25','religious',true,'curated'),
('IN',2026,'Republic Day','2026-01-26','national',true,'curated'),
('IN',2026,'Holi','2026-03-04','religious',false,'curated'),
('IN',2026,'Independence Day','2026-08-15','national',true,'curated'),
('IN',2026,'Gandhi Jayanti','2026-10-02','national',true,'curated'),
('IN',2026,'Diwali','2026-11-08','religious',false,'curated'),
('IN',2026,'Christmas Day','2026-12-25','religious',true,'curated'),
('IN',2027,'Republic Day','2027-01-26','national',true,'curated'),
('IN',2027,'Independence Day','2027-08-15','national',true,'curated'),
('IN',2027,'Gandhi Jayanti','2027-10-02','national',true,'curated'),
('IN',2027,'Diwali','2027-10-29','religious',false,'curated'),
('IN',2027,'Christmas Day','2027-12-25','religious',true,'curated'),
('US',2025,'New Year''s Day','2025-01-01','national',true,'curated'),
('US',2025,'Martin Luther King Jr. Day','2025-01-20','national',true,'curated'),
('US',2025,'Presidents'' Day','2025-02-17','national',true,'curated'),
('US',2025,'Memorial Day','2025-05-26','national',true,'curated'),
('US',2025,'Independence Day','2025-07-04','national',true,'curated'),
('US',2025,'Labor Day','2025-09-01','national',true,'curated'),
('US',2025,'Thanksgiving','2025-11-27','national',true,'curated'),
('US',2025,'Christmas Day','2025-12-25','national',true,'curated'),
('US',2026,'New Year''s Day','2026-01-01','national',true,'curated'),
('US',2026,'Martin Luther King Jr. Day','2026-01-19','national',true,'curated'),
('US',2026,'Memorial Day','2026-05-25','national',true,'curated'),
('US',2026,'Independence Day','2026-07-04','national',true,'curated'),
('US',2026,'Labor Day','2026-09-07','national',true,'curated'),
('US',2026,'Thanksgiving','2026-11-26','national',true,'curated'),
('US',2026,'Christmas Day','2026-12-25','national',true,'curated'),
('US',2027,'New Year''s Day','2027-01-01','national',true,'curated'),
('US',2027,'Independence Day','2027-07-04','national',true,'curated'),
('US',2027,'Thanksgiving','2027-11-25','national',true,'curated'),
('US',2027,'Christmas Day','2027-12-25','national',true,'curated'),
('GB',2025,'New Year''s Day','2025-01-01','national',true,'curated'),
('GB',2025,'Good Friday','2025-04-18','national',false,'curated'),
('GB',2025,'Easter Monday','2025-04-21','national',false,'curated'),
('GB',2025,'Early May Bank Holiday','2025-05-05','national',true,'curated'),
('GB',2025,'Spring Bank Holiday','2025-05-26','national',true,'curated'),
('GB',2025,'Summer Bank Holiday','2025-08-25','national',true,'curated'),
('GB',2025,'Christmas Day','2025-12-25','national',true,'curated'),
('GB',2025,'Boxing Day','2025-12-26','national',true,'curated'),
('GB',2026,'New Year''s Day','2026-01-01','national',true,'curated'),
('GB',2026,'Good Friday','2026-04-03','national',false,'curated'),
('GB',2026,'Christmas Day','2026-12-25','national',true,'curated'),
('GB',2026,'Boxing Day','2026-12-28','national',true,'curated'),
('GB',2027,'New Year''s Day','2027-01-01','national',true,'curated'),
('GB',2027,'Christmas Day','2027-12-25','national',true,'curated'),
('AE',2025,'New Year''s Day','2025-01-01','national',true,'curated'),
('AE',2025,'Eid al-Fitr','2025-03-31','religious',false,'curated'),
('AE',2025,'Arafat Day','2025-06-05','religious',false,'curated'),
('AE',2025,'Eid al-Adha','2025-06-06','religious',false,'curated'),
('AE',2025,'Islamic New Year','2025-06-26','religious',false,'curated'),
('AE',2025,'Prophet''s Birthday','2025-09-04','religious',false,'curated'),
('AE',2025,'Commemoration Day','2025-12-01','national',true,'curated'),
('AE',2025,'National Day','2025-12-02','national',true,'curated'),
('AE',2026,'New Year''s Day','2026-01-01','national',true,'curated'),
('AE',2026,'Commemoration Day','2026-12-01','national',true,'curated'),
('AE',2026,'National Day','2026-12-02','national',true,'curated'),
('AE',2027,'New Year''s Day','2027-01-01','national',true,'curated'),
('AE',2027,'National Day','2027-12-02','national',true,'curated'),
('CA',2025,'New Year''s Day','2025-01-01','national',true,'curated'),
('CA',2025,'Good Friday','2025-04-18','national',false,'curated'),
('CA',2025,'Canada Day','2025-07-01','national',true,'curated'),
('CA',2025,'Labour Day','2025-09-01','national',true,'curated'),
('CA',2025,'Thanksgiving','2025-10-13','national',true,'curated'),
('CA',2025,'Christmas Day','2025-12-25','national',true,'curated'),
('CA',2026,'New Year''s Day','2026-01-01','national',true,'curated'),
('CA',2026,'Canada Day','2026-07-01','national',true,'curated'),
('CA',2026,'Christmas Day','2026-12-25','national',true,'curated'),
('CA',2027,'Canada Day','2027-07-01','national',true,'curated'),
('CA',2027,'Christmas Day','2027-12-25','national',true,'curated'),
('AU',2025,'New Year''s Day','2025-01-01','national',true,'curated'),
('AU',2025,'Australia Day','2025-01-26','national',true,'curated'),
('AU',2025,'Good Friday','2025-04-18','national',false,'curated'),
('AU',2025,'Anzac Day','2025-04-25','national',true,'curated'),
('AU',2025,'Christmas Day','2025-12-25','national',true,'curated'),
('AU',2025,'Boxing Day','2025-12-26','national',true,'curated'),
('AU',2026,'Australia Day','2026-01-26','national',true,'curated'),
('AU',2026,'Anzac Day','2026-04-25','national',true,'curated'),
('AU',2026,'Christmas Day','2026-12-25','national',true,'curated'),
('AU',2027,'Australia Day','2027-01-26','national',true,'curated'),
('AU',2027,'Christmas Day','2027-12-25','national',true,'curated'),
('SG',2025,'New Year''s Day','2025-01-01','national',true,'curated'),
('SG',2025,'Chinese New Year','2025-01-29','national',false,'curated'),
('SG',2025,'Good Friday','2025-04-18','religious',false,'curated'),
('SG',2025,'Labour Day','2025-05-01','national',true,'curated'),
('SG',2025,'National Day','2025-08-09','national',true,'curated'),
('SG',2025,'Deepavali','2025-10-20','religious',false,'curated'),
('SG',2025,'Christmas Day','2025-12-25','national',true,'curated'),
('SG',2026,'National Day','2026-08-09','national',true,'curated'),
('SG',2026,'Christmas Day','2026-12-25','national',true,'curated'),
('SG',2027,'National Day','2027-08-09','national',true,'curated'),
('SG',2027,'Christmas Day','2027-12-25','national',true,'curated'),
('DE',2025,'New Year''s Day','2025-01-01','national',true,'curated'),
('DE',2025,'Good Friday','2025-04-18','national',false,'curated'),
('DE',2025,'Easter Monday','2025-04-21','national',false,'curated'),
('DE',2025,'Labour Day','2025-05-01','national',true,'curated'),
('DE',2025,'Day of German Unity','2025-10-03','national',true,'curated'),
('DE',2025,'Christmas Day','2025-12-25','national',true,'curated'),
('DE',2025,'Second Day of Christmas','2025-12-26','national',true,'curated'),
('DE',2026,'Day of German Unity','2026-10-03','national',true,'curated'),
('DE',2026,'Christmas Day','2026-12-25','national',true,'curated'),
('DE',2027,'Day of German Unity','2027-10-03','national',true,'curated'),
('FR',2025,'New Year''s Day','2025-01-01','national',true,'curated'),
('FR',2025,'Easter Monday','2025-04-21','national',false,'curated'),
('FR',2025,'Labour Day','2025-05-01','national',true,'curated'),
('FR',2025,'Victory in Europe Day','2025-05-08','national',true,'curated'),
('FR',2025,'Bastille Day','2025-07-14','national',true,'curated'),
('FR',2025,'Assumption of Mary','2025-08-15','religious',true,'curated'),
('FR',2025,'All Saints'' Day','2025-11-01','religious',true,'curated'),
('FR',2025,'Armistice Day','2025-11-11','national',true,'curated'),
('FR',2025,'Christmas Day','2025-12-25','national',true,'curated'),
('FR',2026,'Bastille Day','2026-07-14','national',true,'curated'),
('FR',2026,'Christmas Day','2026-12-25','national',true,'curated'),
('FR',2027,'Bastille Day','2027-07-14','national',true,'curated'),
('SA',2025,'Foundation Day','2025-02-22','national',true,'curated'),
('SA',2025,'Eid al-Fitr','2025-03-31','religious',false,'curated'),
('SA',2025,'Eid al-Adha','2025-06-06','religious',false,'curated'),
('SA',2025,'National Day','2025-09-23','national',true,'curated'),
('SA',2026,'Foundation Day','2026-02-22','national',true,'curated'),
('SA',2026,'National Day','2026-09-23','national',true,'curated'),
('SA',2027,'Foundation Day','2027-02-22','national',true,'curated'),
('SA',2027,'National Day','2027-09-23','national',true,'curated')
on conflict do nothing;
