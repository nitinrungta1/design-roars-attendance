import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const POST_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const JOB_STATUSES = ["draft", "published", "archived", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_TYPES = ["full_time", "part_time", "contract", "internship"] as const;
export type JobType = (typeof JOB_TYPES)[number];

// ============================================================
// Audit helper (best-effort, never throws)
// ============================================================
async function audit(
  supabase: any,
  action: string,
  entity_type: string,
  entity_id: string | null,
  diff?: Record<string, unknown>,
) {
  try {
    await supabase.rpc("log_audit", {
      _action: action,
      _entity_type: entity_type,
      _entity_id: entity_id,
      _diff: diff ?? null,
    });
  } catch {
    /* swallow */
  }
}

// ============================================================
// Blog posts
// ============================================================
export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  category: string | null;
  tags: string[];
  status: PostStatus;
  published_at: string | null;
  updated_at: string;
}

export interface BlogPostDetail extends BlogPostRow {
  body: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export const listBlogPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ posts: BlogPostRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_url, category, tags, status, published_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) return { posts: [] };
    return { posts: (data ?? []) as BlogPostRow[] };
  });

export const getBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ post: BlogPostDetail | null }> => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, body, cover_url, category, tags, status, published_at, updated_at, seo_title, seo_description")
      .eq("id", data.id)
      .maybeSingle();
    if (error) return { post: null };
    return { post: (row ?? null) as BlogPostDetail | null };
  });

const UpsertBlogSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, dashes only"),
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  body: z.string().max(200_000).optional().nullable(),
  cover_url: z.string().url().max(2048).optional().nullable().or(z.literal("")),
  category: z.string().max(80).optional().nullable(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  status: z.enum(POST_STATUSES).default("draft"),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(320).optional().nullable(),
});

export const upsertBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertBlogSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const payload: Record<string, unknown> = {
      ...data,
      cover_url: data.cover_url || null,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    };
    const { data: row, error } = await supabase
      .from("blog_posts")
      .upsert(payload, { onConflict: "slug" })
      .select("id")
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    await audit(supabase, data.id ? "blog_post.update" : "blog_post.create", "blog_post", row?.id ?? null, { slug: data.slug, status: data.status });
    return { ok: true as const, id: row?.id ?? null };
  });

export const deleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("blog_posts").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await audit(supabase, "blog_post.delete", "blog_post", data.id);
    return { ok: true as const };
  });

const BulkBlogSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  action: z.enum(["publish", "archive", "draft", "delete"]),
});

export const bulkBlogPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => BulkBlogSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    if (data.action === "delete") {
      const { error } = await supabase.from("blog_posts").delete().in("id", data.ids);
      if (error) return { ok: false as const, error: error.message };
    } else {
      const status = data.action;
      const patch: Record<string, unknown> = { status };
      if (status === "published") patch.published_at = new Date().toISOString();
      const { error } = await supabase.from("blog_posts").update(patch).in("id", data.ids);
      if (error) return { ok: false as const, error: error.message };
    }
    await audit(supabase, `blog_post.bulk_${data.action}`, "blog_post", null, { ids: data.ids });
    return { ok: true as const, count: data.ids.length };
  });

// ============================================================
// CMS Pages
// ============================================================
export interface CmsPageRow {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
  noindex: boolean;
  published_at: string | null;
  updated_at: string;
}

export interface CmsPageDetail extends CmsPageRow {
  body: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export const listCmsPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ pages: CmsPageRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("cms_pages")
      .select("id, slug, title, status, noindex, published_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) return { pages: [] };
    return { pages: (data ?? []) as CmsPageRow[] };
  });

export const getCmsPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ page: CmsPageDetail | null }> => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("cms_pages")
      .select("id, slug, title, body, status, noindex, published_at, updated_at, seo_title, seo_description")
      .eq("id", data.id)
      .maybeSingle();
    if (error) return { page: null };
    return { page: (row ?? null) as CmsPageDetail | null };
  });

const UpsertPageSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(160).regex(/^[a-z0-9-/]+$/, "lowercase letters, numbers, dashes, slashes only"),
  title: z.string().min(1).max(200),
  body: z.string().max(200_000).optional().nullable(),
  status: z.enum(POST_STATUSES).default("draft"),
  noindex: z.boolean().default(false),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(320).optional().nullable(),
});

export const upsertCmsPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertPageSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const payload = {
      ...data,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    };
    const { data: row, error } = await supabase
      .from("cms_pages")
      .upsert(payload, { onConflict: "slug" })
      .select("id")
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    await audit(supabase, data.id ? "cms_page.update" : "cms_page.create", "cms_page", row?.id ?? null, { slug: data.slug, status: data.status });
    return { ok: true as const, id: row?.id ?? null };
  });

