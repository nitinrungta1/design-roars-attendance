
-- =========================================================================
-- HIRING / ATS MODULE
-- =========================================================================

-- Enums ------------------------------------------------------------------
do $$ begin
  create type public.application_status as enum (
    'new','screening','assignment_sent','assignment_submitted',
    'interview_r1','interview_r2','selected','rejected',
    'on_hold','hired','withdrawn'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.work_type as enum ('remote','hybrid','onsite');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.experience_level as enum ('intern','junior','mid','senior','lead');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.interview_mode as enum ('video','phone','onsite');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.interview_outcome as enum ('pending','passed','failed','no_show','rescheduled');
exception when duplicate_object then null; end $$;

-- Extend job_postings -----------------------------------------------------
alter table public.job_postings
  add column if not exists short_description text,
  add column if not exists work_type public.work_type not null default 'remote',
  add column if not exists experience_level public.experience_level not null default 'mid',
  add column if not exists skills text[] not null default '{}',
  add column if not exists screening_questions jsonb not null default '[]'::jsonb,
  add column if not exists department_id uuid references public.departments(id) on delete set null,
  add column if not exists view_count integer not null default 0;

create index if not exists idx_job_postings_status_pub on public.job_postings(status, published_at desc);
create index if not exists idx_job_postings_department on public.job_postings(department_id);

-- candidates --------------------------------------------------------------
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  city text,
  resume_url text,
  linkedin_url text,
  portfolio_url text,
  in_talent_pool boolean not null default false,
  source text,
  rating smallint check (rating between 0 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(email)
);
create index if not exists idx_candidates_auth_user on public.candidates(auth_user_id);
create index if not exists idx_candidates_talent_pool on public.candidates(in_talent_pool) where in_talent_pool = true;

-- applications ------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  job_id uuid not null references public.job_postings(id) on delete cascade,
  status public.application_status not null default 'new',
  applied_at timestamptz not null default now(),
  cover_letter text,
  why_us text,
  current_salary text,
  expected_salary text,
  notice_period text,
  experience_years numeric(4,1),
  screening_answers jsonb not null default '{}'::jsonb,
  source text,
  allow_reapply boolean not null default false,
  rating smallint check (rating between 0 and 5),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(candidate_id, job_id)
);
create index if not exists idx_applications_job on public.applications(job_id);
create index if not exists idx_applications_candidate on public.applications(candidate_id);
create index if not exists idx_applications_status on public.applications(status);
create index if not exists idx_applications_applied_at on public.applications(applied_at desc);

-- application_events (timeline) ------------------------------------------
create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_status public.application_status,
  to_status public.application_status,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_app_events_application on public.application_events(application_id, created_at desc);

-- application_notes -------------------------------------------------------
create table if not exists public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_app_notes_application on public.application_notes(application_id, created_at desc);

-- assignments (reusable templates) ---------------------------------------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  attachment_url text,
  due_in_days integer not null default 5,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- application_assignments (instance per application) --------------------
create table if not exists public.application_assignments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete restrict,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  sent_at timestamptz not null default now(),
  due_at timestamptz,
  submission_url text,
  submission_text text,
  submitted_at timestamptz,
  score smallint check (score between 0 and 100),
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_app_assignments_application on public.application_assignments(application_id);
create index if not exists idx_app_assignments_token on public.application_assignments(token);

-- interviews -------------------------------------------------------------
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_min integer not null default 45,
  mode public.interview_mode not null default 'video',
  link text,
  panel jsonb not null default '[]'::jsonb,
  outcome public.interview_outcome not null default 'pending',
  notes text,
  round_label text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_interviews_application on public.interviews(application_id);
create index if not exists idx_interviews_scheduled on public.interviews(scheduled_at);

-- updated_at triggers ----------------------------------------------------
drop trigger if exists trg_candidates_updated on public.candidates;
create trigger trg_candidates_updated before update on public.candidates
  for each row execute function public.set_updated_at();

drop trigger if exists trg_applications_updated on public.applications;
create trigger trg_applications_updated before update on public.applications
  for each row execute function public.set_updated_at();

drop trigger if exists trg_assignments_updated on public.assignments;
create trigger trg_assignments_updated before update on public.assignments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_app_assignments_updated on public.application_assignments;
create trigger trg_app_assignments_updated before update on public.application_assignments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_interviews_updated on public.interviews;
create trigger trg_interviews_updated before update on public.interviews
  for each row execute function public.set_updated_at();

-- Status-change → timeline trigger ---------------------------------------
create or replace function public.applications_log_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.application_events(application_id, actor_id, event_type, to_status)
      values (new.id, auth.uid(), 'application_created', new.status);
  elsif (tg_op = 'UPDATE') and (old.status is distinct from new.status) then
    insert into public.application_events(application_id, actor_id, event_type, from_status, to_status)
      values (new.id, auth.uid(), 'status_changed', old.status, new.status);
  end if;
  return new;
end $$;

drop trigger if exists trg_applications_status_change on public.applications;
create trigger trg_applications_status_change
  after insert or update of status on public.applications
  for each row execute function public.applications_log_status_change();

-- Helper: is current user the candidate behind this application? ---------
create or replace function public.is_application_owner(_application_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.candidates c on c.id = a.candidate_id
    where a.id = _application_id and c.auth_user_id = auth.uid()
  );
