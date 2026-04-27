-- =====================================================
-- BATCH 7 — SUPPORT MODULE (additive, reuses existing enums)
-- =====================================================

-- support_tickets — additive columns
alter table public.support_tickets
  add column if not exists tags text[] not null default '{}',
  add column if not exists requester_user_id uuid references auth.users(id) on delete set null,
  add column if not exists closed_at timestamptz;

create index if not exists support_tickets_status_idx          on public.support_tickets(status);
create index if not exists support_tickets_priority_idx        on public.support_tickets(priority);
create index if not exists support_tickets_assigned_to_idx     on public.support_tickets(assigned_to);
create index if not exists support_tickets_requester_email_idx on public.support_tickets(lower(requester_email));
create index if not exists support_tickets_company_idx         on public.support_tickets(company_id);
create index if not exists support_tickets_created_at_idx      on public.support_tickets(created_at desc);

drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;

-- support_ticket_messages
create table if not exists public.support_ticket_messages (
  id            uuid primary key default gen_random_uuid(),
  ticket_id     uuid not null references public.support_tickets(id) on delete cascade,
  author_id     uuid references auth.users(id) on delete set null,
  author_email  text,
  author_name   text,
  body          text not null,
  is_internal   boolean not null default false,
  attachments   jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists support_ticket_messages_ticket_idx on public.support_ticket_messages(ticket_id, created_at);
alter table public.support_ticket_messages enable row level security;

-- support_macros
create table if not exists public.support_macros (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  body        text not null,
  tags        text[] not null default '{}',
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists set_support_macros_updated_at on public.support_macros;
create trigger set_support_macros_updated_at
before update on public.support_macros
for each row execute function public.set_updated_at();
alter table public.support_macros enable row level security;

-- support_sla_policies
create table if not exists public.support_sla_policies (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  priority                 public.ticket_priority not null,
  first_response_minutes   integer not null default 60,
  resolution_minutes       integer not null default 1440,
  business_hours           jsonb not null default '{}'::jsonb,
  is_default               boolean not null default false,
  is_active                boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create unique index if not exists support_sla_unique_default_per_priority
  on public.support_sla_policies(priority) where is_default = true;
drop trigger if exists set_support_sla_policies_updated_at on public.support_sla_policies;
create trigger set_support_sla_policies_updated_at
before update on public.support_sla_policies
for each row execute function public.set_updated_at();
alter table public.support_sla_policies enable row level security;

insert into public.support_sla_policies (name, priority, first_response_minutes, resolution_minutes, is_default)
select * from (values
  ('Default — Low',    'low'::public.ticket_priority,    24*60,  7*24*60, true),
  ('Default — Normal', 'normal'::public.ticket_priority, 8*60,   3*24*60, true),
  ('Default — High',   'high'::public.ticket_priority,   2*60,   24*60,   true),
  ('Default — Urgent', 'urgent'::public.ticket_priority, 30,     8*60,    true)
) as v(name, priority, first_response_minutes, resolution_minutes, is_default)
where not exists (
  select 1 from public.support_sla_policies p
  where p.priority = v.priority and p.is_default = true
);

-- SLA stamping trigger
create or replace function public.assign_ticket_sla()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_minutes int;
begin
  if new.sla_due_at is not null then return new; end if;
  select first_response_minutes into v_minutes
  from public.support_sla_policies
  where priority = new.priority and is_default = true and is_active = true
  limit 1;
  if v_minutes is not null then
    new.sla_due_at := coalesce(new.created_at, now()) + make_interval(mins => v_minutes);
  end if;
  return new;
end; $$;

drop trigger if exists support_tickets_assign_sla on public.support_tickets;
create trigger support_tickets_assign_sla
before insert on public.support_tickets
for each row execute function public.assign_ticket_sla();

-- kb_categories
create table if not exists public.kb_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists set_kb_categories_updated_at on public.kb_categories;
create trigger set_kb_categories_updated_at
before update on public.kb_categories
for each row execute function public.set_updated_at();
alter table public.kb_categories enable row level security;

-- kb_articles — additive columns (reuses existing post_status enum)
alter table public.kb_articles
  add column if not exists category_id uuid references public.kb_categories(id) on delete set null,
  add column if not exists excerpt text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists helpful_count integer not null default 0,
  add column if not exists unhelpful_count integer not null default 0,
  add column if not exists position integer not null default 0;

create index if not exists kb_articles_status_idx      on public.kb_articles(status);
create index if not exists kb_articles_category_id_idx on public.kb_articles(category_id);

drop trigger if exists set_kb_articles_updated_at on public.kb_articles;
create trigger set_kb_articles_updated_at
before update on public.kb_articles
for each row execute function public.set_updated_at();
alter table public.kb_articles enable row level security;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- support_tickets
drop policy if exists "public submit tickets" on public.support_tickets;
create policy "public submit tickets" on public.support_tickets
  for insert to anon, authenticated
  with check (
    char_length(subject) between 1 and 300
    and (body is null or char_length(body) <= 20000)
    and char_length(requester_email) between 5 and 320
    and requester_email ~* '^[a-z0-9._%%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
  );

drop policy if exists "staff read tickets" on public.support_tickets;
create policy "staff read tickets" on public.support_tickets
  for select to authenticated
  using (
    is_admin(auth.uid())
    or has_role(auth.uid(), 'support'::app_role)
    or has_role(auth.uid(), 'sales'::app_role)
    or requester_user_id = auth.uid()
    or lower(requester_email) = lower(coalesce((auth.jwt() ->> 'email')::text, ''))
  );

drop policy if exists "staff update tickets" on public.support_tickets;
create policy "staff update tickets" on public.support_tickets
  for update to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role))
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role));

