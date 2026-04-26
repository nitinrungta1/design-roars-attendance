
-- ============= ENUMS =============
do $$ begin
  create type public.ticket_priority as enum ('low','normal','high','urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_status as enum ('open','pending','resolved','closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_channel as enum ('email','chat','portal','api','whatsapp');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_status as enum ('draft','scheduled','published','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.integration_kind as enum ('payment','email','sms','whatsapp','webhook','api','storage','analytics');
exception when duplicate_object then null; end $$;

-- ============= SUPPORT =============
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  requester_email text not null,
  requester_name text,
  subject text not null,
  body text,
  priority ticket_priority not null default 'normal',
  status ticket_status not null default 'open',
  channel ticket_channel not null default 'portal',
  assigned_to uuid,
  sla_due_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
create trigger trg_support_tickets_updated before update on public.support_tickets
  for each row execute function public.set_updated_at();

create policy "support read tickets" on public.support_tickets for select to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'support') or (company_id is not null and is_member_of(company_id)));
create policy "anyone insert tickets" on public.support_tickets for insert to authenticated
  with check (true);
create policy "support update tickets" on public.support_tickets for update to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'support'))
  with check (is_admin(auth.uid()) or has_role(auth.uid(),'support'));
create policy "admin delete tickets" on public.support_tickets for delete to authenticated
  using (is_admin(auth.uid()));

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid,
  author_name text,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.ticket_messages enable row level security;
create policy "support read ticket messages" on public.ticket_messages for select to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'support')
    or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.company_id is not null and is_member_of(t.company_id)));
create policy "support write ticket messages" on public.ticket_messages for insert to authenticated
  with check (is_admin(auth.uid()) or has_role(auth.uid(),'support') or author_id = auth.uid());

create table if not exists public.sla_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  priority ticket_priority not null,
  first_response_minutes integer not null default 60,
  resolution_minutes integer not null default 1440,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sla_policies enable row level security;
create trigger trg_sla_updated before update on public.sla_policies
  for each row execute function public.set_updated_at();
create policy "staff read sla" on public.sla_policies for select to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'support'));
create policy "admin write sla ins" on public.sla_policies for insert to authenticated with check (is_admin(auth.uid()));
create policy "admin write sla upd" on public.sla_policies for update to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "admin write sla del" on public.sla_policies for delete to authenticated using (is_admin(auth.uid()));

-- ============= CMS =============
create table if not exists public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  category text,
  status post_status not null default 'draft',
  view_count integer not null default 0,
  author_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.kb_articles enable row level security;
create trigger trg_kb_updated before update on public.kb_articles
  for each row execute function public.set_updated_at();
create policy "public read kb published" on public.kb_articles for select to anon, authenticated
  using (status = 'published' or is_admin(auth.uid()) or has_role(auth.uid(),'support'));
create policy "admin write kb ins" on public.kb_articles for insert to authenticated with check (is_admin(auth.uid()) or has_role(auth.uid(),'support'));
create policy "admin write kb upd" on public.kb_articles for update to authenticated using (is_admin(auth.uid()) or has_role(auth.uid(),'support')) with check (is_admin(auth.uid()) or has_role(auth.uid(),'support'));
create policy "admin write kb del" on public.kb_articles for delete to authenticated using (is_admin(auth.uid()));

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  cover_url text,
  category text,
  tags text[] not null default '{}'::text[],
  status post_status not null default 'draft',
  seo_title text,
  seo_description text,
  author_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.blog_posts enable row level security;
create trigger trg_blog_updated before update on public.blog_posts
  for each row execute function public.set_updated_at();
create policy "public read blog published" on public.blog_posts for select to anon, authenticated
  using (status = 'published' or is_admin(auth.uid()));
create policy "admin write blog ins" on public.blog_posts for insert to authenticated with check (is_admin(auth.uid()));
create policy "admin write blog upd" on public.blog_posts for update to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "admin write blog del" on public.blog_posts for delete to authenticated using (is_admin(auth.uid()));

create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text,
  status post_status not null default 'draft',
  seo_title text,
  seo_description text,
  noindex boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cms_pages enable row level security;
create trigger trg_cms_pages_updated before update on public.cms_pages
  for each row execute function public.set_updated_at();
create policy "public read pages published" on public.cms_pages for select to anon, authenticated
  using (status = 'published' or is_admin(auth.uid()));
create policy "admin write pages ins" on public.cms_pages for insert to authenticated with check (is_admin(auth.uid()));
create policy "admin write pages upd" on public.cms_pages for update to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "admin write pages del" on public.cms_pages for delete to authenticated using (is_admin(auth.uid()));

