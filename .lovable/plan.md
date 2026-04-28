Plan to fix the Users panel and add user creation

1. Make the Users panel show actual users reliably
- Update the users fetch function so it returns a clear success/error shape instead of silently returning an empty list when the current account is not allowed or when the backend query fails.
- Keep the secure server-side admin lookup for registered identities, but add defensive error handling for auth users, profiles, roles, memberships, and companies.
- Sort users by joined date/name so the main account is easy to find.
- Add a visible error/permission message in the Users page instead of only showing “No users found”.

2. Add a Create user option in the Users page
- Add a “Create user” button in the Users page header/toolbar.
- Open a dialog with fields:
  - Full name
  - Work email
  - Initial password or “send invite/reset email” flow, depending on supported backend behavior
  - Role dropdown
  - Company dropdown, defaulting to Oqlio/current default company when available
- After creation, refresh the table and show a success toast.

3. Create the backend user safely
- Add a server function such as `createPlatformUser` that only `super_admin`, `admin`, or `hr` can call.
- Use the backend admin client on the server only to create the auth identity.
- Create/backfill the matching `profiles` row.
- Assign the selected role in `user_roles`.
- Add the user to `company_members` when a company is selected.
- Write an audit log for user creation and role assignment.

4. Keep role and permission management inside each user
- Keep the existing “Roles & permissions” button and side sheet.
- Ensure role dropdown changes made in the sheet refresh the row being displayed, so the selected user’s badges don’t stay stale after a role is granted/revoked.

Technical details
- Do not put roles on the profile/user record; continue using `user_roles`.
- Do not expose service credentials to the browser; all user creation and full user listing stays inside server functions.
- Do not edit generated Lovable Cloud integration files.
- A database migration should also repair the company link for the existing main user if missing, because the current data shows one profile without `company_id` even though roles exist.