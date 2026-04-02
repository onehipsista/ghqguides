import { supabase } from "@/lib/supabase";
import type { DesignIssue } from "@/types/design-issue";

const mapIssue = (row: Record<string, unknown>): DesignIssue => ({
  id: String(row.id),
  title: String(row.title ?? ""),
  category: String(row.category ?? "General"),
  severity:
    row.severity === "minor" || row.severity === "moderate" || row.severity === "major"
      ? row.severity
      : "moderate",
  body: String(row.body ?? ""),
  how_to_fix: String(row.how_to_fix ?? ""),
  published: Boolean(row.published),
  order_index: Number(row.order_index ?? 0),
});

export async function getAdminIssues(): Promise<DesignIssue[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("design_issues")
    .select("id, title, category, severity, body, how_to_fix, published, order_index")
    .order("order_index", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => mapIssue(row as Record<string, unknown>));
}

export async function getAdminIssueById(issueId: string): Promise<DesignIssue | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("design_issues")
    .select("id, title, category, severity, body, how_to_fix, published, order_index")
    .eq("id", issueId)
    .single();

  if (error || !data) return null;

  return mapIssue(data as Record<string, unknown>);
}

export interface SaveIssueInput {
  id?: string;
  title: string;
  category: string;
  severity: "minor" | "moderate" | "major";
  body: string;
  how_to_fix: string;
  published: boolean;
  order_index: number;
}

export async function saveAdminIssue(input: SaveIssueInput): Promise<string | null> {
  if (!supabase) return null;

  const payload = {
    title: input.title,
    category: input.category,
    severity: input.severity,
    body: input.body,
    how_to_fix: input.how_to_fix,
    published: input.published,
    order_index: input.order_index,
  };

  if (input.id) {
    const { data, error } = await supabase
      .schema("ghq_guides")
      .from("design_issues")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return String(data?.id ?? input.id);
  }

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("design_issues")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return String(data?.id ?? "");
}

export async function setIssuePublished(issueId: string, published: boolean): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .schema("ghq_guides")
    .from("design_issues")
    .update({ published })
    .eq("id", issueId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function duplicateIssue(issueId: string): Promise<string | null> {
  if (!supabase) return null;

  const source = await getAdminIssueById(issueId);
  if (!source) {
    throw new Error("Issue not found.");
  }

  const { data: maxOrderRow } = await supabase
    .schema("ghq_guides")
    .from("design_issues")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = Number(maxOrderRow?.order_index ?? 0) + 1;

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("design_issues")
    .insert({
      title: `${source.title} (Copy)`,
      category: source.category,
      severity: source.severity,
      body: source.body,
      how_to_fix: source.how_to_fix,
      published: false,
      order_index: nextOrder,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return String(data?.id ?? "");
}

export async function moveIssue(
  issueId: string,
  direction: "up" | "down"
): Promise<void> {
  if (!supabase) return;

  const { data, error } = await supabase
    .schema("ghq_guides")
    .from("design_issues")
    .select("id, order_index")
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data || data.length < 2) {
    if (error) throw new Error(error.message);
    return;
  }

  const currentIndex = data.findIndex((item) => item.id === issueId);
  if (currentIndex === -1) return;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= data.length) return;

  const current = data[currentIndex];
  const target = data[targetIndex];

  const { error: firstError } = await supabase
    .schema("ghq_guides")
    .from("design_issues")
    .update({ order_index: target.order_index })
    .eq("id", current.id);

  if (firstError) {
    throw new Error(firstError.message);
  }

  const { error: secondError } = await supabase
    .schema("ghq_guides")
    .from("design_issues")
    .update({ order_index: current.order_index })
    .eq("id", target.id);

  if (secondError) {
    throw new Error(secondError.message);
  }
}
