// Server functions for the Hiring / ATS module.
// Public functions (no auth) live alongside admin functions guarded by requireSupabaseAuth.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  APPLICATION_STATUSES,
  WORK_TYPES,
  EXPERIENCE_LEVELS,
  INTERVIEW_MODES,
  type ApplicationStatus,
  type WorkType,
  type ExperienceLevel,
  type ScreeningQuestion,
} from "./hiring";

// -------- types ---------------------------------------------------------
export interface JobRow {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  department_id: string | null;
  location: string | null;
  employment_type: "full_time" | "part_time" | "contract" | "internship";
  work_type: WorkType;
  experience_level: ExperienceLevel;
  skills: string[];
  short_description: string | null;
  summary: string | null;
  description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  apply_url: string | null;
  status: "draft" | "published" | "archived" | "closed";
  order_index: number;
  published_at: string | null;
  view_count: number;
  screening_questions: ScreeningQuestion[];
  updated_at: string;
  created_at: string;
}

export interface CandidateRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  in_talent_pool: boolean;
  source: string | null;
  rating: number | null;
  notes: string | null;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationRow {
  id: string;
  candidate_id: string;
  job_id: string;
  status: ApplicationStatus;
  applied_at: string;
  cover_letter: string | null;
  why_us: string | null;
  current_salary: string | null;
  expected_salary: string | null;
  notice_period: string | null;
  experience_years: number | null;
  source: string | null;
  allow_reapply: boolean;
  rating: number | null;
  rejection_reason: string | null;
  screening_answers: Record<string, never>;
  candidate?: CandidateRow;
  job?: Pick<JobRow, "id" | "slug" | "title" | "department" | "location">;
  updated_at: string;
}

// -------- anon client (for unauth public endpoints) --------------------
function anonClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// =======================================================================
// PUBLIC — anyone can call these
// =======================================================================

export const listPublicJobs = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ jobs: JobRow[] }> => {
    const supabase = anonClient();
    const { data } = await supabase
      .from("job_postings")
      .select(
        "id, slug, title, department, department_id, location, employment_type, work_type, experience_level, skills, short_description, summary, description, salary_min, salary_max, salary_currency, apply_url, status, order_index, published_at, view_count, screening_questions, updated_at, created_at",
      )
      .eq("status", "published")
      .order("order_index", { ascending: true })
      .order("published_at", { ascending: false, nullsFirst: false });
    return { jobs: (data ?? []) as unknown as JobRow[] };
  },
);

export const getPublicJob = createServerFn({ method: "POST" })
  .inputValidator((v) => z.object({ slug: z.string().min(1).max(120) }).parse(v))
  .handler(async ({ data }): Promise<{ job: JobRow | null }> => {
    const supabase = anonClient();
    const { data: row } = await supabase
      .from("job_postings")
      .select(
        "id, slug, title, department, department_id, location, employment_type, work_type, experience_level, skills, short_description, summary, description, salary_min, salary_max, salary_currency, apply_url, status, order_index, published_at, view_count, screening_questions, updated_at, created_at",
      )
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    return { job: (row as unknown as JobRow | null) ?? null };
  });

const ApplySchema = z.object({
  job_id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().min(6).max(40),
  city: z.string().trim().min(2).max(120),
  experience_years: z.number().min(0).max(60).nullable().optional(),
  current_salary: z.string().trim().max(60).optional().nullable(),
  expected_salary: z.string().trim().max(60).optional().nullable(),
  notice_period: z.string().trim().max(60).optional().nullable(),
  linkedin_url: z.string().trim().url().max(500).optional().nullable().or(z.literal("")),
  portfolio_url: z.string().trim().url().max(500).optional().nullable().or(z.literal("")),
  cover_letter: z.string().trim().max(5000).optional().nullable(),
  why_us: z.string().trim().min(20, "Tell us a bit more (min 20 chars)").max(750),
  resume_url: z.string().trim().url().max(800).optional().nullable(),
  source: z.string().trim().max(80).optional().nullable(),
  screening_answers: z.record(z.unknown()).optional(),
  honeypot: z.string().max(0).optional(),
});