export const deleteCmsPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("cms_pages").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await audit(supabase, "cms_page.delete", "cms_page", data.id);
    return { ok: true as const };
  });

export const bulkCmsPages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => BulkBlogSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    if (data.action === "delete") {
      const { error } = await supabase.from("cms_pages").delete().in("id", data.ids);
      if (error) return { ok: false as const, error: error.message };
    } else {
      const patch: Record<string, unknown> = { status: data.action };
      if (data.action === "published") patch.published_at = new Date().toISOString();
      const { error } = await supabase.from("cms_pages").update(patch).in("id", data.ids);
      if (error) return { ok: false as const, error: error.message };
    }
    await audit(supabase, `cms_page.bulk_${data.action}`, "cms_page", null, { ids: data.ids });
    return { ok: true as const, count: data.ids.length };
  });

// ============================================================
// Media library
// ============================================================
export interface MediaRow {
  id: string;
  file_name: string;
  url: string;
  mime_type: string | null;
  size_bytes: number;
  alt_text: string | null;
  created_at: string;
}

export const listMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ media: MediaRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("cms_media")
      .select("id, file_name, url, mime_type, size_bytes, alt_text, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return { media: [] };
    return { media: (data ?? []) as MediaRow[] };
  });

const AddMediaSchema = z.object({
  file_name: z.string().min(1).max(200),
  url: z.string().url().max(2048),
  mime_type: z.string().max(120).optional().nullable(),
  size_bytes: z.number().int().min(0).default(0),
  alt_text: z.string().max(300).optional().nullable(),
});

export const addMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AddMediaSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase.from("cms_media").insert(data).select("id").maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    await audit(supabase, "media.create", "cms_media", row?.id ?? null, { file_name: data.file_name });
    return { ok: true as const, id: row?.id ?? null };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("cms_media").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await audit(supabase, "media.delete", "cms_media", data.id);
    return { ok: true as const };
  });

// ============================================================
// Marketing forms
// ============================================================
export interface FormRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  submission_count: number;
  target_email: string | null;
  updated_at: string;
}

export const listForms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ forms: FormRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("marketing_forms")
      .select("id, slug, name, description, is_active, submission_count, target_email, updated_at")
      .order("updated_at", { ascending: false });
    if (error) return { forms: [] };
    return { forms: (data ?? []) as FormRow[] };
  });

const UpsertFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, dashes only"),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  target_email: z.string().email().max(320).optional().nullable().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export const upsertForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertFormSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const payload: Record<string, unknown> = { ...data, target_email: data.target_email || null };
    if (!data.id) payload.fields = [];
    const { data: row, error } = await supabase
      .from("marketing_forms")
      .upsert(payload, { onConflict: "slug" })
      .select("id")
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    await audit(supabase, data.id ? "form.update" : "form.create", "marketing_form", row?.id ?? null, { slug: data.slug });
    return { ok: true as const, id: row?.id ?? null };
  });

export const deleteForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("marketing_forms").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await audit(supabase, "form.delete", "marketing_form", data.id);
    return { ok: true as const };
  });

// ============================================================
// Careers / Job postings
// ============================================================
export interface JobRow {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: JobType;
  status: JobStatus;
  order_index: number;
  published_at: string | null;
  updated_at: string;
}

export interface JobDetail extends JobRow {
  summary: string | null;
  description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  apply_url: string | null;
}

export const listJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ jobs: JobRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("job_postings")
      .select("id, slug, title, department, location, employment_type, status, order_index, published_at, updated_at")
      .order("order_index", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) return { jobs: [] };
    return { jobs: (data ?? []) as JobRow[] };
  });

export const getJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ job: JobDetail | null }> => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("job_postings")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) return { job: null };
    return { job: (row ?? null) as JobDetail | null };
  });

const UpsertJobSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, dashes only"),
  title: z.string().min(1).max(200),
  department: z.string().max(120).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  employment_type: z.enum(JOB_TYPES).default("full_time"),
  summary: z.string().max(500).optional().nullable(),
  description: z.string().max(50_000).optional().nullable(),
  salary_min: z.number().min(0).optional().nullable(),
  salary_max: z.number().min(0).optional().nullable(),
  salary_currency: z.string().max(8).optional().nullable(),
  apply_url: z.string().url().max(2048).optional().nullable().or(z.literal("")),
  status: z.enum(JOB_STATUSES).default("draft"),
  order_index: z.number().int().min(0).default(0),
});

