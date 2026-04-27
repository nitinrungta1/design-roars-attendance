import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ARTICLE_STATUSES = ["draft", "published", "archived"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export interface AdminKbArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  category: string | null;
  category_id: string | null;
  status: ArticleStatus;
  view_count: number;
  helpful_count: number;
  unhelpful_count: number;
  position: number | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface KbCategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number | null;
}

// ============================================================
// Articles
// ============================================================
export const adminListKbArticles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ articles: AdminKbArticle[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("kb_articles")
      .select(
        "id, slug, title, excerpt, body, category, category_id, status, view_count, helpful_count, unhelpful_count, position, seo_title, seo_description, published_at, updated_at, created_at",
      )
      .order("position", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(1000);
    if (error) {
      console.error("adminListKbArticles", error);
      return { articles: [] };
    }
    return { articles: (data ?? []) as AdminKbArticle[] };
  });

export const adminGetKbArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ article: AdminKbArticle | null; tags: string[] }> => {
    const { supabase } = context;
    const { data: article } = await supabase
      .from("kb_articles")
      .select(
        "id, slug, title, excerpt, body, category, category_id, status, view_count, helpful_count, unhelpful_count, position, seo_title, seo_description, published_at, updated_at, created_at",
      )
      .eq("id", data.id)
      .maybeSingle();
    const { data: tagRows } = await supabase
      .from("kb_article_tags")
      .select("tag")
      .eq("article_id", data.id);
    return {
      article: (article ?? null) as AdminKbArticle | null,
      tags: (tagRows ?? []).map((r: { tag: string }) => r.tag),
    };
  });

const UpsertArticleSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and dashes"),
  title: z.string().min(1).max(300),
  excerpt: z.string().max(1000).optional().nullable(),
  body: z.string().max(200_000).optional().nullable(),
  category: z.string().max(120).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  status: z.enum(ARTICLE_STATUSES).default("draft"),
  position: z.number().int().min(0).max(10_000).optional().nullable(),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(400).optional().nullable(),
  published_at: z.string().datetime().optional().nullable(),
  tags: z.array(z.string().min(1).max(60)).max(30).optional(),
});

export const upsertKbArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertArticleSchema.parse(input))
  .handler(
    async ({ data, context }): Promise<{ ok: true; id: string } | { ok: false; error: string }> => {
      const { supabase } = context;
      const payload = {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt ?? null,
        body: data.body ?? null,
        category: data.category ?? null,
        category_id: data.category_id ?? null,
        status: data.status,
        position: data.position ?? undefined,
        seo_title: data.seo_title ?? null,
        seo_description: data.seo_description ?? null,
        published_at:
          data.status === "published" && !data.published_at
            ? new Date().toISOString()
            : data.published_at ?? null,
      };
      let id = data.id;
      if (id) {
        const { error } = await supabase.from("kb_articles").update(payload).eq("id", id);
        if (error) return { ok: false, error: error.message };
      } else {
        const { data: row, error } = await supabase
          .from("kb_articles")
          .insert(payload)
          .select("id")
          .single();
        if (error || !row) return { ok: false, error: error?.message ?? "Insert failed" };
        id = row.id;
      }
      // Sync tags (delete + insert)
      if (data.tags) {
        await supabase.from("kb_article_tags").delete().eq("article_id", id);
        if (data.tags.length > 0) {
          await supabase
            .from("kb_article_tags")
            .insert(data.tags.map((t) => ({ article_id: id!, tag: t.toLowerCase().trim() })));
        }
      }
      return { ok: true, id };
    },
  );

export const deleteKbArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await context.supabase.from("kb_articles").delete().eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

// ============================================================
// Categories
// ============================================================
export const listKbCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ categories: KbCategoryRow[] }> => {
    const { data } = await context.supabase
      .from("kb_categories")
      .select("id, slug, name, description, position")
      .order("position", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });
    return { categories: (data ?? []) as KbCategoryRow[] };
  });

const UpsertCategorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(120),
  description: z.string().max(400).optional().nullable(),
  position: z.number().int().min(0).max(1000).optional().nullable(),
});

export const upsertKbCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertCategorySchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    const payload = {
      slug: data.slug,
      name: data.name,
      description: data.description ?? null,
      position: data.position ?? null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("kb_categories").update(payload).eq("id", data.id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await context.supabase.from("kb_categories").insert(payload);
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  });

export const deleteKbCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await context.supabase.from("kb_categories").delete().eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

// ============================================================
// Feedback
// ============================================================
export interface KbFeedbackRow {
  id: string;
  article_id: string | null;
  slug: string;
  helpful: boolean;
  comment: string | null;
  created_at: string;
  article_title?: string | null;
}

export const listKbFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ feedback: KbFeedbackRow[] }> => {
    const { data } = await context.supabase
      .from("kb_article_feedback")
      .select("id, article_id, slug, helpful, comment, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    return { feedback: (data ?? []) as KbFeedbackRow[] };
  });

// ============================================================
// Analytics
// ============================================================
export interface KbAnalytics {
  topSearches: Array<{ query: string; count: number; avgResults: number }>;
  noResultSearches: Array<{ query: string; count: number }>;
  topArticles: Array<{ slug: string; title: string; view_count: number }>;
  worstArticles: Array<{ slug: string; title: string; helpful_count: number; unhelpful_count: number; ratio: number }>;
  totalArticles: number;
  totalSearches: number;
  totalTickets: number;
  deflectionRatio: number;
}

export const getKbAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<KbAnalytics> => {
    const { supabase } = context;

    const [searchRes, articlesRes, ticketsRes] = await Promise.all([
      supabase
        .from("kb_search_logs")
        .select("query, results_count, created_at")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 3600_000).toISOString())
        .limit(5000),
      supabase
        .from("kb_articles")
        .select("slug, title, view_count, helpful_count, unhelpful_count")
        .eq("status", "published")
        .limit(1000),
      supabase
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 30 * 24 * 3600_000).toISOString()),
    ]);

    const searches = searchRes.data ?? [];
    const totalSearches = searches.length;
    const queryAgg = new Map<string, { count: number; results: number[] }>();
    for (const s of searches as Array<{ query: string; results_count: number }>) {
      const key = s.query.toLowerCase().trim();
      if (!queryAgg.has(key)) queryAgg.set(key, { count: 0, results: [] });
      const slot = queryAgg.get(key)!;
      slot.count += 1;
      slot.results.push(s.results_count);
    }
    const topSearches = Array.from(queryAgg.entries())
      .map(([query, v]) => ({
        query,
        count: v.count,
        avgResults: v.results.reduce((a, b) => a + b, 0) / Math.max(v.results.length, 1),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    const noResultSearches = Array.from(queryAgg.entries())
      .filter(([, v]) => v.results.every((r) => r === 0))
      .map(([query, v]) => ({ query, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const articles = (articlesRes.data ?? []) as Array<{
      slug: string;
      title: string;
      view_count: number;
      helpful_count: number;
      unhelpful_count: number;
    }>;
    const topArticles = [...articles]
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 10)
      .map((a) => ({ slug: a.slug, title: a.title, view_count: a.view_count }));
    const worstArticles = articles
      .filter((a) => a.helpful_count + a.unhelpful_count >= 3)
      .map((a) => ({
        slug: a.slug,
        title: a.title,
        helpful_count: a.helpful_count,
        unhelpful_count: a.unhelpful_count,
        ratio: a.helpful_count / Math.max(a.helpful_count + a.unhelpful_count, 1),
      }))
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 10);

    const totalTickets = ticketsRes.count ?? 0;
    const totalViews = articles.reduce((sum, a) => sum + a.view_count, 0);
    const deflectionRatio = totalTickets === 0 ? 1 : totalViews / (totalViews + totalTickets);

    return {
      topSearches,
      noResultSearches,
      topArticles,
      worstArticles,
      totalArticles: articles.length,
      totalSearches,
      totalTickets,
      deflectionRatio,
    };
  });
