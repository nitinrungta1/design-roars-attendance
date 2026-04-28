# Plan — Port Careers / Recruitment (ATS) module from Design Roars Launchpad

## What you'll get

A complete Applicant Tracking System bolted onto Oqlio:

**Public side (job seekers)**
- Redesigned `/careers` — hero, perks grid, search + filters (department / work type / employment / experience), salary formatting, "already applied" state.
- `/careers/$slug` — rich job detail page.
- `/careers/$slug/apply` — multi-step application form: resume upload, cover letter, why-us, salary, notice period, LinkedIn/portfolio links, honeypot anti-spam, validation.
- `/candidate/login`, `/candidate`, `/candidate/applications/$id` — candidate portal where applicants sign in (magic link), see all their applications, track status, withdraw, submit assignments.
- `/assignment/$token` — public token-gated assignment submission page.

**Admin side (`/admin/hiring/*`)**
A new top-level "Hiring" section in the admin sidebar with:
- **Dashboard** — pipeline funnel, time-to-hire, source breakdown.
- **Jobs** — list / new / edit / `$id/applicants`. Replaces the current minimal `/admin/cms/careers` with a richer editor (skills, work type, experience level, department, screening questions builder).
- **Applications** — list + Kanban board across the 11-stage pipeline (new → screening → assignment → interviews → selected/hired/rejected/on-hold/withdrawn) with bulk actions and CSV export.
- **Application detail (`$id`)** — full timeline, status changes, notes, send assignment, schedule interview, allow re-apply.
- **Candidates** — searchable talent database, profile pages with all applications, filters, CSV/XLSX/PDF export.
- **Talent Pool** — flagged candidates for future roles.
- **Interviews** — calendar of upcoming interviews.
- **Assignments** — list, new, edit; tracks sent / submitted / reviewed.
- **Reports** — funnel conversion, source ROI, time-in-stage.
- **Settings** — pipeline stages, default email templates.

**Email notifications** (via Lovable Cloud + Resend pattern already in repo)
- Application received → candidate
- Status changes → candidate
- Assignment sent → candidate
- Interview scheduled → candidate
- New application → hiring team

## Brand & UX adaptation

- All copy rewritten for **Oqlio** (not Designroars). Header eyebrow stays "Oqlio" on careers (company page per memory).
- Visual style follows Oqlio's existing tokens (indigo→blue gradient, glassmorphism, `MarketingLayout`, `Container`, `Section`, `GradientText`) — not Designroars' style. The source's structure is ported; the surface uses our components.
- Admin pages use the existing `PageHeader` / `PageBody` / `DataTable` / `cms-shell` primitives, matching every other admin page.

## Backend / database

The current `job_postings` table is too thin (no skills, work_type, experience_level, screening questions, department FK). One migration will:

1. **Extend `job_postings`** — add `work_type`, `experience_level`, `skills text[]`, `short_description`, `screening_questions jsonb`, `department_id` (FK → existing `departments`), `published_at` index.
2. **Create new tables:**
   - `candidates` — auth_user_id, full_name, email, phone, city, resume_url, in_talent_pool, source, rating.
   - `applications` — candidate_id, job_id, status (enum), applied_at, cover_letter, why_us, expected_salary, notice_period, screening_answers jsonb, source, allow_reapply.
   - `application_events` — timeline (status_changed, note_added, assignment_sent, interview_scheduled, etc.).
   - `application_notes` — internal recruiter notes.
   - `assignments` — title, description, attachment_url, due_in_days.
   - `application_assignments` — application_id, assignment_id, sent_at, submission_url, submitted_at, score, feedback, token (for public submission link).
   - `interviews` — application_id, scheduled_at, mode, link, panel jsonb, outcome, notes.
3. **Storage buckets** — `resumes` (private), `assignments` (private), `submissions` (private). Signed URLs for downloads.
4. **RLS** — candidates can read/update only their own rows; `is_admin()` / `has_permission('hiring.manage')` for admins; a new `hiring_manager` role permission.
5. **Triggers** — auto-insert `application_events` row on `applications.status` change; `set_updated_at` on all new tables.
6. **Seed** — 3 sample published jobs and a few statuses so the pages aren't empty out of the gate.

## Server functions (`src/lib/hiring.functions.ts` + `candidates.functions.ts`)

All data access goes through `createServerFn` with `requireSupabaseAuth` middleware (admin) or anon-safe handlers (public apply, candidate portal). Includes: `listPublicJobs`, `getJobBySlug`, `submitApplication`, `withdrawApplication`, `listApplications`, `updateApplicationStatus`, `addApplicationNote`, `sendAssignment`, `submitAssignment`, `scheduleInterview`, `listCandidates`, `toggleTalentPool`, `hiringDashboardStats`, etc.

A public route `/api/public/applications` handles unauthenticated form submissions with rate limiting and honeypot check.

## What is NOT being ported (out of scope)

- `candidate-export.ts` heavy deps (`xlsx`, `jspdf`, `jspdf-autotable`) — we already have a lighter CSV export pattern in `src/lib/exports.ts`; reusing that. (Add `xlsx` only if you want XLSX too — say the word.)
- Google Calendar / Calendly integration for interviews (source's `webhooks.calendly.tsx`).
- AI assist for job descriptions (`api.ai.assist.tsx`).

Both can be added in a follow-up if you want them.

## Files to be added (high level)

- `supabase/migrations/<timestamp>_hiring_module.sql`
- `src/lib/hiring.ts` (constants, status labels, helpers)
- `src/lib/hiring.functions.ts`, `src/lib/candidates.functions.ts`
- `src/components/hiring/*` — apply-form, kanban-board, status-badge, pipeline-funnel, timeline, send-assignment-dialog, schedule-interview-dialog, question-builder, candidates-table.
- `src/routes/careers.tsx` (rewrite), `src/routes/careers.$slug.tsx` (enhance), `src/routes/careers.$slug.apply.tsx` (new).
- `src/routes/candidate.tsx`, `candidate.index.tsx`, `candidate.login.tsx`, `candidate.applications.$id.tsx`.
- `src/routes/assignment.$token.tsx`.
- `src/routes/_authenticated.admin.hiring.*` — 12 route files (dashboard, jobs list/new/$id/$id.applicants, applications list/$id, candidates list/$id, talent-pool, interviews, assignments list/new/$id.edit, reports, settings).
- `src/routes/api.public.applications.tsx`, `api.public.assignment-submit.tsx`, `api.public.my-applications.tsx`.
- Sidebar nav update in `src/components/admin/nav-config.ts`.

## Confirm before I start

1. **Scope** — port the full ATS as described, or trim to "jobs + apply form + simple admin applications list" (faster, ~1/3 the work)?
2. **Candidate auth** — magic-link email sign-in (matches source), or just allow apply-without-account and skip the candidate portal?
3. **Admin path** — keep the existing `/admin/cms/careers` page as-is (basic) and add the new module under `/admin/hiring/*`, or replace `/admin/cms/careers` entirely with a redirect to `/admin/hiring/jobs`?

Reply with answers (or just "go full scope, replace cms/careers, magic-link auth") and I'll implement.