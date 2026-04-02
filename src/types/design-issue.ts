export type Severity = "minor" | "moderate" | "major";

export interface DesignIssue {
  id: string;
  title: string;
  category: string;
  severity: Severity;
  body: string;
  how_to_fix: string;
  published: boolean;
  order_index: number;
}