export const submitPublicApplication = createServerFn({ method: "POST" })
  .inputValidator((v) => ApplySchema.parse(v))
  .handler(
    async ({ data }): Promise<{ ok: true; application_id: string } | { ok: false; error: string }> => {
      const supabase = anonClient();

      // Verify job is published
      const { data: job } = await supabase
        .from("job_postings")
        .select("id, status")
        .eq("id", data.job_id)
        .maybeSingle();
      if (!job || job.status !== "published") {
        return { ok: false, error: "This role is no longer accepting applications." };
      }

      // Upsert candidate by email
      const { data: existing } = await supabase
        .from("candidates")
        .select("id")
        .eq("email", data.email)
        .maybeSingle();

      let candidateId: string;
      if (existing?.id) {
        candidateId = existing.id;
        await supabase
          .from("candidates")
          .update({
            full_name: data.full_name,
            phone: data.phone,
            city: data.city,
            resume_url: data.resume_url || undefined,
            linkedin_url: data.linkedin_url || undefined,
            portfolio_url: data.portfolio_url || undefined,
          })
          .eq("id", candidateId);
      } else {
        const { data: created, error: cErr } = await supabase
          .from("candidates")
          .insert({
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            city: data.city,
            resume_url: data.resume_url || null,
            linkedin_url: data.linkedin_url || null,
            portfolio_url: data.portfolio_url || null,
            source: data.source || null,
          })
          .select("id")
          .single();
        if (cErr || !created) return { ok: false, error: "Could not create candidate profile." };
        candidateId = created.id;
      }

      // Already applied?
      const { data: dup } = await supabase
        .from("applications")
        .select("id, allow_reapply, status")
        .eq("candidate_id", candidateId)
        .eq("job_id", data.job_id)
        .maybeSingle();
      if (dup && !dup.allow_reapply && dup.status !== "withdrawn") {
        return { ok: false, error: "You've already applied to this role." };
      }

      const insertPayload = {
        candidate_id: candidateId,
        job_id: data.job_id,
        cover_letter: data.cover_letter || null,
        why_us: data.why_us,
        current_salary: data.current_salary || null,
        expected_salary: data.expected_salary || null,
        notice_period: data.notice_period || null,
        experience_years: data.experience_years ?? null,
        source: data.source || "careers_page",
        screening_answers: (data.screening_answers ?? {}) as Record<string, never>,
      };

      let appId: string;
      if (dup) {
        const { data: updated, error: uErr } = await supabase
          .from("applications")
          .update({ ...insertPayload, status: "new" as const, allow_reapply: false, applied_at: new Date().toISOString() })
          .eq("id", dup.id)
          .select("id")
          .single();
        if (uErr || !updated) return { ok: false, error: "Could not update application." };
        appId = updated.id;
      } else {
        const { data: created, error: aErr } = await supabase
          .from("applications")
          .insert(insertPayload as never)
          .select("id")
          .single();
        if (aErr || !created) return { ok: false, error: "Could not submit application." };
        appId = created.id;
      }

      return { ok: true, application_id: appId };
    },
  );

// =======================================================================
// CANDIDATE PORTAL (authenticated as candidate user)
// =======================================================================

export const myApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data } = await supabase
      .from("applications")
      .select(
        "id, candidate_id, job_id, status, applied_at, cover_letter, why_us, current_salary, expected_salary, notice_period, experience_years, source, allow_reapply, rating, rejection_reason, screening_answers, updated_at, job:job_postings(id, slug, title, department, location)",
      )
      .order("applied_at", { ascending: false });
    return { applications: (data ?? []) as unknown as ApplicationRow[] };
  });

export const withdrawApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { error } = await context.supabase
      .from("applications")
      .update({ status: "withdrawn" })
      .eq("id", data.id);
    return { ok: !error };
  });

