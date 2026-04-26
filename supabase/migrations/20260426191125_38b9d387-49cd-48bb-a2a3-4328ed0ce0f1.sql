-- Replace permissive policies with validated ones
drop policy if exists "anyone can insert leads" on public.leads;
drop policy if exists "anyone can insert subscribers" on public.subscribers;
drop policy if exists "anyone can insert demo requests" on public.demo_requests;

create policy "public can submit valid leads"
  on public.leads for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 200
    and email ~* '^[a-z0-9._%%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
    and char_length(email) <= 320
    and (message is null or char_length(message) <= 5000)
    and (company is null or char_length(company) <= 200)
    and (phone is null or char_length(phone) <= 40)
  );

create policy "public can subscribe with valid email"
  on public.subscribers for insert
  to anon, authenticated
  with check (
    email ~* '^[a-z0-9._%%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
    and char_length(email) <= 320
  );

create policy "public can submit valid demo requests"
  on public.demo_requests for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 200
    and email ~* '^[a-z0-9._%%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
    and char_length(email) <= 320
    and (message is null or char_length(message) <= 5000)
    and (company is null or char_length(company) <= 200)
  );