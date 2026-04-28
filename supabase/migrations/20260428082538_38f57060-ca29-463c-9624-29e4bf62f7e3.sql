-- 1) Backfill missing profiles for any auth users without one
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email,'@',1)),
       u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2) Promote current workspace owner (Nitin) to super_admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM auth.users
WHERE email = 'nitin@dataroars.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3) Improve handle_new_user trigger: promote to super_admin whenever no super_admin exists yet
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  has_super boolean;
  default_company uuid;
begin
  -- Profile
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  select exists(select 1 from public.user_roles where role = 'super_admin') into has_super;
  select id into default_company from public.companies where slug = 'oqlio' limit 1;

  if not has_super then
    -- Bootstrap: first super_admin owner of platform company
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin')
    on conflict (user_id, role) do nothing;
    if default_company is not null then
      insert into public.company_members (company_id, user_id, role, is_owner)
      values (default_company, new.id, 'super_admin', true)
      on conflict (company_id, user_id) do nothing;
      update public.profiles set company_id = default_company where id = new.id;
    end if;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'employee')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$function$;