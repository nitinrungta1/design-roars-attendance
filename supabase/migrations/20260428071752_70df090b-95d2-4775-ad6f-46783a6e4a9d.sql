-- Fix storage UPDATE policy: needs both USING and WITH CHECK to allow upsert
drop policy if exists "Admins can update brand assets" on storage.objects;
create policy "Admins can update brand assets"
on storage.objects for update
to authenticated
using (bucket_id = 'brand-assets' and public.is_admin(auth.uid()))
with check (bucket_id = 'brand-assets' and public.is_admin(auth.uid()));

-- Brand name no longer needs to be globally unique — each workspace has its own.
drop index if exists public.companies_name_ci_idx;