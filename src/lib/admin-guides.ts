import { supabase } from "@/lib/supabase";
import { estimateReadingTimeMinutes } from "@/lib/guide-options";
import type { Guide, GuideArticle, GuideSection } from "@/types/guide";

export interface AdminGuideInput {
  id?: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string | null;
  category: string | null;
  audience_market: string | null;
  level: string | null;
  material_symbol: string | null;
  featured: boolean;
  published: boolean;
}

export interface AdminArticleInput {
  id?: string;
  guide_id: string;
  section_id: string | null;
  title: string;
  slug: string;
  synopsis: string;
  content: string;
  reading_time_minutes: number | null;
  order_index: number;
  published: boolean;
}

interface GuideRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  order_index?: number | null;
  category: string | null;
  audience_market?: string | null;
  level?: string | null;
  material_symbol?: string | null;
  featured: boolean | null;
  published: boolean | null;
  updated_at: string | null;
}

interface SectionRow {
  id: string;
  guide_id: string;
  title: string;
  order_index: number | null;
}

interface ArticleRow {
  id: string;
  guide_id: string;
  section_id: string | null;
  title: string;
  slug: string;
  synopsis?: string | null;
  content: string | null;
  reading_time_minutes?: number | null;
  order_index: number | null;
  published: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const GUIDE_SELECT_V3 =
  "id, title, slug, description, cover_image, order_index, category, audience_market, level, material_symbol, featured, published, updated_at";
const GUIDE_SELECT_V2 =
  "id, title, slug, description, cover_image, category, audience_market, level, material_symbol, featured, published, updated_at";
const GUIDE_SELECT_V1 = "id, title, slug, description, cover_image, category, featured, published, updated_at";

const ARTICLE_SELECT_V2 =
  "id, guide_id, section_id, title, slug, synopsis, content, reading_time_minutes, order_index, published, created_at, updated_at";
const ARTICLE_SELECT_V1 = "id, guide_id, section_id, title, slug, content, order_index, published, updated_at";

const assertSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
};

const toGuide = (row: GuideRow): Guide => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  description: row.description ?? "",
  cover_image: row.cover_image,
  order_index: Number(row.order_index ?? 0),
  category: row.category,
  audience_market: row.audience_market ?? null,
  level: row.level ?? null,
  material_symbol: row.material_symbol ?? null,
  featured: Boolean(row.featured),
  published: Boolean(row.published),
  updated_at: row.updated_at,
});

const toSection = (row: SectionRow): GuideSection => ({
  id: row.id,
  guide_id: row.guide_id,
  title: row.title,
  order_index: Number(row.order_index ?? 0),
});

const toArticle = (row: ArticleRow): GuideArticle => ({
  id: row.id,
  guide_id: row.guide_id,
  section_id: row.section_id,
  title: row.title,
  slug: row.slug,
  synopsis: row.synopsis ?? "",
  content: row.content ?? "",
  reading_time_minutes:
    typeof row.reading_time_minutes === "number"
      ? row.reading_time_minutes
      : estimateReadingTimeMinutes(String(row.content ?? "")),
  order_index: Number(row.order_index ?? 0),
  published: Boolean(row.published),
  created_at: row.created_at ?? null,
  updated_at: row.updated_at,
});

export const getAdminGuides = async (): Promise<Guide[]> => {
  const client = assertSupabase();

  const { data, error } = await client
    .schema("ghq_guides")
    .from("guides")
    .select(GUIDE_SELECT_V3)
    .order("order_index", { ascending: true })
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (!error && data) {
    return (data as GuideRow[] | null)?.map(toGuide) ?? [];
  }

  const { data: fallbackData, error: fallbackError } = await client
    .schema("ghq_guides")
    .from("guides")
    .select(GUIDE_SELECT_V1)
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (fallbackError) throw fallbackError;
  return (fallbackData as GuideRow[] | null)?.map(toGuide) ?? [];
};

export const getAdminGuideById = async (id: string): Promise<Guide | null> => {
  const client = assertSupabase();

  const { data, error } = await client
    .schema("ghq_guides")
    .from("guides")
    .select(GUIDE_SELECT_V3)
    .eq("id", id)
    .maybeSingle();

  if (!error && data) {
    return toGuide(data as GuideRow);
  }

  const { data: fallbackData, error: fallbackError } = await client
    .schema("ghq_guides")
    .from("guides")
    .select(GUIDE_SELECT_V1)
    .eq("id", id)
    .maybeSingle();

  if (fallbackError) throw fallbackError;
  return fallbackData ? toGuide(fallbackData as GuideRow) : null;
};

