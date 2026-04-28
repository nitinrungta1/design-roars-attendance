# Why no signed-up users appear

I checked the database directly. The reality is:

- `auth.users` contains only **2 records** total — `nitin@dataroars.com` and `muskan@designroars.com`. Both already show in the panel as super_admins.
- **No "free user" or "paid plan" signup has ever reached the database.** There is nothing to display because nothing was created.
- The `on_auth_user_created` trigger on `auth.users` is **missing** (zero triggers on the table). So even when a new person does sign up, they won't get a `profiles` row or a default `employee` role — and they'll appear as a ghost row with no name and no role.
- The `/pricing` page does not actually start a signup for "Free" or any paid plan — its CTAs don't call `supabase.auth.signUp` or even route to `/signup` with the right context. The only working signup path is `/signup`, which requires email confirmation.

So the issue is three things stacked: the trigger is gone, the pricing flow doesn't sign anyone up, and any user who never confirms email isn't visibly flagged.

# What I will fix

## 1. Recreate the `handle_new_user` trigger on `auth.users` (migration)

The function `public.handle_new_user()` already exists and is correct. Only the trigger binding is missing. Migration:

```sql
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

This guarantees every future signup gets a `profiles` row + an `employee` role, so they show up properly in the Users panel with name, company, and role.

## 2. Wire the Pricing page CTAs to actual signup

In `src/routes/pricing.tsx`, every plan button (Free, Starter, Growth, Business) will route to `/signup?plan=<slug>&cycle=<monthly|yearly>`. Enterprise stays on `/contact`.

In `src/routes/signup.tsx`, after a successful signup, read `plan` from the URL and:
- Free → redirect to `/admin` (or `/auth-callback` if confirmation required).
- Paid → redirect to `/admin/billing/plans?plan=<slug>` so they can complete checkout.

This means clicking "Start free" on `/pricing` actually creates an `auth.users` row.

## 3. Show unconfirmed and ghost users in the Users panel

Update `listPlatformUsers` in `src/lib/access.functions.ts` to also expose `email_confirmed_at` per user, and add a small "Pending email" badge in `src/routes/_authenticated.admin.access.users.tsx` for users where it's null. This way you can see people who signed up but never confirmed (today they're invisible to you).

## 4. One-time data backfill for any orphan auth users

If a future or past signup landed without a profile, run an idempotent backfill in the same migration:

```sql
insert into public.profiles (id, full_name)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email,'@',1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

insert into public.user_roles (user_id, role)
select u.id, 'employee'::public.app_role
from auth.users u
where not exists (select 1 from public.user_roles r where r.user_id = u.id);
```

# Files touched

- New migration: trigger + backfill (section 1 & 4)
- `src/routes/pricing.tsx` — CTA links
- `src/routes/signup.tsx` — read `plan` query param, route accordingly
- `src/lib/access.functions.ts` — include `email_confirmed_at` in `PlatformUserRow`
- `src/routes/_authenticated.admin.access.users.tsx` — render "Pending email" badge

# What you'll see after

- Anyone who signs up via `/signup` or clicks any Pricing CTA appears in **Admin → Access → Users** with their name, default `employee` role, and a "Pending email" badge until they confirm.
- Existing 2 super_admins continue to display as today.
