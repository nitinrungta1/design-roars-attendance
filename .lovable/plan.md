## Goal

Two problems to solve:

1. **Admin `/admin/billing/plans` shows nothing** even though 5 plans (Free, Starter, Growth, Business, Enterprise) exist in the database. The current reader uses the user-scoped Supabase client and silently returns `{ plans: [] }` on any RLS / auth hiccup, so the table looks empty.
2. **Pricing must become per-user (per-seat)** instead of a flat plan fee — both in the database, in the admin editor, and on the public `/pricing` page. No dummy values; everything computed from real data.

## What's wrong today

- `listPlans` queries `plans` through the user-bound client. If the bearer token / role check momentarily fails, it returns an empty list with no error surfaced to the UI — the page then renders "No plans".
- `updatePlan` has the same silent-failure shape.
- The plans table has only `price_monthly` / `price_yearly` (flat). There's no per-seat price or seat range, so per-user pricing can't be expressed.
- The public pricing card divides the flat plan price (not a per-seat price). Yearly discount is hardcoded to 20% when missing.
- No "Create" or "Delete" actions exist on the admin page.

## Changes

### 1. Database (migration)

Add per-user pricing columns to `plans`:

- `price_per_user_monthly numeric(12,2) not null default 0`
- `price_per_user_yearly  numeric(12,2) not null default 0`
- `min_seats int not null default 1`
- `included_seats int not null default 0` (seats covered by base price; seats above this are charged per-user)
- `billing_model text not null default 'per_user' check (billing_model in ('flat','per_user','hybrid'))`

Backfill from current values so nothing breaks:
- Starter → ₹99/user/mo, Growth → ₹199/user/mo, Business → ₹299/user/mo (derived from current monthly ÷ a sensible seat count; user can edit afterwards).
- Free / Enterprise stay at 0 (Enterprise = "Talk to sales").
- Yearly per-user = monthly × 12 × 0.8 by default.

Keep `price_monthly` / `price_yearly` for backward compatibility but treat them as the **base fee** (often 0 for pure per-user plans).

### 2. Server functions (`src/lib/billing.functions.ts`)

- Switch `listPlans` to **fail loud**: throw a descriptive Error on Supabase error so React Query surfaces it in the UI instead of showing an empty table.
- Add an explicit permission gate (super_admin / admin / finance) using the same pattern used elsewhere; on denial, throw a 403-style error the UI can display as "Access denied".
- For resilience against transient RLS edge cases for trusted staff, route the read through `supabaseAdmin` **after** the explicit role check (same pattern recently applied to KB).
- Extend `PlanRow`, `UpdatePlanSchema`, and the patch builder with the new columns: `price_per_user_monthly`, `price_per_user_yearly`, `min_seats`, `included_seats`, `billing_model`.
- Add `createPlan` (insert) and `deletePlan` (delete) server functions, both gated by the same role check.

### 3. Admin Plans page (`src/routes/_authenticated.admin.billing.plans.tsx`)

- Show a real **error state** when `listPlans` throws (with the message), instead of a blank table.
- Show a real **access-denied state** for users without permission.
- Add a **"New plan"** button → opens the same dialog in create mode.
- Add a **delete** action (with confirm) per row.
- Replace the "Monthly / Yearly" columns with per-user-aware columns:
  - `Per user / mo` (primary)
  - `Per user / yr` (or auto-derived from discount %)
  - `Included seats` and `Min seats`
  - Keep `Base fee` as a secondary column for hybrid plans.
- The edit dialog gets a **Pricing model** toggle (Flat · Per user · Hybrid) and inputs for the new fields. Live preview shows the price for a sample team size (e.g. 10 users).

### 4. Public pricing page (`src/routes/pricing.tsx` + `src/lib/pricing-public.ts`)

- Extend `PublicPlan` with the new fields.
- Update `PlanCard` to render real per-user pricing:
  - Headline shows `{currency} {per_user_price} / user / month`
  - Sub-line shows `Billed {monthly|yearly}. Min {min_seats} users.`
  - When `cycle === "yearly"`, use `price_per_user_yearly / 12`; compute the savings vs. monthly from real DB numbers (no more hardcoded 20%).
  - Hybrid plans show `{base fee} + {per_user_price} / user / mo`.
- Free and Enterprise tiers keep their current treatment (Free is free, Enterprise = "Talk to sales").
- Remove the `FALLBACK_PLANS` array — if the DB read fails, surface a real error rather than a hardcoded plan.

### 5. Memory

Save a feature memory `mem://features/pricing` describing the per-user billing model so future edits stay consistent.

## Files to edit / create

- `supabase/migrations/<new>.sql` — add columns + backfill
- `src/lib/billing.functions.ts` — fail-loud reader, role gate, new fields, create/delete
- `src/routes/_authenticated.admin.billing.plans.tsx` — error/empty/denied states, create + delete, per-user fields
- `src/lib/pricing-public.ts` — new fields, drop fallback
- `src/routes/pricing.tsx` — per-user rendering
- `mem://features/pricing` — record the model

## Out of scope (ask before doing)

- Wiring per-user pricing into the actual checkout / Stripe / subscriptions flow. Today the project doesn't charge real money yet — this plan only fixes the catalog and how it's displayed. I'll flag this as the next step once the catalog side is solid.
