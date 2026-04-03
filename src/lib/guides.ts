import { supabase } from "@/lib/supabase";
import { estimateReadingTimeMinutes } from "@/lib/guide-options";
import type { Guide, GuideArticle, GuideSection, GuidesSource } from "@/types/guide";

export interface GuidesResult {
  guides: Guide[];
  source: GuidesSource;
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
  content?: string | null;
  reading_time_minutes?: number | null;
  order_index: number | null;
  published: boolean | null;
  created_at?: string | null;
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

const mockGuides: Guide[] = [];

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

export const getPublicGuides = async (): Promise<GuidesResult> => {
  if (!supabase) {
    return { guides: mockGuides, source: "mock" };
  }

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("guides")
    .select(GUIDE_SELECT_V3)
    .eq("published", true)
    .order("order_index", { ascending: true })
    .order("featured", { ascending: false })
    .order("updated_at", { ascending: false, nullsFirst: false });

  const v2Data = data as GuideRow[] | null;
  if (!error && v2Data) {
    return {
      guides: v2Data.map(toGuide),
      source: "guides",
    };
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .schema("ghq_guides")
    .from("guides")
    .select(GUIDE_SELECT_V1)
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (fallbackError || !fallbackData) {
    return { guides: mockGuides, source: "mock" };
  }

  return {
    guides: (fallbackData as GuideRow[]).map(toGuide),
    source: "guides",
  };
};

export interface GuideOverviewResult {
  guide: Guide | null;
  sections: GuideSection[];
  articles: GuideArticle[];
  source: GuidesSource;
}

export const getGuideOverviewBySlug = async (slug: string): Promise<GuideOverviewResult> => {
  if (!supabase) {
    return { guide: null, sections: [], articles: [], source: "mock" };
  }

  const { data: guideData, error: guideError } = await supabase
    .schema("ghq_guides")
    .from("guides")
    .select(GUIDE_SELECT_V3)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  const safeGuideData = guideData
    ? guideData
    : (
        guideError
          ? await supabase
              .schema("ghq_guides")
              .from("guides")
              .select(GUIDE_SELECT_V1)
              .eq("slug", slug)
              .eq("published", true)
              .maybeSingle()
          : { data: null }
      ).data;

  if (!safeGuideData) {
    return { guide: null, sections: [], articles: [], source: "mock" };
  }

  const guide = toGuide(safeGuideData as GuideRow);

  const [{ data: sectionsData }, { data: articlesData, error: articlesError }] = await Promise.all([
    supabase
      .schema("ghq_guides")
      .from("sections")
      .select("id, guide_id, title, order_index")
      .eq("guide_id", guide.id)
      .order("order_index", { ascending: true }),
    supabase
      .schema("ghq_guides")
      .from("articles")
      .select(ARTICLE_SELECT_V2)
      .eq("guide_id", guide.id)
      .eq("published", true)
      .order("order_index", { ascending: true }),
  ]);

  const safeArticlesData = articlesData
    ? articlesData
    : (
        articlesError
          ? await supabase
              .schema("ghq_guides")
              .from("articles")
              .select(ARTICLE_SELECT_V1)
              .eq("guide_id", guide.id)
              .eq("published", true)
              .order("order_index", { ascending: true })
          : { data: [] }
      ).data;

  return {
    guide,
    sections: (sectionsData as SectionRow[] | null)?.map(toSection) ?? [],
    articles: (safeArticlesData as ArticleRow[] | null)?.map(toArticle) ?? [],
    source: "guides",
  };
};

export interface GuideArticleResult {
  guide: Guide | null;
  section: GuideSection | null;
  article: GuideArticle | null;
  prevArticle: GuideArticle | null;
  nextArticle: GuideArticle | null;
  sections: GuideSection[];
  articles: GuideArticle[];
  relatedGuides: Guide[];
  source: GuidesSource;
}

export const getGuideArticleBySlugs = async (
  guideSlug: string,
  articleSlug: string
): Promise<GuideArticleResult> => {
  if (!supabase) {
    return {
      guide: null,
      section: null,
      article: null,
      prevArticle: null,
      nextArticle: null,
      sections: [],
      articles: [],
      relatedGuides: [],
      source: "mock",
    };
  }

  const { data: guideData, error: guideError } = await supabase
    .schema("ghq_guides")
    .from("guides")
    .select(GUIDE_SELECT_V3)
    .eq("slug", guideSlug)
    .eq("published", true)
    .maybeSingle();

  const currentGuideData = guideData
    ? guideData
    : (
        await supabase
          .schema("ghq_guides")
          .from("guides")
          .select(GUIDE_SELECT_V1)
          .eq("slug", guideSlug)
          .eq("published", true)
          .maybeSingle()
      ).data;

  if (guideError || !currentGuideData) {
    return {
      guide: null,
      section: null,
      article: null,
      prevArticle: null,
      nextArticle: null,
      sections: [],
      articles: [],
      relatedGuides: [],
      source: "mock",
    };
  }

  const guide = toGuide(currentGuideData as GuideRow);

  const [{ data: articleData, error: articleError }, { data: allArticlesData, error: allArticlesError }, { data: sectionsData }, { data: relatedData }] = await Promise.all([
    supabase
      .schema("ghq_guides")
      .from("articles")
      .select(ARTICLE_SELECT_V2)
      .eq("guide_id", guide.id)
      .eq("slug", articleSlug)
      .eq("published", true)
      .maybeSingle(),
    supabase
      .schema("ghq_guides")
      .from("articles")
      .select(ARTICLE_SELECT_V2)
      .eq("guide_id", guide.id)
      .eq("published", true)
      .order("order_index", { ascending: true }),
    supabase
      .schema("ghq_guides")
      .from("sections")
      .select("id, guide_id, title, order_index")
      .eq("guide_id", guide.id),
    supabase
      .schema("ghq_guides")
      .from("guides")
      .select(GUIDE_SELECT_V3)
      .eq("published", true)
      .eq("category", guide.category ?? "")
      .neq("id", guide.id)
      .limit(3),
  ]);

  const safeArticleData = articleData
    ? articleData
    : (
        articleError
          ? await supabase
              .schema("ghq_guides")
              .from("articles")
              .select(ARTICLE_SELECT_V1)
              .eq("guide_id", guide.id)
              .eq("slug", articleSlug)
              .eq("published", true)
              .maybeSingle()
          : { data: null }
      ).data;

  const safeAllArticlesData = allArticlesData
    ? allArticlesData
    : (
        allArticlesError
          ? await supabase
              .schema("ghq_guides")
              .from("articles")
              .select(ARTICLE_SELECT_V1)
              .eq("guide_id", guide.id)
              .eq("published", true)
              .order("order_index", { ascending: true })
          : { data: [] }
      ).data;

  const allArticles = (safeAllArticlesData as ArticleRow[] | null)?.map(toArticle) ?? [];
  const sections = (sectionsData as SectionRow[] | null)?.map(toSection) ?? [];
  const relatedGuides = (relatedData as GuideRow[] | null)?.map(toGuide) ?? [];

  if (!safeArticleData) {
    return {
      guide,
      section: null,
      article: null,
      prevArticle: null,
      nextArticle: null,
      sections: (sectionsData as SectionRow[] | null)?.map(toSection) ?? [],
      articles: allArticles,
      relatedGuides,
      source: "guides",
    };
  }

  const article = toArticle(safeArticleData as ArticleRow);

  const currentIndex = allArticles.findIndex((item) => item.id === article.id);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex >= 0 && currentIndex < allArticles.length - 1
    ? allArticles[currentIndex + 1]
    : null;
  const section = sections.find((item) => item.id === article.section_id) ?? null;

  return {
    guide,
    section,
    article,
    prevArticle,
    nextArticle,
    sections,
    articles: allArticles,
    relatedGuides,
    source: "guides",
  };
};
