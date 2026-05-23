## Plan: Redirect marketing auth routes to app.oqlio.com

### Goal
Point the marketing site (oqlio.com) to the separate app (app.oqlio.com) for all authentication, signup, and dashboard entry points. Update the header nav links accordingly.

### Files to modify (6 files only)

1. **`src/components/brand/marketing-header.tsx`**
   - Replace `<Link to="/login">Sign in</Link>` with `<a href="https://app.oqlio.com/login">Sign in</a>`
   - Replace `<Link to="/login" onClick={…}>` (mobile) with `<a href="https://app.oqlio.com/login">Sign in</a>`
   - Replace `<Link to="/signup">Start free trial</Link>` with `<a href="https://app.oqlio.com/signup">Start free trial</a>`
   - Replace `<Link to="/signup" onClick={…}>` (mobile) with `<a href="https://app.oqlio.com/signup">Start free</a>`

2. **`src/routes/pricing.tsx`**
   - Find any signup CTA/button link pointing to `/signup` and change it to `https://app.oqlio.com/signup` (preserve query params if present).

3. **`src/routes/login.tsx`** — Replace entire route component with a client-side redirect to `https://app.oqlio.com/login`.

4. **`src/routes/signup.tsx`** — Replace entire route component with a client-side redirect to `https://app.oqlio.com/signup`, preserving `window.location.search`.

5. **`src/routes/forgot-password.tsx`** — Replace entire route component with a client-side redirect to `https://app.oqlio.com/forgot-password`.

6. **`src/routes/_authenticated.tsx`** — Replace entire route component with a client-side redirect to `https://app.oqlio.com/dashboard`.

### Technical notes
- Each redirect route uses a minimal component that checks `typeof window !== "undefined"` before calling `window.location.replace(...)`.
- No other files will be touched.
- `seo()` head calls and `validateSearch` on `/login` will be removed since the component no longer renders a page — just the redirect.
