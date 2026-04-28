-- 1. New columns on platform_settings (safe — all nullable or with defaults)
alter table public.platform_settings
  add column if not exists secondary_color text,
  add column if not exists accent_color text,
  add column if not exists date_format text not null default 'DD/MM/YYYY',
  add column if not exists time_format text not null default '24h',
  add column if not exists number_format text not null default 'en-IN',
  add column if not exists week_start smallint not null default 1;

-- 2. Company name normalization + case-insensitive uniqueness
create or replace function public.companies_normalize_name()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.name = trim(new.name);
  return new;
end;
$$;

drop trigger if exists trg_companies_normalize_name on public.companies;
create trigger trg_companies_normalize_name
before insert or update of name on public.companies
for each row execute function public.companies_normalize_name();

-- Clean up any existing whitespace duplicates before adding the index
update public.companies set name = trim(name) where name <> trim(name);

create unique index if not exists companies_name_ci_idx
  on public.companies (lower(name));

-- 3. Brand assets storage bucket (public read, 1 MB cap, image MIME whitelist)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-assets',
  'brand-assets',
  true,
  1048576,
  array['image/png','image/jpeg','image/jpg','image/webp','image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
drop policy if exists "Brand assets are publicly readable" on storage.objects;
create policy "Brand assets are publicly readable"
on storage.objects for select
using (bucket_id = 'brand-assets');

drop policy if exists "Admins can upload brand assets" on storage.objects;
create policy "Admins can upload brand assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'brand-assets' and public.is_admin(auth.uid()));

drop policy if exists "Admins can update brand assets" on storage.objects;
create policy "Admins can update brand assets"
on storage.objects for update
to authenticated
using (bucket_id = 'brand-assets' and public.is_admin(auth.uid()));

drop policy if exists "Admins can delete brand assets" on storage.objects;
create policy "Admins can delete brand assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'brand-assets' and public.is_admin(auth.uid()));