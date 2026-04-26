import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const POST_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

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

const UpsertBlogSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(160),
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  body: z.string().max(200_000).optional().nullable(),
  cover_url: z.string().url().max(2048).optional().nullable(),
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
    const payload = {
      ...data,
      published_at: data.status === "published" ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from("blog_posts").upsert(payload, { onConflict: "slug" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
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

const UpsertPageSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(160),
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
    const { error } = await supabase.from("cms_pages").upsert(payload, { onConflict: "slug" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
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
    const { error } = await supabase.from("cms_media").insert(data);
    if (error) return { ok: false as const, error: error.message };
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
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  target_email: z.string().email().max(320).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const upsertForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertFormSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("marketing_forms")
      .upsert({ ...data, fields: [] }, { onConflict: "slug" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
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
  default_og_image: z.string().url().max(2048).optional().nullable(),
  robots_txt: z.string().max(8000).optional().nullable(),
  sitemap_enabled: z.boolean().optional(),
});

export const patchSeoSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PatchSeoSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("seo_settings")
      .update(data)
      .eq("scope", "global");
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
