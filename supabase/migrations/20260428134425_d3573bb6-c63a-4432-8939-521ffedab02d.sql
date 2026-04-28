insert into public.permissions (key, module, action, label, description)
values ('support.kb.read', 'support', 'read', 'View knowledge base', 'View knowledge base articles in admin')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key)
select distinct rp.role, 'support.kb.read'
from public.role_permissions rp
where rp.permission_key = 'support.kb.write'
on conflict do nothing;

insert into public.role_permissions (role, permission_key)
values
  ('super_admin','support.kb.read'),
  ('super_admin','support.kb.write'),
  ('admin','support.kb.read'),
  ('admin','support.kb.write'),
  ('support','support.kb.read'),
  ('support','support.kb.write')
on conflict do nothing;