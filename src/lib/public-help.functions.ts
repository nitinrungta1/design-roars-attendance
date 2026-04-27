import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ============================================================
// Public KB browsing — anonymous access, only published rows
// ============================================================
export interface PublicKbArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  view_count: number;
  helpful_count: number;
  updated_at: string;
}

export interface PublicKbArticleDetail extends PublicKbArticleSummary {
  body: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
}

export interface PublicKbCategory {
  name: string;
  count: number;
}

export const listPublicKbArticles = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        category: z.string().max(80).optional(),
        search: z.string().max(120).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(
    async ({
      data,
    }): Promise<{ articles: PublicKbArticleSummary[]; categories: PublicKbCategory[] }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let q = supabaseAdmin
        .from("kb_articles")
        .select("id, slug, title, excerpt, category, view_count, helpful_count, updated_at")
        .eq("status", "published")
        .order("position", { ascending: true })
        .order("updated_at", { ascending: false })
        .limit(500);
      if (data.category) q = q.eq("category", data.category);
      if (data.search && data.search.trim()) {
        const term = `%${data.search.trim()}%`;
        q = q.or(`title.ilike.${term},excerpt.ilike.${term}`);
      }
      const { data: rows } = await q;
      const articles = (rows ?? []) as PublicKbArticleSummary[];
      const counts = new Map<string, number>();
      for (const a of articles) {
        const c = a.category ?? "Other";
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
      const categories: PublicKbCategory[] = Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      return { articles, categories };
    },
  );

export const getPublicKbArticle = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }): Promise<{ article: PublicKbArticleDetail | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("kb_articles")
      .select(
        "id, slug, title, excerpt, body, category, view_count, helpful_count, updated_at, seo_title, seo_description, published_at",
      )
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (row) {
      void supabaseAdmin.rpc("kb_record_view", { _slug: data.slug });
    }
    return { article: (row ?? null) as PublicKbArticleDetail | null };
  });

export const voteKbArticle = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ slug: z.string().min(1).max(120), helpful: z.boolean() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("kb_record_vote", { _slug: data.slug, _helpful: data.helpful });
    return { ok: true };
  });

// ============================================================
// Search — typo-light ilike with ranking via RPC
// ============================================================
export interface KbSearchHit {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  view_count: number;
  rank: number;
}

export const searchKbArticles = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ q: z.string().min(1).max(120), limit: z.number().int().min(1).max(20).optional() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ hits: KbSearchHit[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.rpc("kb_search_articles", {
      _q: data.q.trim(),
      _limit: data.limit ?? 8,
    });
    return { hits: (rows ?? []) as KbSearchHit[] };
  });

export const logKbSearch = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        query: z.string().min(1).max(200),
        results_count: z.number().int().min(0).max(10_000),
        clicked_slug: z.string().max(160).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("kb_search_logs").insert({
      query: data.query.trim().toLowerCase().slice(0, 200),
      results_count: data.results_count,
      clicked_slug: data.clicked_slug ?? null,
    });
    return { ok: true };
  });

// ============================================================
// Feedback — extends kb_record_vote with optional comment
// ============================================================
export const submitKbFeedback = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        slug: z.string().min(1).max(160),
        helpful: z.boolean(),
        comment: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("kb_record_vote", { _slug: data.slug, _helpful: data.helpful });
    const { data: art } = await supabaseAdmin
      .from("kb_articles")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    await supabaseAdmin.from("kb_article_feedback").insert({
      article_id: art?.id ?? null,
      slug: data.slug,
      helpful: data.helpful,
      comment: data.comment?.trim() || null,
    });
    return { ok: true };
  });

// ============================================================
// Related articles
// ============================================================
export const listRelatedArticles = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(160) }).parse(input))
  .handler(async ({ data }): Promise<{ related: PublicKbArticleSummary[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cur } = await supabaseAdmin
      .from("kb_articles")
      .select("id, category")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!cur) return { related: [] };
    let q = supabaseAdmin
      .from("kb_articles")
      .select("id, slug, title, excerpt, category, view_count, helpful_count, updated_at")
      .eq("status", "published")
      .neq("slug", data.slug)
      .order("view_count", { ascending: false })
      .limit(4);
    if (cur.category) q = q.eq("category", cur.category);
    const { data: rows } = await q;
    return { related: (rows ?? []) as PublicKbArticleSummary[] };
  });

// ============================================================
// Public ticket submission
// ============================================================
const SubmitTicketSchema = z.object({
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(20_000),
  requester_email: z.string().email().max(320),
  requester_name: z.string().max(200).optional().default(""),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  suggested_articles: z.array(z.string().max(160)).max(10).optional(),
});

export const submitSupportTicket = createServerFn({ method: "POST" })
  .inputValidator((input) => SubmitTicketSchema.parse(input))
  .handler(
    async ({ data }): Promise<{ ok: true; id: string } | { ok: false; error: string }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row, error } = await supabaseAdmin
        .from("support_tickets")
        .insert({
          subject: data.subject,
          body: data.body,
          requester_email: data.requester_email,
          requester_name: data.requester_name || null,
          priority: data.priority,
          channel: "portal",
          status: "open",
          metadata: data.suggested_articles?.length
            ? { suggested_articles: data.suggested_articles }
            : {},
        })
        .select("id")
        .single();
      if (error || !row) return { ok: false, error: error?.message ?? "Could not create ticket" };
      return { ok: true, id: row.id };
    },
  );