create table if not exists public.cms_media (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  url text not null,
  mime_type text,
  size_bytes bigint not null default 0,
  alt_text text,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);
alter table public.cms_media enable row level security;
create policy "staff read media" on public.cms_media for select to authenticated
  using (is_admin(auth.uid()));
create policy "admin write media ins" on public.cms_media for insert to authenticated with check (is_admin(auth.uid()));
create policy "admin write media del" on public.cms_media for delete to authenticated using (is_admin(auth.uid()));

create table if not exists public.marketing_forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  fields jsonb not null default '[]'::jsonb,
  target_email text,
  is_active boolean not null default true,
  submission_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.marketing_forms enable row level security;
create trigger trg_forms_updated before update on public.marketing_forms
  for each row execute function public.set_updated_at();
create policy "public read forms active" on public.marketing_forms for select to anon, authenticated
  using (is_active or is_admin(auth.uid()));
create policy "admin write forms ins" on public.marketing_forms for insert to authenticated with check (is_admin(auth.uid()));
create policy "admin write forms upd" on public.marketing_forms for update to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "admin write forms del" on public.marketing_forms for delete to authenticated using (is_admin(auth.uid()));

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.marketing_forms(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.form_submissions enable row level security;
create policy "public submit forms" on public.form_submissions for insert to anon, authenticated
  with check (true);
create policy "staff read submissions" on public.form_submissions for select to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(),'sales') or has_role(auth.uid(),'support'));

create table if not exists public.seo_settings (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'global',
  title_template text not null default '%s | Oqlio',
  default_description text,
  default_og_image text,
  robots_txt text,
  sitemap_enabled boolean not null default true,
  redirects jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.seo_settings enable row level security;
create trigger trg_seo_updated before update on public.seo_settings
  for each row execute function public.set_updated_at();
create policy "public read seo" on public.seo_settings for select to anon, authenticated using (true);
create policy "admin write seo ins" on public.seo_settings for insert to authenticated with check (is_admin(auth.uid()));
create policy "admin write seo upd" on public.seo_settings for update to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- ============= INTEGRATIONS =============
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  kind integration_kind not null,
  provider text not null,
  label text,
  config jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.integrations enable row level security;
create trigger trg_integrations_updated before update on public.integrations
  for each row execute function public.set_updated_at();
create policy "admin read integrations" on public.integrations for select to authenticated using (is_admin(auth.uid()));
create policy "admin write integrations ins" on public.integrations for insert to authenticated with check (is_admin(auth.uid()));
create policy "admin write integrations upd" on public.integrations for update to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "admin write integrations del" on public.integrations for delete to authenticated using (is_admin(auth.uid()));

create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  secret text,
  events text[] not null default '{}'::text[],
  is_active boolean not null default true,
  last_status integer,
  last_called_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.webhook_endpoints enable row level security;
create trigger trg_webhooks_updated before update on public.webhook_endpoints
  for each row execute function public.set_updated_at();
create policy "admin read webhooks" on public.webhook_endpoints for select to authenticated using (is_admin(auth.uid()));
create policy "admin write webhooks ins" on public.webhook_endpoints for insert to authenticated with check (is_admin(auth.uid()));
create policy "admin write webhooks upd" on public.webhook_endpoints for update to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "admin write webhooks del" on public.webhook_endpoints for delete to authenticated using (is_admin(auth.uid()));

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  prefix text not null,
  key_hash text not null,
  scopes text[] not null default '{}'::text[],
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table public.api_keys enable row level security;
create policy "admin read api keys" on public.api_keys for select to authenticated using (is_admin(auth.uid()));
create policy "admin write api keys ins" on public.api_keys for insert to authenticated with check (is_admin(auth.uid()));
create policy "admin write api keys upd" on public.api_keys for update to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "admin write api keys del" on public.api_keys for delete to authenticated using (is_admin(auth.uid()));

-- Seed default SLA policies
insert into public.sla_policies (name, priority, first_response_minutes, resolution_minutes)
values
  ('Urgent', 'urgent', 15, 240),
  ('High', 'high', 60, 720),
  ('Normal', 'normal', 240, 2880),
  ('Low', 'low', 1440, 10080)
on conflict do nothing;

-- Seed global SEO row
insert into public.seo_settings (scope, title_template, default_description)
values ('global', '%s | Oqlio', 'Punchly by Oqlio — modern attendance & workforce OS for India.')
on conflict do nothing;