export const saveAdminGuide = async (input: AdminGuideInput): Promise<void> => {
  const client = assertSupabase();

  let nextOrderIndex: number | undefined;
  if (!input.id) {
    const { data: maxOrderRow } = await client
      .schema("ghq_guides")
      .from("guides")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    nextOrderIndex = Number((maxOrderRow as { order_index?: number | null } | null)?.order_index ?? 0) + 1;
  }

  const payload = {
    title: input.title,
    slug: input.slug,
    description: input.description,
    cover_image: input.cover_image,
    category: input.category,
    audience_market: input.audience_market,
    level: input.level,
    material_symbol: input.material_symbol,
    featured: input.featured,
    published: input.published,
    updated_at: new Date().toISOString(),
  };

  const createPayload = {
    ...payload,
    order_index: nextOrderIndex ?? 0,
  };

  if (input.id) {
    const { error } = await client
      .schema("ghq_guides")
      .from("guides")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      const legacyPayload = {
        title: input.title,
        slug: input.slug,
        description: input.description,
        cover_image: input.cover_image,
        category: input.category,
        featured: input.featured,
        published: input.published,
        updated_at: new Date().toISOString(),
      };

      const { error: fallbackError } = await client
        .schema("ghq_guides")
        .from("guides")
        .update(legacyPayload)
        .eq("id", input.id);

      if (fallbackError) throw fallbackError;
    }
    return;
  }

  const { error } = await client.schema("ghq_guides").from("guides").insert(createPayload);
  if (error) {
    const legacyPayload = {
      title: input.title,
      slug: input.slug,
      description: input.description,
      cover_image: input.cover_image,
      category: input.category,
      featured: input.featured,
      published: input.published,
      updated_at: new Date().toISOString(),
    };
    const { error: fallbackError } = await client.schema("ghq_guides").from("guides").insert(legacyPayload);
    if (fallbackError) throw fallbackError;
  }
};

export const swapGuideOrder = async (sourceGuideId: string, targetGuideId: string): Promise<void> => {
  const client = assertSupabase();
  const guides = await getAdminGuides();

  const source = guides.find((guide) => guide.id === sourceGuideId);
  const target = guides.find((guide) => guide.id === targetGuideId);

  if (!source || !target) return;

  const timestamp = new Date().toISOString();

  const { error: firstError } = await client
    .schema("ghq_guides")
    .from("guides")
    .update({ order_index: target.order_index, updated_at: timestamp })
    .eq("id", source.id);
  if (firstError) throw firstError;

  const { error: secondError } = await client
    .schema("ghq_guides")
    .from("guides")
    .update({ order_index: source.order_index, updated_at: timestamp })
    .eq("id", target.id);
  if (secondError) throw secondError;
};

export const setGuidePublished = async (guideId: string, published: boolean): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client
    .schema("ghq_guides")
    .from("guides")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", guideId);

  if (error) throw error;
};

export const setGuideFeatured = async (guideId: string, featured: boolean): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client
    .schema("ghq_guides")
    .from("guides")
    .update({ featured, updated_at: new Date().toISOString() })
    .eq("id", guideId);

  if (error) throw error;
};

export const getGuideSections = async (guideId: string): Promise<GuideSection[]> => {
  const client = assertSupabase();
  const { data, error } = await client
    .schema("ghq_guides")
    .from("sections")
    .select("id, guide_id, title, order_index")
    .eq("guide_id", guideId)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data as SectionRow[] | null)?.map(toSection) ?? [];
};

export const addGuideSection = async (guideId: string, title: string): Promise<void> => {
  const client = assertSupabase();
  const sections = await getGuideSections(guideId);
  const nextIndex = sections.length > 0 ? Math.max(...sections.map((s) => s.order_index)) + 1 : 0;

  const { error } = await client
    .schema("ghq_guides")
    .from("sections")
    .insert({ guide_id: guideId, title, order_index: nextIndex });

  if (error) throw error;
};

export const deleteGuideSection = async (sectionId: string): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client.schema("ghq_guides").from("sections").delete().eq("id", sectionId);
  if (error) throw error;
};