// Public assignment submission (token-gated)
const SubmitAssignmentSchema = z.object({
  token: z.string().min(10).max(80),
  submission_url: z.string().trim().url().max(800).optional().nullable(),
  submission_text: z.string().trim().max(10000).optional().nullable(),
});
export const submitAssignmentByToken = createServerFn({ method: "POST" })
  .inputValidator((v) => SubmitAssignmentSchema.parse(v))
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (!data.submission_url && !data.submission_text) {
      return { ok: false, error: "Provide a link or paste your work." };
    }
    const supabase = anonClient();
    const { data: aa } = await supabase
      .from("application_assignments")
      .select("id, application_id, submitted_at")
      .eq("token", data.token)
      .maybeSingle();
    if (!aa) return { ok: false, error: "Invalid or expired link." };
    const { error } = await supabase
      .from("application_assignments")
      .update({
        submission_url: data.submission_url || null,
        submission_text: data.submission_text || null,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", aa.id);
    if (error) return { ok: false, error: "Could not save submission." };
    await supabase
      .from("applications")
      .update({ status: "assignment_submitted" })
      .eq("id", aa.application_id);
    return { ok: true };
  });

export const getAssignmentByToken = createServerFn({ method: "POST" })
  .inputValidator((v) => z.object({ token: z.string().min(10).max(80) }).parse(v))
  .handler(async ({ data }) => {
    const supabase = anonClient();
    const { data: aa } = await supabase
      .from("application_assignments")
      .select(
        "id, sent_at, due_at, submitted_at, submission_url, submission_text, assignment:assignments(title, description, attachment_url), application:applications(id, candidate:candidates(full_name, email), job:job_postings(title, slug))",
      )
      .eq("token", data.token)
      .maybeSingle();
    return { assignment: aa };
  });

// =======================================================================
// ADMIN
// =======================================================================

export const listJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ jobs: JobRow[] }> => {
    const { data } = await context.supabase
      .from("job_postings")
      .select(
        "id, slug, title, department, department_id, location, employment_type, work_type, experience_level, skills, short_description, summary, description, salary_min, salary_max, salary_currency, apply_url, status, order_index, published_at, view_count, screening_questions, updated_at, created_at",
      )
      .order("updated_at", { ascending: false })
      .limit(500);
    return { jobs: (data ?? []) as unknown as JobRow[] };
  });

export const getJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }): Promise<{ job: JobRow | null }> => {
    const { data: row } = await context.supabase
      .from("job_postings")
      .select(
        "id, slug, title, department, department_id, location, employment_type, work_type, experience_level, skills, short_description, summary, description, salary_min, salary_max, salary_currency, apply_url, status, order_index, published_at, view_count, screening_questions, updated_at, created_at",
      )
      .eq("id", data.id)
      .maybeSingle();
    return { job: (row as unknown as JobRow | null) ?? null };
  });

const JobInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(160),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  department: z.string().max(80).nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  employment_type: z.enum(["full_time", "part_time", "contract", "internship"]),
  work_type: z.enum(WORK_TYPES),
  experience_level: z.enum(EXPERIENCE_LEVELS),
  skills: z.array(z.string().min(1).max(40)).max(30).default([]),
  short_description: z.string().max(280).nullable().optional(),
  summary: z.string().max(500).nullable().optional(),
  description: z.string().max(20000).nullable().optional(),
  salary_min: z.number().int().min(0).max(99999999).nullable().optional(),
  salary_max: z.number().int().min(0).max(99999999).nullable().optional(),
  salary_currency: z.string().max(8).nullable().optional(),
  apply_url: z.string().max(500).nullable().optional(),
  status: z.enum(["draft", "published", "archived", "closed"]),
  order_index: z.number().int().min(0).max(1000).default(0),
  screening_questions: z.array(z.any()).default([]),
});

export const upsertJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => JobInputSchema.parse(v))
  .handler(async ({ data, context }): Promise<{ ok: boolean; id?: string; error?: string }> => {
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      published_at:
        rest.status === "published" ? new Date().toISOString() : null,
    };
    if (id) {
      const { error } = await context.supabase.from("job_postings").update(payload).eq("id", id);
      return error ? { ok: false, error: error.message } : { ok: true, id };
    }
    const { data: created, error } = await context.supabase
      .from("job_postings")
      .insert(payload)
      .select("id")
      .single();
    return error ? { ok: false, error: error.message } : { ok: true, id: created!.id };
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("job_postings").delete().eq("id", data.id);
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });

// Applications --------------------------------------------------------
export const listApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        status: z.enum(APPLICATION_STATUSES).optional(),
        job_id: z.string().uuid().optional(),
        search: z.string().max(120).optional(),
      })
      .parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("applications")
      .select(
        "id, candidate_id, job_id, status, applied_at, cover_letter, why_us, current_salary, expected_salary, notice_period, experience_years, source, allow_reapply, rating, rejection_reason, screening_answers, updated_at, candidate:candidates(id, full_name, email, phone, city, resume_url, linkedin_url, portfolio_url, in_talent_pool, source, rating, notes, auth_user_id, created_at, updated_at), job:job_postings(id, slug, title, department, location)",
      )
      .order("applied_at", { ascending: false })
      .limit(500);
    if (data.status) query = query.eq("status", data.status);
    if (data.job_id) query = query.eq("job_id", data.job_id);
    const { data: rows } = await query;
    let list = (rows ?? []) as unknown as ApplicationRow[];
    if (data.search) {
      const q = data.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.candidate?.full_name.toLowerCase().includes(q) ||
          a.candidate?.email.toLowerCase().includes(q) ||
          a.job?.title.toLowerCase().includes(q),
      );
    }
    return { applications: list };
  });

export const getApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: app } = await context.supabase
      .from("applications")
      .select(
        "id, candidate_id, job_id, status, applied_at, cover_letter, why_us, current_salary, expected_salary, notice_period, experience_years, source, allow_reapply, rating, rejection_reason, screening_answers, updated_at, candidate:candidates(*), job:job_postings(id, slug, title, department, location, employment_type, work_type)",
      )
      .eq("id", data.id)
      .maybeSingle();
    const { data: events } = await context.supabase
      .from("application_events")
      .select("id, event_type, from_status, to_status, payload, created_at")
      .eq("application_id", data.id)
      .order("created_at", { ascending: false });
    const { data: notes } = await context.supabase
      .from("application_notes")
      .select("id, body, author_id, created_at")
      .eq("application_id", data.id)
      .order("created_at", { ascending: false });
    const { data: assignments } = await context.supabase
      .from("application_assignments")
      .select(
        "id, sent_at, due_at, submission_url, submission_text, submitted_at, score, feedback, token, assignment:assignments(id, title)",
      )
      .eq("application_id", data.id)
      .order("sent_at", { ascending: false });
    const { data: interviews } = await context.supabase
      .from("interviews")
      .select("id, scheduled_at, duration_min, mode, link, panel, outcome, notes, round_label")
      .eq("application_id", data.id)
      .order("scheduled_at", { ascending: false });
    return { application: app, events: events ?? [], notes: notes ?? [], assignments: assignments ?? [], interviews: interviews ?? [] };
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(APPLICATION_STATUSES),
        rejection_reason: z.string().max(500).nullable().optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("applications")
      .update({ status: data.status, rejection_reason: data.rejection_reason ?? null })
      .eq("id", data.id);
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });

export const addApplicationNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ application_id: z.string().uuid(), body: z.string().min(1).max(4000) }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("application_notes")
      .insert({ application_id: data.application_id, body: data.body, author_id: context.userId });
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });

export const allowReapply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("applications")
      .update({ allow_reapply: true })
      .eq("id", data.id);
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });

// Candidates ---------------------------------------------------------
export const listCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z.object({ search: z.string().max(120).optional(), talent_pool: z.boolean().optional() }).parse(v ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.talent_pool) q = q.eq("in_talent_pool", true);
    const { data: rows } = await q;
    let list = (rows ?? []) as CandidateRow[];
    if (data.search) {
      const s = data.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.full_name.toLowerCase().includes(s) ||
          c.email.toLowerCase().includes(s) ||
          (c.city ?? "").toLowerCase().includes(s),
      );
    }
    return { candidates: list };
  });