drop policy if exists "admin delete tickets" on public.support_tickets;
create policy "admin delete tickets" on public.support_tickets
  for delete to authenticated using (is_admin(auth.uid()));

-- support_ticket_messages
drop policy if exists "public insert ticket messages on own ticket" on public.support_ticket_messages;
create policy "public insert ticket messages on own ticket" on public.support_ticket_messages
  for insert to anon, authenticated
  with check (
    is_internal = false
    and char_length(body) between 1 and 20000
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id
        and (
          is_admin(auth.uid())
          or has_role(auth.uid(), 'support'::app_role)
          or t.requester_user_id = auth.uid()
          or lower(t.requester_email) = lower(coalesce(author_email, (auth.jwt() ->> 'email')::text, ''))
        )
    )
  );

drop policy if exists "staff insert internal notes" on public.support_ticket_messages;
create policy "staff insert internal notes" on public.support_ticket_messages
  for insert to authenticated
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role));

drop policy if exists "read ticket messages" on public.support_ticket_messages;
create policy "read ticket messages" on public.support_ticket_messages
  for select to authenticated
  using (
    is_admin(auth.uid())
    or has_role(auth.uid(), 'support'::app_role)
    or (
      is_internal = false
      and exists (
        select 1 from public.support_tickets t
        where t.id = ticket_id
          and (
            t.requester_user_id = auth.uid()
            or lower(t.requester_email) = lower(coalesce((auth.jwt() ->> 'email')::text, ''))
          )
      )
    )
  );

drop policy if exists "staff delete ticket messages" on public.support_ticket_messages;
create policy "staff delete ticket messages" on public.support_ticket_messages
  for delete to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role));

-- support_macros
drop policy if exists "staff read macros" on public.support_macros;
create policy "staff read macros" on public.support_macros
  for select to authenticated using (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role));
drop policy if exists "staff write macros ins" on public.support_macros;
create policy "staff write macros ins" on public.support_macros
  for insert to authenticated with check (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role));
drop policy if exists "staff write macros upd" on public.support_macros;
create policy "staff write macros upd" on public.support_macros
  for update to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role))
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role));
drop policy if exists "staff write macros del" on public.support_macros;
create policy "staff write macros del" on public.support_macros
  for delete to authenticated using (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role));

-- support_sla_policies
drop policy if exists "staff read sla" on public.support_sla_policies;
create policy "staff read sla" on public.support_sla_policies
  for select to authenticated using (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role));
drop policy if exists "admin write sla ins" on public.support_sla_policies;
create policy "admin write sla ins" on public.support_sla_policies
  for insert to authenticated with check (is_admin(auth.uid()));
drop policy if exists "admin write sla upd" on public.support_sla_policies;
create policy "admin write sla upd" on public.support_sla_policies
  for update to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
drop policy if exists "admin write sla del" on public.support_sla_policies;
create policy "admin write sla del" on public.support_sla_policies
  for delete to authenticated using (is_admin(auth.uid()));

-- kb_categories
drop policy if exists "public read kb_categories" on public.kb_categories;
create policy "public read kb_categories" on public.kb_categories
  for select to anon, authenticated using (true);
drop policy if exists "admin write kb_categories ins" on public.kb_categories;
create policy "admin write kb_categories ins" on public.kb_categories
  for insert to authenticated with check (is_admin(auth.uid()));
drop policy if exists "admin write kb_categories upd" on public.kb_categories;
create policy "admin write kb_categories upd" on public.kb_categories
  for update to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
drop policy if exists "admin write kb_categories del" on public.kb_categories;
create policy "admin write kb_categories del" on public.kb_categories
  for delete to authenticated using (is_admin(auth.uid()));

-- kb_articles (status is post_status)
drop policy if exists "public read kb published" on public.kb_articles;
create policy "public read kb published" on public.kb_articles
  for select to anon, authenticated
  using (status = 'published'::public.post_status or is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role));
drop policy if exists "admin write kb ins" on public.kb_articles;
create policy "admin write kb ins" on public.kb_articles
  for insert to authenticated
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role));
drop policy if exists "admin write kb upd" on public.kb_articles;
create policy "admin write kb upd" on public.kb_articles
  for update to authenticated
  using (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role))
  with check (is_admin(auth.uid()) or has_role(auth.uid(), 'support'::app_role));
drop policy if exists "admin write kb del" on public.kb_articles;
create policy "admin write kb del" on public.kb_articles
  for delete to authenticated using (is_admin(auth.uid()));

-- KB counters
create or replace function public.kb_record_vote(_slug text, _helpful boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _helpful then
    update public.kb_articles set helpful_count = helpful_count + 1
      where slug = _slug and status = 'published'::public.post_status;
  else
    update public.kb_articles set unhelpful_count = unhelpful_count + 1
      where slug = _slug and status = 'published'::public.post_status;
  end if;
end; $$;
grant execute on function public.kb_record_vote(text, boolean) to anon, authenticated;

create or replace function public.kb_record_view(_slug text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.kb_articles set view_count = view_count + 1
    where slug = _slug and status = 'published'::public.post_status;
end; $$;
grant execute on function public.kb_record_view(text) to anon, authenticated;