export const getGuideArticles = async (guideId: string): Promise<GuideArticle[]> => {
  const client = assertSupabase();
  const { data, error } = await client
    .schema("ghq_guides")
    .from("articles")
    .select(ARTICLE_SELECT_V2)
    .eq("guide_id", guideId)
    .order("order_index", { ascending: true });

  if (!error && data) {
    return (data as ArticleRow[] | null)?.map(toArticle) ?? [];
  }

  const { data: fallbackData, error: fallbackError } = await client
    .schema("ghq_guides")
    .from("articles")
    .select(ARTICLE_SELECT_V1)
    .eq("guide_id", guideId)
    .order("order_index", { ascending: true });

  if (fallbackError) throw fallbackError;
  return (fallbackData as ArticleRow[] | null)?.map(toArticle) ?? [];
};

export const getAdminArticleById = async (id: string): Promise<GuideArticle | null> => {
  const client = assertSupabase();
  const { data, error } = await client
    .schema("ghq_guides")
    .from("articles")
    .select(ARTICLE_SELECT_V2)
    .eq("id", id)
    .maybeSingle();

  if (!error && data) {
    return toArticle(data as ArticleRow);
  }

  const { data: fallbackData, error: fallbackError } = await client
    .schema("ghq_guides")
    .from("articles")
    .select(ARTICLE_SELECT_V1)
    .eq("id", id)
    .maybeSingle();

  if (fallbackError) throw fallbackError;
  return fallbackData ? toArticle(fallbackData as ArticleRow) : null;
};

export const saveAdminArticle = async (input: AdminArticleInput): Promise<void> => {
  const client = assertSupabase();

  const payload = {
    guide_id: input.guide_id,
    section_id: input.section_id,
    title: input.title,
    slug: input.slug,
    synopsis: input.synopsis,
    content: input.content,
    reading_time_minutes: input.reading_time_minutes,
    order_index: input.order_index,
    published: input.published,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await client
      .schema("ghq_guides")
      .from("articles")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      const legacyPayload = {
        guide_id: input.guide_id,
        section_id: input.section_id,
        title: input.title,
        slug: input.slug,
        content: input.content,
        order_index: input.order_index,
        published: input.published,
        updated_at: new Date().toISOString(),
      };
      const { error: fallbackError } = await client
        .schema("ghq_guides")
        .from("articles")
        .update(legacyPayload)
        .eq("id", input.id);
      if (fallbackError) throw fallbackError;
    }
    return;
  }

  const { error } = await client.schema("ghq_guides").from("articles").insert(payload);
  if (error) {
    const legacyPayload = {
      guide_id: input.guide_id,
      section_id: input.section_id,
      title: input.title,
      slug: input.slug,
      content: input.content,
      order_index: input.order_index,
      published: input.published,
      updated_at: new Date().toISOString(),
    };
    const { error: fallbackError } = await client.schema("ghq_guides").from("articles").insert(legacyPayload);
    if (fallbackError) throw fallbackError;
  }
};

export const moveGuideSection = async (guideId: string, sectionId: string, direction: "up" | "down"): Promise<void> => {
  const client = assertSupabase();
  const sections = await getGuideSections(guideId);
  const currentIndex = sections.findIndex((section) => section.id === sectionId);
  if (currentIndex < 0) return;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= sections.length) return;

  const current = sections[currentIndex];
  const target = sections[targetIndex];

  const { error: firstError } = await client
    .schema("ghq_guides")
    .from("sections")
    .update({ order_index: target.order_index })
    .eq("id", current.id);
  if (firstError) throw firstError;

  const { error: secondError } = await client
    .schema("ghq_guides")
    .from("sections")
    .update({ order_index: current.order_index })
    .eq("id", target.id);
  if (secondError) throw secondError;
};

export const moveGuideArticle = async (guideId: string, articleId: string, direction: "up" | "down"): Promise<void> => {
  const client = assertSupabase();
  const articles = await getGuideArticles(guideId);
  const currentIndex = articles.findIndex((article) => article.id === articleId);
  if (currentIndex < 0) return;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= articles.length) return;

  const current = articles[currentIndex];
  const target = articles[targetIndex];

  const { error: firstError } = await client
    .schema("ghq_guides")
    .from("articles")
    .update({ order_index: target.order_index, updated_at: new Date().toISOString() })
    .eq("id", current.id);
  if (firstError) throw firstError;

  const { error: secondError } = await client
    .schema("ghq_guides")
    .from("articles")
    .update({ order_index: current.order_index, updated_at: new Date().toISOString() })
    .eq("id", target.id);
  if (secondError) throw secondError;
};