export const toggleTalentPool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => z.object({ id: z.string().uuid(), in_pool: z.boolean() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("candidates")
      .update({ in_talent_pool: data.in_pool })
      .eq("id", data.id);
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });

// Assignments --------------------------------------------------------
export const listAssignments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("assignments")
      .select("id, title, description, attachment_url, due_in_days, is_active, created_at")
      .order("created_at", { ascending: false });
    return { assignments: data ?? [] };
  });

export const upsertAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().min(2).max(160),
        description: z.string().max(8000).nullable().optional(),
        attachment_url: z.string().max(800).nullable().optional(),
        due_in_days: z.number().int().min(1).max(60).default(5),
        is_active: z.boolean().default(true),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    if (id) {
      const { error } = await context.supabase.from("assignments").update(rest).eq("id", id);
      return error ? { ok: false as const, error: error.message } : { ok: true as const, id };
    }
    const { data: created, error } = await context.supabase
      .from("assignments")
      .insert({ ...rest, created_by: context.userId })
      .select("id")
      .single();
    return error ? { ok: false as const, error: error.message } : { ok: true as const, id: created!.id };
  });

export const sendAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        application_id: z.string().uuid(),
        assignment_id: z.string().uuid(),
        due_in_days: z.number().int().min(1).max(60).optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const days = data.due_in_days ?? 5;
    const due = new Date(Date.now() + days * 86400_000).toISOString();
    const { data: created, error } = await context.supabase
      .from("application_assignments")
      .insert({
        application_id: data.application_id,
        assignment_id: data.assignment_id,
        due_at: due,
      })
      .select("id, token")
      .single();
    if (error) return { ok: false as const, error: error.message };
    await context.supabase.from("applications").update({ status: "assignment_sent" }).eq("id", data.application_id);
    return { ok: true as const, id: created!.id, token: created!.token };
  });

// Interviews ---------------------------------------------------------
export const scheduleInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) =>
    z
      .object({
        application_id: z.string().uuid(),
        scheduled_at: z.string(),
        duration_min: z.number().int().min(10).max(240).default(45),
        mode: z.enum(INTERVIEW_MODES).default("video"),
        link: z.string().max(500).nullable().optional(),
        round_label: z.string().max(40).nullable().optional(),
        panel: z.array(z.string().max(120)).max(10).default([]),
        advance_status: z.enum(["interview_r1", "interview_r2"]).optional(),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("interviews").insert({
      application_id: data.application_id,
      scheduled_at: data.scheduled_at,
      duration_min: data.duration_min,
      mode: data.mode,
      link: data.link || null,
      round_label: data.round_label || null,
      panel: data.panel,
      created_by: context.userId,
    });
    if (error) return { ok: false as const, error: error.message };
    if (data.advance_status) {
      await context.supabase
        .from("applications")
        .update({ status: data.advance_status })
        .eq("id", data.application_id);
    }
    return { ok: true as const };
  });

export const listUpcomingInterviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("interviews")
      .select(
        "id, scheduled_at, duration_min, mode, link, panel, outcome, round_label, application:applications(id, status, candidate:candidates(full_name, email), job:job_postings(title, slug))",
      )
      .gte("scheduled_at", new Date(Date.now() - 86400_000).toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(200);
    return { interviews: data ?? [] };
  });

// Dashboard stats ----------------------------------------------------
export const hiringStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: jobs } = await context.supabase.from("job_postings").select("id, status");
    const { data: apps } = await context.supabase.from("applications").select("id, status, applied_at");
    const byStatus: Record<string, number> = {};
    for (const s of APPLICATION_STATUSES) byStatus[s] = 0;
    for (const a of apps ?? []) byStatus[a.status as string] = (byStatus[a.status as string] ?? 0) + 1;
    return {
      jobsPublished: (jobs ?? []).filter((j) => j.status === "published").length,
      jobsTotal: (jobs ?? []).length,
      applicationsTotal: (apps ?? []).length,
      byStatus,
      newThisWeek: (apps ?? []).filter(
        (a) => new Date(a.applied_at as string).getTime() > Date.now() - 7 * 86400_000,
      ).length,
    };
  });
