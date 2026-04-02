import { supabase } from "@/lib/supabase";
import type { Severity } from "@/types/design-issue";

export interface SearchIssueResult {
  id: string;
  title: string;
  category: string;
  severity: Severity;
  body: string;
}

export interface SearchGuideResult {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string | null;
}

export interface SearchArticleResult {
  id: string;
  title: string;
  slug: string;
  guideTitle: string;
  guideSlug: string;
}

export interface GlobalSearchResult {
  issues: SearchIssueResult[];
  guides: SearchGuideResult[];
  articles: SearchArticleResult[];
  source: "live" | "mock";
}

const parseSeverity = (value: unknown): Severity => {
  if (value === "minor" || value === "moderate" || value === "major") {
    return value;
  }

  return "moderate";
};

const includesQuery = (value: string, query: string): boolean =>
  value.toLowerCase().includes(query.toLowerCase());

export const searchPublicContent = async (query: string): Promise<GlobalSearchResult> => {
  const q = query.trim();

  if (!q) {
    return {
      issues: [],
      guides: [],
      articles: [],
      source: supabase ? "live" : "mock",
    };
  }

  if (!supabase) {
    return {
      issues: [],
      guides: [],
      articles: [],
      source: "mock",
    };
  }

  const [{ data: issuesData }, { data: guidesData }, { data: articlesData }] = await Promise.all([
    supabase
      .schema("ghq_guides")
      .from("design_issues")
      .select("id, title, category, severity, body")
      .eq("published", true)
      .limit(300),
    supabase
      .schema("ghq_guides")
      .from("guides")
      .select("id, title, slug, description, category")
      .eq("published", true)
      .limit(200),
    supabase
      .schema("ghq_guides")
      .from("articles")
      .select("id, guide_id, title, slug")
      .eq("published", true)
      .limit(500),
  ]);

  const guides = (guidesData ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    description: String(row.description ?? ""),
    category: row.category ? String(row.category) : null,
  }));

  const guideById = new Map(guides.map((guide) => [guide.id, guide]));

  const issues = (issuesData ?? [])
    .map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ""),
      title: String(row.title ?? ""),
      category: String(row.category ?? "General"),
      severity: parseSeverity(row.severity),
      body: String(row.body ?? ""),
    }))
    .filter((issue) => includesQuery(issue.title, q) || includesQuery(issue.body, q))
    .slice(0, 30);

  const filteredGuides = guides
    .filter(
      (guide) =>
        includesQuery(guide.title, q) ||
        includesQuery(guide.description, q) ||
        includesQuery(guide.category ?? "", q)
    )
    .slice(0, 30);

  const articles = (articlesData ?? [])
    .map((row: Record<string, unknown>) => {
      const guideId = String(row.guide_id ?? "");
      const guide = guideById.get(guideId);

      if (!guide) return null;

      return {
        id: String(row.id ?? ""),
        title: String(row.title ?? ""),
        slug: String(row.slug ?? ""),
        guideTitle: guide.title,
        guideSlug: guide.slug,
      };
    })
    .filter((article): article is SearchArticleResult => Boolean(article))
    .filter((article) => includesQuery(article.title, q) || includesQuery(article.guideTitle, q))
    .slice(0, 50);

  return {
    issues,
    guides: filteredGuides,
    articles,
    source: "live",
  };
};