export const upsertJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertJobSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const payload: Record<string, unknown> = {
      ...data,
      apply_url: data.apply_url || null,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    };
    const { data: row, error } = await supabase
      .from("job_postings")
      .upsert(payload, { onConflict: "slug" })
      .select("id")
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    await audit(supabase, data.id ? "job.update" : "job.create", "job_posting", row?.id ?? null, { slug: data.slug, status: data.status });
    return { ok: true as const, id: row?.id ?? null };
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("job_postings").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    await audit(supabase, "job.delete", "job_posting", data.id);
    return { ok: true as const };
  });

const BulkJobSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  action: z.enum(["publish", "archive", "close", "draft", "delete"]),
});

export const bulkJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => BulkJobSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    if (data.action === "delete") {
      const { error } = await supabase.from("job_postings").delete().in("id", data.ids);
      if (error) return { ok: false as const, error: error.message };
    } else {
      const map: Record<string, JobStatus> = {
        publish: "published",
        archive: "archived",
        close: "closed",
        draft: "draft",
      };
      const status = map[data.action];
      const patch: Record<string, unknown> = { status };
      if (status === "published") patch.published_at = new Date().toISOString();
      const { error } = await supabase.from("job_postings").update(patch).in("id", data.ids);
      if (error) return { ok: false as const, error: error.message };
    }
    await audit(supabase, `job.bulk_${data.action}`, "job_posting", null, { ids: data.ids });
    return { ok: true as const, count: data.ids.length };
  });

// ============================================================
// SEO settings
// ============================================================
export interface SeoSettingsRow {
  id: string;
  scope: string;
  title_template: string;
  default_description: string | null;
  default_og_image: string | null;
  robots_txt: string | null;
  sitemap_enabled: boolean;
  updated_at: string;
}

export const getSeoSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ settings: SeoSettingsRow | null }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("seo_settings")
      .select("id, scope, title_template, default_description, default_og_image, robots_txt, sitemap_enabled, updated_at")
      .eq("scope", "global")
      .maybeSingle();
    if (error) return { settings: null };
    return { settings: (data ?? null) as SeoSettingsRow | null };
  });

const PatchSeoSchema = z.object({
  title_template: z.string().min(1).max(200).optional(),
  default_description: z.string().max(500).optional().nullable(),
  default_og_image: z.string().url().max(2048).optional().nullable().or(z.literal("")),
  robots_txt: z.string().max(8000).optional().nullable(),
  sitemap_enabled: z.boolean().optional(),
});

export const patchSeoSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PatchSeoSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const payload: Record<string, unknown> = { ...data };
    if (payload.default_og_image === "") payload.default_og_image = null;
    const { error } = await supabase
      .from("seo_settings")
      .update(payload)
      .eq("scope", "global");
    if (error) return { ok: false as const, error: error.message };
    await audit(supabase, "seo.update", "seo_settings", null, payload);
    return { ok: true as const };
  });

// ============================================================
// Public consumers (no auth — RLS-gated to published)
// ============================================================
export const listPublicBlogPosts = createServerFn({ method: "POST" })
  .handler(async (): Promise<{ posts: BlogPostRow[] }> => {
    const { createSupabaseServerClient } = await import("@/integrations/supabase/server");
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_url, category, tags, status, published_at, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(100);
    return { posts: (data ?? []) as BlogPostRow[] };
  });

export const getPublicBlogPost = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(160) }).parse(input))
  .handler(async ({ data }): Promise<{ post: BlogPostDetail | null }> => {
    const { createSupabaseServerClient } = await import("@/integrations/supabase/server");
    const supabase = createSupabaseServerClient();
    const { data: row } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, body, cover_url, category, tags, status, published_at, updated_at, seo_title, seo_description")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    return { post: (row ?? null) as BlogPostDetail | null };
  });

export const listPublicJobs = createServerFn({ method: "POST" })
  .handler(async (): Promise<{ jobs: JobRow[] }> => {
    const { createSupabaseServerClient } = await import("@/integrations/supabase/server");
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("job_postings")
      .select("id, slug, title, department, location, employment_type, status, order_index, published_at, updated_at")
      .eq("status", "published")
      .order("order_index", { ascending: true })
      .order("published_at", { ascending: false })
      .limit(100);
    return { jobs: (data ?? []) as JobRow[] };
  });

export const getPublicJob = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(160) }).parse(input))
  .handler(async ({ data }): Promise<{ job: JobDetail | null }> => {
    const { createSupabaseServerClient } = await import("@/integrations/supabase/server");
    const supabase = createSupabaseServerClient();
    const { data: row } = await supabase
      .from("job_postings")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    return { job: (row ?? null) as JobDetail | null };
  });
