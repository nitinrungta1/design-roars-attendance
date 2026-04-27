
-- ============================================================
-- Help Centre: feedback, search analytics, article tags
-- ============================================================

create table if not exists public.kb_article_feedback (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.kb_articles(id) on delete cascade,
  slug text not null,
  helpful boolean not null,
  comment text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists kb_article_feedback_slug_idx on public.kb_article_feedback (slug);
create index if not exists kb_article_feedback_created_idx on public.kb_article_feedback (created_at desc);

create table if not exists public.kb_search_logs (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  results_count int not null default 0,
  clicked_slug text,
  user_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists kb_search_logs_query_idx on public.kb_search_logs (lower(query));
create index if not exists kb_search_logs_created_idx on public.kb_search_logs (created_at desc);
create index if not exists kb_search_logs_zero_idx on public.kb_search_logs (created_at desc) where results_count = 0;

create table if not exists public.kb_article_tags (
  article_id uuid not null references public.kb_articles(id) on delete cascade,
  tag text not null,
  primary key (article_id, tag)
);
create index if not exists kb_article_tags_tag_idx on public.kb_article_tags (tag);

-- ============================================================
-- RLS
-- ============================================================
alter table public.kb_article_feedback enable row level security;
alter table public.kb_search_logs enable row level security;
alter table public.kb_article_tags enable row level security;

-- Public can submit feedback / log searches
drop policy if exists "Anyone can submit feedback" on public.kb_article_feedback;
create policy "Anyone can submit feedback" on public.kb_article_feedback
  for insert to anon, authenticated with check (true);

drop policy if exists "Staff can read feedback" on public.kb_article_feedback;
create policy "Staff can read feedback" on public.kb_article_feedback
  for select to authenticated using (
    public.has_role(auth.uid(), 'support'::public.app_role)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

drop policy if exists "Anyone can log search" on public.kb_search_logs;
create policy "Anyone can log search" on public.kb_search_logs
  for insert to anon, authenticated with check (true);

drop policy if exists "Staff can read search logs" on public.kb_search_logs;
create policy "Staff can read search logs" on public.kb_search_logs
  for select to authenticated using (
    public.has_role(auth.uid(), 'support'::public.app_role)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Tags readable by all (public articles need them); managed by staff
drop policy if exists "Tags are public" on public.kb_article_tags;
create policy "Tags are public" on public.kb_article_tags
  for select to anon, authenticated using (true);

drop policy if exists "Staff manage tags" on public.kb_article_tags;
create policy "Staff manage tags" on public.kb_article_tags
  for all to authenticated using (
    public.has_role(auth.uid(), 'support'::public.app_role)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'super_admin'::public.app_role)
  ) with check (
    public.has_role(auth.uid(), 'support'::public.app_role)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- ============================================================
-- RPC: search articles with simple ranking + log automatically
-- ============================================================
create or replace function public.kb_search_articles(_q text, _limit int default 10)
returns table (
  id uuid,
  slug text,
  title text,
  excerpt text,
  category text,
  view_count int,
  rank real
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.slug, a.title, a.excerpt, a.category, a.view_count,
    (case when a.title ilike '%' || _q || '%' then 3.0 else 0 end
     + case when a.excerpt ilike '%' || _q || '%' then 1.5 else 0 end
     + case when a.body    ilike '%' || _q || '%' then 1.0 else 0 end)::real as rank
  from public.kb_articles a
  where a.status = 'published'::public.post_status
    and (
      a.title ilike '%' || _q || '%'
      or a.excerpt ilike '%' || _q || '%'
      or a.body ilike '%' || _q || '%'
    )
  order by rank desc, a.view_count desc
  limit _limit;
$$;

grant execute on function public.kb_search_articles(text, int) to anon, authenticated;
