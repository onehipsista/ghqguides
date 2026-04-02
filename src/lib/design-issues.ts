import { MOCK_ISSUES } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import type { DesignIssue, Severity } from "@/types/design-issue";

export type IssuesSource = "design_issues" | "blurbs" | "mock";

export interface IssuesResult {
  issues: DesignIssue[];
  source: IssuesSource;
}

interface DesignIssueRow {
  id: string;
  title: string;
  category: string;
  severity: string;
  body: string;
  how_to_fix: string;
  published: boolean;
  order_index: number;
}

const parseSeverity = (value: unknown): Severity => {
  if (value === "minor" || value === "moderate" || value === "major") {
    return value;
  }

  return "moderate";
};

const toDesignIssue = (row: DesignIssueRow): DesignIssue => ({
  id: row.id,
  title: row.title,
  category: row.category,
  severity: parseSeverity(row.severity),
  body: row.body,
  how_to_fix: row.how_to_fix,
  published: row.published,
  order_index: row.order_index,
});

const mapBlurbRowToIssue = (row: Record<string, unknown>, index: number): DesignIssue => {
  const rawTitle =
    row.title ?? row.issue_title ?? row.name ?? row.headline ?? row.summary ?? row.blurb;
  const rawBody = row.body ?? row.blurb ?? row.content ?? row.description ?? "";
  const rawFix =
    row.how_to_fix ?? row.fix ?? row.solution ?? row.recommendation ?? "Upgrade to view fix";

  return {
    id: String(row.id ?? `blurb-${index + 1}`),
    title: String(rawTitle ?? `Design Issue ${index + 1}`),
    category: String(row.category ?? row.issue_category ?? "General"),
    severity: parseSeverity(row.severity),
    body: String(rawBody),
    how_to_fix: String(rawFix),
    published: Boolean(row.published ?? true),
    order_index: Number(row.order_index ?? index + 1),
  };
};

const getMockIssues = (): DesignIssue[] =>
  MOCK_ISSUES.filter((issue) => issue.published).sort((a, b) => a.order_index - b.order_index);

export const getPublicIssues = async (): Promise<IssuesResult> => {
  if (!supabase) {
    return { issues: getMockIssues(), source: "mock" };
  }

  const { data: designIssues, error: designIssuesError } = await supabase
    .schema("ghq_guides")
    .from("design_issues")
    .select("id, title, category, severity, body, how_to_fix, published, order_index")
    .eq("published", true)
    .order("order_index", { ascending: true });

  if (!designIssuesError && designIssues && designIssues.length > 0) {
    return {
      issues: designIssues.map((row) => toDesignIssue(row as DesignIssueRow)),
      source: "design_issues",
    };
  }

  const { data: blurbsDataFromView, error: blurbsViewError } = await supabase
    .schema("ghq_guides")
    .from("blurbs_readonly")
    .select("*")
    .limit(100)
    .order("id", { ascending: true });

  const blurbsData = blurbsDataFromView && blurbsDataFromView.length > 0
    ? blurbsDataFromView
    : null;

  const { data: blurbsDataFromPublic, error: blurbsPublicError } = blurbsData
    ? { data: null, error: null }
    : await supabase
        .from("blurbs")
        .select("*")
        .limit(100)
        .order("id", { ascending: true });

  const finalBlurbsData = blurbsData ?? blurbsDataFromPublic;
  const blurbsError = blurbsViewError ?? blurbsPublicError;

  if (!blurbsError && finalBlurbsData && finalBlurbsData.length > 0) {
    const mapped = finalBlurbsData
      .map((row, index) => mapBlurbRowToIssue(row as Record<string, unknown>, index))
      .filter((issue) => issue.published)
      .sort((a, b) => a.order_index - b.order_index);

    if (mapped.length > 0) {
      return {
        issues: mapped,
        source: "blurbs",
      };
    }
  }

  return { issues: getMockIssues(), source: "mock" };
};
