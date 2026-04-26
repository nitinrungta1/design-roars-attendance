
-- Tighten support_tickets insert
drop policy if exists "anyone insert tickets" on public.support_tickets;
create policy "anyone insert tickets" on public.support_tickets for insert to authenticated
  with check (
    char_length(subject) between 1 and 500
    and requester_email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
    and char_length(requester_email) <= 320
    and (body is null or char_length(body) <= 50000)
  );

-- Tighten form_submissions insert
drop policy if exists "public submit forms" on public.form_submissions;
create policy "public submit forms" on public.form_submissions for insert to anon, authenticated
  with check (
    octet_length(payload::text) <= 32768
    and (form_id is null or exists (
      select 1 from public.marketing_forms f where f.id = form_id and f.is_active = true
    ))
  );