$$;

create or replace function public.is_candidate_owner(_candidate_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.candidates where id = _candidate_id and auth_user_id = auth.uid()
  );
$$;

-- ENABLE RLS -------------------------------------------------------------
alter table public.candidates enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.application_notes enable row level security;
alter table public.assignments enable row level security;
alter table public.application_assignments enable row level security;
alter table public.interviews enable row level security;

-- POLICIES ---------------------------------------------------------------

-- candidates
drop policy if exists "candidates_admin_all" on public.candidates;
create policy "candidates_admin_all" on public.candidates
  for all to authenticated
  using (public.is_attendance_admin(auth.uid()))
  with check (public.is_attendance_admin(auth.uid()));

drop policy if exists "candidates_self_select" on public.candidates;
create policy "candidates_self_select" on public.candidates
  for select to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "candidates_self_update" on public.candidates;
create policy "candidates_self_update" on public.candidates
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- applications
drop policy if exists "applications_admin_all" on public.applications;
create policy "applications_admin_all" on public.applications
  for all to authenticated
  using (public.is_attendance_admin(auth.uid()))
  with check (public.is_attendance_admin(auth.uid()));

drop policy if exists "applications_owner_select" on public.applications;
create policy "applications_owner_select" on public.applications
  for select to authenticated
  using (public.is_candidate_owner(candidate_id));

drop policy if exists "applications_owner_withdraw" on public.applications;
create policy "applications_owner_withdraw" on public.applications
  for update to authenticated
  using (public.is_candidate_owner(candidate_id))
  with check (public.is_candidate_owner(candidate_id));

-- application_events (read-only for owner, full for admin)
drop policy if exists "app_events_admin_all" on public.application_events;
create policy "app_events_admin_all" on public.application_events
  for all to authenticated
  using (public.is_attendance_admin(auth.uid()))
  with check (public.is_attendance_admin(auth.uid()));

drop policy if exists "app_events_owner_select" on public.application_events;
create policy "app_events_owner_select" on public.application_events
  for select to authenticated
  using (public.is_application_owner(application_id));

-- application_notes (admin only)
drop policy if exists "app_notes_admin_all" on public.application_notes;
create policy "app_notes_admin_all" on public.application_notes
  for all to authenticated
  using (public.is_attendance_admin(auth.uid()))
  with check (public.is_attendance_admin(auth.uid()));

-- assignments (admin write, public can read active)
drop policy if exists "assignments_admin_all" on public.assignments;
create policy "assignments_admin_all" on public.assignments
  for all to authenticated
  using (public.is_attendance_admin(auth.uid()))
  with check (public.is_attendance_admin(auth.uid()));

-- application_assignments
drop policy if exists "app_assignments_admin_all" on public.application_assignments;
create policy "app_assignments_admin_all" on public.application_assignments
  for all to authenticated
  using (public.is_attendance_admin(auth.uid()))
  with check (public.is_attendance_admin(auth.uid()));

drop policy if exists "app_assignments_owner_select" on public.application_assignments;
create policy "app_assignments_owner_select" on public.application_assignments
  for select to authenticated
  using (public.is_application_owner(application_id));

drop policy if exists "app_assignments_owner_submit" on public.application_assignments;
create policy "app_assignments_owner_submit" on public.application_assignments
  for update to authenticated
  using (public.is_application_owner(application_id))
  with check (public.is_application_owner(application_id));

-- interviews (admin all, owner read)
drop policy if exists "interviews_admin_all" on public.interviews;
create policy "interviews_admin_all" on public.interviews
  for all to authenticated
  using (public.is_attendance_admin(auth.uid()))
  with check (public.is_attendance_admin(auth.uid()));

drop policy if exists "interviews_owner_select" on public.interviews;
create policy "interviews_owner_select" on public.interviews
  for select to authenticated
  using (public.is_application_owner(application_id));

-- STORAGE BUCKETS --------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('resumes','resumes', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('assignment-files','assignment-files', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('assignment-submissions','assignment-submissions', false)
  on conflict (id) do nothing;

-- Storage policies: admins manage all; candidates manage their own folder
drop policy if exists "resumes_admin_all" on storage.objects;
create policy "resumes_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'resumes' and public.is_attendance_admin(auth.uid()))
  with check (bucket_id = 'resumes' and public.is_attendance_admin(auth.uid()));

drop policy if exists "resumes_owner_rw" on storage.objects;
create policy "resumes_owner_rw" on storage.objects
  for all to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- Public can write resumes during apply (anonymous flow) into a 'public/' prefix
drop policy if exists "resumes_public_write" on storage.objects;
create policy "resumes_public_write" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = 'public');

drop policy if exists "assignment_files_admin_all" on storage.objects;
create policy "assignment_files_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'assignment-files' and public.is_attendance_admin(auth.uid()))
  with check (bucket_id = 'assignment-files' and public.is_attendance_admin(auth.uid()));

drop policy if exists "assignment_subs_admin_all" on storage.objects;
create policy "assignment_subs_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'assignment-submissions' and public.is_attendance_admin(auth.uid()))
  with check (bucket_id = 'assignment-submissions' and public.is_attendance_admin(auth.uid()));

drop policy if exists "assignment_subs_owner_write" on storage.objects;
create policy "assignment_subs_owner_write" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'assignment-submissions');
