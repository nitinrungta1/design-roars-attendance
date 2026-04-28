## Plan to fix Help Centre articles missing in Admin

I confirmed the database currently has **11 published Help Centre articles**, and the public Help Centre is reading from the same `kb_articles` table. The backend/admin page should show those same articles, so the fix will harden the admin reader and UI around permissions/auth loading.

### What I’ll change

1. **Make the admin KB list use a trusted backend read path**
   - Update `adminListKbArticles` so the admin list can read all KB articles reliably from the backend after authentication.
   - Keep authentication required for the admin route.
   - Add a server-side permission check for `support.kb.read`, `support.kb.write`, admin, support, or super admin before returning article data.
   - This avoids published articles disappearing because of row-level policy/session timing differences.

2. **Align backend rows with frontend published rows**
   - Ensure the admin response includes the same published article records that appear on `/help`.
   - Keep drafts/archived articles available in admin for staff who can manage content.
   - Preserve current columns: title, slug, category, status, views, updated date, body, SEO fields.

3. **Improve admin page permission/loading behavior**
   - Update `/admin/support/kb` to wait for auth/permission loading before deciding whether to show the “New article” CTA or empty states.
   - Show a clear “Access denied” state if the signed-in user does not have KB read permission.
   - Keep the existing error banner and retry button.

4. **Fix create/edit permissions consistently**
   - Make `upsertKbArticle`, `deleteKbArticle`, category, feedback, and analytics admin functions use the same explicit server-side permission guard where appropriate.
   - Prevent the UI from showing write actions until auth permissions are fully loaded.

5. **Validate after implementation**
   - Re-check the database count of published articles.
   - Verify the admin KB function returns the 11 existing published articles.
   - Verify the New Article CTA is visible for users with `support.kb.write` and hidden for read-only users.

### Technical details

- Files to update:
  - `src/lib/kb-admin.functions.ts`
  - `src/routes/_authenticated.admin.support.kb.tsx`
  - potentially `src/routes/_authenticated.admin.support.kb.new.tsx`
  - potentially `src/routes/_authenticated.admin.support.kb.$id.tsx`

- Backend behavior:
  - Continue requiring a logged-in admin/support user.
  - Use the backend service client only after the user is authenticated and permission-checked.
  - Keep public Help Centre access unchanged: public pages still only show `status = 'published'`.

- Database:
  - No data migration appears necessary because the articles already exist and permissions are already registered.
  - If implementation reveals a missing policy edge case, I’ll add a small permission/RLS migration rather than making KB tables broadly writable.